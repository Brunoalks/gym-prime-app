from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AdminCustomerRead(BaseModel):
    id: int
    full_name: str
    email: str
    cpf_masked: str | None
    total_orders: int
    last_order_at: datetime | None
    total_spent: Decimal
