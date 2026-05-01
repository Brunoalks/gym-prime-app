from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.inventory import InventoryRead, InventoryUpdate
from app.services.audit import create_audit_log


router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryRead])
def list_inventory(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Inventory]:
    return list(db.scalars(select(Inventory).order_by(Inventory.product_id, Inventory.variant_id)))


@router.patch("/{inventory_id}", response_model=InventoryRead)
def update_inventory(
    inventory_id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Inventory:
    inventory = db.get(Inventory, inventory_id)
    if inventory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estoque nao encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(inventory, field, value)

    create_audit_log(
        db,
        action="inventory.updated",
        entity="inventory",
        entity_id=inventory.id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(inventory)
    return inventory
