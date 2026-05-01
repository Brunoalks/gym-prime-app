from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.schemas.cart import CartItemCreate, CartItemRead
from app.services.cart import CartLine


def decrement_inventory(db: Session, line: CartLine | CartItemCreate, item: CartItemRead) -> None:
    if line.variant_id is not None:
        inventory = db.scalar(select(Inventory).where(Inventory.variant_id == line.variant_id))
    else:
        inventory = db.scalar(
            select(Inventory).where(
                Inventory.product_id == line.product_id,
                Inventory.variant_id.is_(None),
            )
        )

    if inventory is None:
        return

    if inventory.quantity < line.quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Estoque insuficiente para {item.name}",
        )
    inventory.quantity -= line.quantity
