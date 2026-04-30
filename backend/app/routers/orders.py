from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderRead


router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Order]:
    return list(
        db.scalars(
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .limit(100)
        )
    )
