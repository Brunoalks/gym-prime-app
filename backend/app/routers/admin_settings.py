from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin_settings import AppSettingsRead, AppSettingsUpdate
from app.services.app_settings import get_app_settings, update_app_settings


router = APIRouter(prefix="/admin/settings", tags=["admin-settings"])


@router.get("", response_model=AppSettingsRead)
def read_admin_settings(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AppSettingsRead:
    return get_app_settings(db)


@router.patch("", response_model=AppSettingsRead)
def patch_admin_settings(
    payload: AppSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AppSettingsRead:
    return update_app_settings(db, payload, current_user.id)
