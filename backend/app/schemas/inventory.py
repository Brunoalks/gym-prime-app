from datetime import datetime

from pydantic import BaseModel, Field


class InventoryUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=0)
    min_quantity: int | None = Field(default=None, ge=0)


class InventoryRead(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    quantity: int
    min_quantity: int
    updated_at: datetime

    model_config = {"from_attributes": True}
