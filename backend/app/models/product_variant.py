from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = (UniqueConstraint("product_id", "code", name="uq_product_variant_code"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    code: Mapped[str] = mapped_column(String(60), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    product: Mapped["Product"] = relationship(back_populates="variants")
    inventory: Mapped["Inventory | None"] = relationship(back_populates="variant")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="variant")
