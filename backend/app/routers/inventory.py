from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.inventory import InventoryRead


router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryRead])
def list_inventory(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Inventory]:
    return list(db.scalars(select(Inventory).order_by(Inventory.product_id, Inventory.variant_id)))
