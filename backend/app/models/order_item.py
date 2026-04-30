from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), index=True)
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        index=True,
    )
    quantity: Mapped[int] = mapped_column(default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")
    variant: Mapped["ProductVariant | None"] = relationship(back_populates="order_items")
