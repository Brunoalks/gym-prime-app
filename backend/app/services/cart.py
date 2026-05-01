from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.schemas.cart import CartItemCreate, CartItemRead, CartRead


@dataclass
class CartLine:
    product_id: int
    variant_id: int | None
    quantity: int


cart_store: dict[int, list[CartLine]] = {}


def get_cart(user_id: int) -> list[CartLine]:
    return cart_store.setdefault(user_id, [])


def clear_cart(user_id: int) -> None:
    cart_store[user_id] = []


def add_to_cart(user_id: int, product_id: int, variant_id: int | None, quantity: int) -> list[CartLine]:
    cart = get_cart(user_id)
    for line in cart:
        if line.product_id == product_id and line.variant_id == variant_id:
            line.quantity += quantity
            return cart

    cart.append(CartLine(product_id=product_id, variant_id=variant_id, quantity=quantity))
    return cart


def get_available_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado")
    return product


def get_available_variant(db: Session, product_id: int, variant_id: int) -> ProductVariant:
    variant = db.scalar(
        select(ProductVariant).where(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
            ProductVariant.is_active.is_(True),
        )
    )
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante nao encontrada")
    return variant


def build_cart_item(line: CartLine | CartItemCreate, db: Session) -> CartItemRead:
    product = get_available_product(db, line.product_id)
    variant = None
    unit_price = product.price
    name = product.name

    if line.variant_id is not None:
        variant = get_available_variant(db, product.id, line.variant_id)
        unit_price = variant.price if variant.price is not None else product.price
        name = f"{product.name} - {variant.name}"

    total_price = unit_price * line.quantity
    return CartItemRead(
        product_id=product.id,
        variant_id=variant.id if variant is not None else None,
        name=name,
        quantity=line.quantity,
        unit_price=unit_price,
        total_price=total_price,
    )


def build_cart_response(user_id: int, db: Session) -> CartRead:
    items = [build_cart_item(line, db) for line in get_cart(user_id)]
    total_amount = sum((item.total_price for item in items), Decimal("0"))

    return CartRead(items=items, total_amount=total_amount)
