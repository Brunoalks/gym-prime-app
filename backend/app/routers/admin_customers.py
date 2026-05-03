from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin_customers import AdminCustomerRead
from app.services.admin_customers import list_admin_customers


router = APIRouter(prefix="/admin/customers", tags=["admin-customers"])


@router.get("", response_model=list[AdminCustomerRead])
def read_admin_customers(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[AdminCustomerRead]:
    return list_admin_customers(db)
