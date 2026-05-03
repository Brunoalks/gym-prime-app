from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin_analytics import AdminAnalyticsSummary, AdminSalesSeries
from app.services.admin_analytics import get_admin_analytics_summary, get_admin_sales_series


router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("/summary", response_model=AdminAnalyticsSummary)
def read_admin_analytics_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminAnalyticsSummary:
    return get_admin_analytics_summary(db)


@router.get("/sales-series", response_model=AdminSalesSeries)
def read_admin_sales_series(
    period: Literal["hour", "day", "week", "month"] = Query(default="hour"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminSalesSeries:
    return get_admin_sales_series(db, period)
