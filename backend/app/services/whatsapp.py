from decimal import Decimal
from urllib.parse import quote

from app.schemas.cart import CartItemRead


def build_order_message(customer_name: str, items: list[CartItemRead], total_amount: Decimal) -> str:
    item_lines = "\n".join(
        f"- {item.quantity}x {item.name}: R$ {item.total_price:.2f}"
        for item in items
    )
    return f"Novo pedido\nCliente: {customer_name}\nItens:\n{item_lines}\nTotal: R$ {total_amount:.2f}"


def build_wa_me_url(message: str, phone: str | None = None) -> str:
    encoded_message = quote(message)
    if phone:
        return f"https://wa.me/{phone}?text={encoded_message}"
    return f"https://wa.me/?text={encoded_message}"
