from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(default=0)
    min_quantity: Mapped[int] = mapped_column(default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    product: Mapped["Product"] = relationship(back_populates="inventory_records")
    variant: Mapped["ProductVariant | None"] = relationship(back_populates="inventory")
