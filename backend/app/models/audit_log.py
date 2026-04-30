from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity: Mapped[str | None] = mapped_column(String(80), index=True)
    entity_id: Mapped[int | None] = mapped_column(index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user: Mapped["User | None"] = relationship(back_populates="audit_logs")
