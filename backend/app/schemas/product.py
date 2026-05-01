from decimal import Decimal

from pydantic import BaseModel, Field


class ProductVariantBase(BaseModel):
    name: str = Field(min_length=1, max_length=120, pattern=r".*\S.*")
    code: str = Field(min_length=1, max_length=60, pattern=r".*\S.*")
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    price: Decimal | None = Field(default=None, ge=0)
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120, pattern=r".*\S.*")
    code: str | None = Field(default=None, min_length=1, max_length=60, pattern=r".*\S.*")
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    price: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductVariantRead(ProductVariantBase):
    id: int
    product_id: int

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=120, pattern=r".*\S.*")
    code: str = Field(min_length=1, max_length=60, pattern=r".*\S.*")
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    price: Decimal = Field(ge=0)
    is_active: bool = True


class ProductCreate(ProductBase):
    variants: list[ProductVariantCreate] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120, pattern=r".*\S.*")
    code: str | None = Field(default=None, min_length=1, max_length=60, pattern=r".*\S.*")
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    price: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductRead(ProductBase):
    id: int
    variants: list[ProductVariantRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}
