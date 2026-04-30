from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.inventory import Inventory


def create_product_with_variant(client: TestClient) -> tuple[int, int]:
    product_response = client.post(
        "/products",
        json={
            "name": "Shake QA",
            "code": "shake-qa",
            "price": "15.00",
        },
    )
    product_id = product_response.json()["id"]
    variant_response = client.post(
        f"/products/{product_id}/variants",
        json={
            "name": "Chocolate",
            "code": "chocolate",
            "price": "17.00",
        },
    )
    return product_id, variant_response.json()["id"]


def test_authenticated_checkout_creates_order(admin_client: TestClient):
    product_id, variant_id = create_product_with_variant(admin_client)
    cart_response = admin_client.post(
        "/cart/items",
        json={"product_id": product_id, "variant_id": variant_id, "quantity": 2},
    )
    assert cart_response.status_code == 200

    checkout_response = admin_client.post("/cart/checkout")

    assert checkout_response.status_code == 201
    data = checkout_response.json()
    assert data["order_id"] > 0
    assert data["total_amount"] == "34.00"


def test_checkout_decrements_variant_inventory(admin_client: TestClient, db_session: Session):
    product_id, variant_id = create_product_with_variant(admin_client)
    inventory = Inventory(product_id=product_id, variant_id=variant_id, quantity=5, min_quantity=0)
    db_session.add(inventory)
    db_session.commit()

    admin_client.post(
        "/cart/items",
        json={"product_id": product_id, "variant_id": variant_id, "quantity": 2},
    )
    checkout_response = admin_client.post("/cart/checkout")
    db_session.refresh(inventory)

    assert checkout_response.status_code == 201
    assert inventory.quantity == 3


def test_checkout_generates_wa_me_link(admin_client: TestClient):
    product_id, variant_id = create_product_with_variant(admin_client)
    admin_client.post(
        "/cart/items",
        json={"product_id": product_id, "variant_id": variant_id, "quantity": 1},
    )

    checkout_response = admin_client.post("/cart/checkout")

    assert checkout_response.status_code == 201
    whatsapp_url = checkout_response.json()["whatsapp_url"]
    assert whatsapp_url.startswith("https://wa.me/")
    assert "Cliente%3A%20Admin%20Teste" in whatsapp_url
    assert "Total%3A%20R%24%2017.00" in whatsapp_url
