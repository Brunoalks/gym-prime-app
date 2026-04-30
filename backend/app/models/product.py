from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    code: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    inventory_records: Mapped[list["Inventory"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
