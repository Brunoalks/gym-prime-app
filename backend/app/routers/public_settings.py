from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.admin_settings import AppSettingsRead
from app.services.app_settings import get_app_settings


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/public", response_model=AppSettingsRead)
def read_public_settings(db: Session = Depends(get_db)) -> AppSettingsRead:
    return get_app_settings(db)
