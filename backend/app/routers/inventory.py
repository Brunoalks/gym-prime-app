from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryRead, InventoryUpdate
from app.services.audit import create_audit_log


router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryRead])
def list_inventory(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Inventory]:
    return list(db.scalars(select(Inventory).order_by(Inventory.product_id, Inventory.variant_id)))


@router.post("", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Inventory:
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

    inventory = Inventory(**payload.model_dump())
    db.add(inventory)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Estoque ja cadastrado") from exc

    create_audit_log(
        db,
        action="inventory.created",
        entity="inventory",
        entity_id=inventory.id,
        user_id=current_user.id,
    )
    db.commit()
    db.refresh(inventory)
    return inventory


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
