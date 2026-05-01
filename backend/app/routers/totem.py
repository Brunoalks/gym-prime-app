from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.cart import CheckoutRead, TotemCheckoutCreate
from app.services.audit import create_audit_log
from app.services.cart import build_cart_item
from app.services.orders import decrement_inventory
from app.services.whatsapp import build_order_message, build_wa_me_url


router = APIRouter(prefix="/totem", tags=["totem"])


@router.post("/checkout", response_model=CheckoutRead, status_code=status.HTTP_201_CREATED)
def checkout_totem(payload: TotemCheckoutCreate, db: Session = Depends(get_db)) -> CheckoutRead:
    items = [build_cart_item(line, db) for line in payload.items]
    total_amount = sum((item.total_price for item in items), Decimal("0"))

    order = Order(customer_name=payload.customer_name, total_amount=total_amount)
    db.add(order)
    db.flush()

    for line, item in zip(payload.items, items, strict=True):
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
