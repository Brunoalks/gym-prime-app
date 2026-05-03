from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderStatus
from app.services.audit import create_audit_log


def update_order_status(db: Session, order_id: int, next_status: OrderStatus, current_user: User) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido nao encontrado")

    previous_status = order.status
    order.status = next_status

    create_audit_log(
        db,
        action="order.status_updated",
        entity="order",
        entity_id=order.id,
        user_id=current_user.id,
        metadata={"previous_status": previous_status, "next_status": next_status},
    )
    db.commit()
    db.refresh(order)
    return order
