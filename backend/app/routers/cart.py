from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartRead, CheckoutRead
from app.services.cart import add_to_cart, build_cart_response, clear_cart, get_available_product, get_available_variant, get_cart
from app.services.audit import create_audit_log
from app.services.orders import decrement_inventory
from app.services.whatsapp import build_order_message, build_wa_me_url


router = APIRouter(prefix="/cart", tags=["cart"])


@router.post("/items", response_model=CartRead)
def add_cart_item(
    payload: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartRead:
    get_available_product(db, payload.product_id)
    if payload.variant_id is not None:
        get_available_variant(db, payload.product_id, payload.variant_id)

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
        decrement_inventory(db, line, item)

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
