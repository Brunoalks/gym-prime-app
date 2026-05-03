from datetime import datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.order import Order


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


def test_admin_sales_series_requires_authentication(client: TestClient):
    response = client.get("/admin/analytics/sales-series")

    assert response.status_code == 401


def test_admin_sales_series_forbids_non_admin(authenticated_client: TestClient):
    response = authenticated_client.get("/admin/analytics/sales-series")

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


def test_admin_sales_series_returns_real_aggregated_sales(admin_client: TestClient, db_session: Session):
    now = datetime.now()
    current_hour = now.replace(minute=15, second=0, microsecond=0)
    yesterday = now - timedelta(days=1)
    previous_week = now - timedelta(days=7)
    previous_month = now - timedelta(days=70)
    old_order = now - timedelta(days=420)
    db_session.add_all(
        [
            Order(total_amount=Decimal("40.00"), customer_name="Totem", created_at=current_hour),
            Order(total_amount=Decimal("12.50"), customer_name="Totem", created_at=current_hour),
            Order(total_amount=Decimal("20.00"), customer_name="Cliente", created_at=yesterday),
            Order(total_amount=Decimal("33.00"), customer_name="Cliente", created_at=previous_week),
            Order(total_amount=Decimal("77.00"), customer_name="Cliente", created_at=previous_month),
            Order(total_amount=Decimal("999.00"), customer_name="Fora da janela", created_at=old_order),
        ]
    )
    db_session.commit()

    hour_response = admin_client.get("/admin/analytics/sales-series?period=hour")
    assert hour_response.status_code == 200
    hour_data = hour_response.json()
    assert hour_data["period"] == "hour"
    assert len(hour_data["points"]) == 24
    current_hour_point = next(point for point in hour_data["points"] if point["key"] == f"{now.hour:02d}")
    assert current_hour_point["total_amount"] == "52.50"
    assert current_hour_point["orders_count"] == 2

    day_response = admin_client.get("/admin/analytics/sales-series?period=day")
    assert day_response.status_code == 200
    day_data = day_response.json()
    assert day_data["period"] == "day"
    assert len(day_data["points"]) == 14
    today_point = next(point for point in day_data["points"] if point["key"] == now.date().isoformat())
    assert today_point["total_amount"] == "52.50"
    assert today_point["orders_count"] == 2
    yesterday_point = next(point for point in day_data["points"] if point["key"] == yesterday.date().isoformat())
    assert yesterday_point["total_amount"] == "20.00"

    week_response = admin_client.get("/admin/analytics/sales-series?period=week")
    assert week_response.status_code == 200
    week_data = week_response.json()
    assert week_data["period"] == "week"
    assert len(week_data["points"]) == 8
    assert sum(Decimal(point["total_amount"]) for point in week_data["points"]) == Decimal("105.50")

    month_response = admin_client.get("/admin/analytics/sales-series?period=month")
    assert month_response.status_code == 200
    month_data = month_response.json()
    assert month_data["period"] == "month"
    assert len(month_data["points"]) == 12
    assert sum(Decimal(point["total_amount"]) for point in month_data["points"]) == Decimal("182.50")
