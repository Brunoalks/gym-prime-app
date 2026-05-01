from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_id: int
    variant_id: int | None = None
    quantity: int = Field(default=1, ge=1)


class CartItemRead(BaseModel):
    product_id: int
    variant_id: int | None
    name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class CartRead(BaseModel):
    items: list[CartItemRead]
    total_amount: Decimal


class CheckoutRead(BaseModel):
    order_id: int
    total_amount: Decimal
    whatsapp_url: str


class TotemCheckoutCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120, pattern=r".*\S.*")
    items: list[CartItemCreate] = Field(min_length=1)
