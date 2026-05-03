from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.inventory import Inventory
from app.models.order import Order


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


def test_non_admin_cannot_update_order_status(authenticated_client: TestClient, db_session: Session):
    order = Order(customer_name="Cliente QA", total_amount="10.00")
    db_session.add(order)
    db_session.commit()

    response = authenticated_client.patch(f"/orders/{order.id}/status", json={"status": "ready"})

    assert response.status_code == 403


def test_admin_can_update_order_status_and_audit(admin_client: TestClient, db_session: Session):
    order = Order(customer_name="Cliente QA", total_amount="10.00")
    db_session.add(order)
    db_session.commit()

    response = admin_client.patch(f"/orders/{order.id}/status", json={"status": "ready"})

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"

    db_session.refresh(order)
    assert order.status == "ready"
    audit_log = db_session.query(AuditLog).filter_by(action="order.status_updated", entity_id=order.id).one()
    assert audit_log.metadata_json == {"previous_status": "pending", "next_status": "ready"}


def test_admin_order_status_rejects_invalid_value(admin_client: TestClient, db_session: Session):
    order = Order(customer_name="Cliente QA", total_amount="10.00")
    db_session.add(order)
    db_session.commit()

    response = admin_client.patch(f"/orders/{order.id}/status", json={"status": "unknown"})

    assert response.status_code == 422


def test_authenticated_user_lists_only_own_orders(authenticated_client: TestClient, db_session: Session):
    own_order = Order(user_id=1, customer_name="Cliente Teste", total_amount="10.00")
    other_order = Order(user_id=999, customer_name="Outro Cliente", total_amount="99.00")
    db_session.add_all([own_order, other_order])
    db_session.commit()

    response = authenticated_client.get("/orders/me")

    assert response.status_code == 200
    data = response.json()
    assert [item["id"] for item in data] == [own_order.id]
    assert data[0]["customer_name"] == "Cliente Teste"
