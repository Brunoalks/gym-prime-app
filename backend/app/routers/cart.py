from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemRead, CartRead, CheckoutRead
from app.services.cart import add_to_cart, clear_cart, get_cart
from app.services.audit import create_audit_log
from app.services.whatsapp import build_order_message, build_wa_me_url


router = APIRouter(prefix="/cart", tags=["cart"])


def build_cart_response(user_id: int, db: Session) -> CartRead:
    items: list[CartItemRead] = []
    total_amount = Decimal("0")

    for line in get_cart(user_id):
        product = db.get(Product, line.product_id)
        if product is None:
            continue

        variant = None
        unit_price = product.price
        name = product.name
        if line.variant_id is not None:
            variant = db.scalar(
                select(ProductVariant).where(
                    ProductVariant.id == line.variant_id,
                    ProductVariant.product_id == product.id,
                )
            )
            if variant is None:
                continue
            unit_price = variant.price if variant.price is not None else product.price
            name = f"{product.name} - {variant.name}"

        total_price = unit_price * line.quantity
        total_amount += total_price
        items.append(
            CartItemRead(
                product_id=product.id,
                variant_id=variant.id if variant is not None else None,
                name=name,
                quantity=line.quantity,
                unit_price=unit_price,
                total_price=total_price,
            )
        )

    return CartRead(items=items, total_amount=total_amount)


@router.post("/items", response_model=CartRead)
def add_cart_item(
    payload: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartRead:
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado")

    if payload.variant_id is not None:
        variant = db.scalar(
            select(ProductVariant).where(
                ProductVariant.id == payload.variant_id,
                ProductVariant.product_id == payload.product_id,
            )
        )
        if variant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante nao encontrada")

    add_to_cart(current_user.id, payload.product_id, payload.variant_id, payload.quantity)
    return build_cart_response(current_user.id, db)


@router.get("", response_model=CartRead)
def read_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartRead:
    return build_cart_response(current_user.id, db)


@router.post("/checkout", response_model=CheckoutRead, status_code=status.HTTP_201_CREATED)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckoutRead:
    cart = get_cart(current_user.id)
    if not cart:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Carrinho vazio")

    cart_response = build_cart_response(current_user.id, db)
    order = Order(
        user_id=current_user.id,
        customer_name=current_user.full_name,
        total_amount=cart_response.total_amount,
    )
    db.add(order)
    db.flush()

    for line, item in zip(cart, cart_response.items, strict=False):
        inventory = None
        if line.variant_id is not None:
            inventory = db.scalar(select(Inventory).where(Inventory.variant_id == line.variant_id))
        else:
            inventory = db.scalar(
                select(Inventory).where(
                    Inventory.product_id == line.product_id,
                    Inventory.variant_id.is_(None),
                )
            )

        if inventory is not None:
            if inventory.quantity < line.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Estoque insuficiente para {item.name}",
                )
            inventory.quantity -= line.quantity

        db.add(
            OrderItem(
                order_id=order.id,
                product_id=line.product_id,
                variant_id=line.variant_id,
                quantity=line.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
            )
        )

    message = build_order_message(current_user.full_name, cart_response.items, cart_response.total_amount)
    whatsapp_url = build_wa_me_url(message, get_settings().whatsapp_phone)
    create_audit_log(db, action="order.created", entity="order", entity_id=order.id, user_id=current_user.id)
    db.commit()
    clear_cart(current_user.id)
    return CheckoutRead(order_id=order.id, total_amount=cart_response.total_amount, whatsapp_url=whatsapp_url)
