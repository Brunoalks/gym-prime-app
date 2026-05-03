from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user import User
from app.schemas.admin_customers import AdminCustomerRead


def mask_cpf(cpf: str | None) -> str | None:
    if not cpf:
        return None

    digits = "".join(character for character in cpf if character.isdigit())
    if len(digits) < 2:
        return "***.***.***-**"
    return f"***.***.***-{digits[-2:]}"


def list_admin_customers(db: Session) -> list[AdminCustomerRead]:
    users = db.scalars(
        select(User)
        .where(User.is_admin.is_(False))
        .options(selectinload(User.orders))
        .order_by(User.full_name)
    )

    customers = []
    for user in users:
        orders = sorted(user.orders, key=lambda order: order.created_at, reverse=True)
        total_spent = sum((Decimal(order.total_amount) for order in orders), Decimal("0"))
        customers.append(
            AdminCustomerRead(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                cpf_masked=mask_cpf(user.cpf),
                total_orders=len(orders),
                last_order_at=orders[0].created_at if orders else None,
                total_spent=total_spent,
            )
        )
    return customers
