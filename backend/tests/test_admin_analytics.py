from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.inventory import Inventory


def create_product(client: TestClient, name: str = "Shake Analytics", code: str = "shake-analytics") -> int:
    response = client.post(
        "/products",
        json={
            "name": name,
            "code": code,
            "price": "15.00",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_admin_analytics_requires_authentication(client: TestClient):
    response = client.get("/admin/analytics/summary")

    assert response.status_code == 401


def test_admin_analytics_forbids_non_admin(authenticated_client: TestClient):
    response = authenticated_client.get("/admin/analytics/summary")

    assert response.status_code == 403


def test_admin_analytics_summary_returns_operational_metrics(admin_client: TestClient, db_session: Session):
    product_id = create_product(admin_client)
    db_session.add(Inventory(product_id=product_id, variant_id=None, quantity=5, min_quantity=10))
    db_session.commit()
    admin_client.post(
        "/cart/items",
        json={"product_id": product_id, "variant_id": None, "quantity": 2},
    )
    checkout_response = admin_client.post("/cart/checkout")
    assert checkout_response.status_code == 201

    response = admin_client.get("/admin/analytics/summary")

    assert response.status_code == 200
    data = response.json()
    assert data["kpis"]["orders_today"] == 1
    assert data["kpis"]["sales_today"] == "30.00"
    assert data["kpis"]["average_ticket"] == "30.00"
    assert data["kpis"]["items_sold_today"] == 2
    assert data["recent_orders"][0]["items_count"] == 2
    assert data["top_products"][0]["product_name"] == "Shake Analytics"
    assert data["top_products"][0]["quantity"] == 2
    assert data["top_products"][0]["revenue"] == "30.00"
    assert data["low_inventory"][0]["product_name"] == "Shake Analytics"
    assert len(data["hourly_sales"]) == 24
