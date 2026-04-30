from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogRead


router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[AuditLog]:
    return list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)))
