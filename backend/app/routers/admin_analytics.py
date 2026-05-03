from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin_analytics import AdminAnalyticsSummary
from app.services.admin_analytics import get_admin_analytics_summary


router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("/summary", response_model=AdminAnalyticsSummary)
def read_admin_analytics_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminAnalyticsSummary:
    return get_admin_analytics_summary(db)
