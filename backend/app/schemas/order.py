from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    model_config = {"from_attributes": True}


class OrderRead(BaseModel):
    id: int
    user_id: int | None
    customer_name: str | None
    status: str
    payment_method: str | None
    total_amount: Decimal
    paid_at: datetime | None
    created_at: datetime
    items: list[OrderItemRead]

    model_config = {"from_attributes": True}
