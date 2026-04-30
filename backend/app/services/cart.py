from dataclasses import dataclass


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
