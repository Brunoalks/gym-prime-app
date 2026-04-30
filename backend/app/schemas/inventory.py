from datetime import datetime

from pydantic import BaseModel


class InventoryRead(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    quantity: int
    min_quantity: int
    updated_at: datetime

    model_config = {"from_attributes": True}
