from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.schemas.cart import CartItemCreate, CartItemRead, CheckoutRead, TotemCheckoutCreate
from app.services.audit import create_audit_log
from app.services.whatsapp import build_order_message, build_wa_me_url


router = APIRouter(prefix="/totem", tags=["totem"])


def build_item(line: CartItemCreate, db: Session) -> CartItemRead:
    product = db.get(Product, line.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado")

    variant = None
    unit_price = product.price
    name = product.name
    if line.variant_id is not None:
        variant = db.scalar(
            select(ProductVariant).where(
                ProductVariant.id == line.variant_id,
                ProductVariant.product_id == product.id,
                ProductVariant.is_active.is_(True),
            )
        )
        if variant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante nao encontrada")
        unit_price = variant.price if variant.price is not None else product.price
        name = f"{product.name} - {variant.name}"

    total_price = unit_price * line.quantity
    return CartItemRead(
        product_id=product.id,
        variant_id=variant.id if variant is not None else None,
        name=name,
        quantity=line.quantity,
        unit_price=unit_price,
        total_price=total_price,
    )


@router.post("/checkout", response_model=CheckoutRead, status_code=status.HTTP_201_CREATED)
def checkout_totem(payload: TotemCheckoutCreate, db: Session = Depends(get_db)) -> CheckoutRead:
    items = [build_item(line, db) for line in payload.items]
    total_amount = sum((item.total_price for item in items), Decimal("0"))

    order = Order(customer_name=payload.customer_name, total_amount=total_amount)
    db.add(order)
    db.flush()

    for line, item in zip(payload.items, items, strict=True):
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

    message = build_order_message(payload.customer_name, items, total_amount)
    whatsapp_url = build_wa_me_url(message, get_settings().whatsapp_phone)
    create_audit_log(
        db,
        action="order.created",
        entity="order",
        entity_id=order.id,
        metadata={"source": "totem", "customer_name": payload.customer_name},
    )
    db.commit()
    return CheckoutRead(order_id=order.id, total_amount=total_amount, whatsapp_url=whatsapp_url)
