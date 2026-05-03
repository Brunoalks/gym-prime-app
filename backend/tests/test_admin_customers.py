from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.user import User


def test_admin_customers_requires_authentication(client: TestClient):
    response = client.get("/admin/customers")

    assert response.status_code == 401


def test_admin_customers_forbids_non_admin(authenticated_client: TestClient):
    response = authenticated_client.get("/admin/customers")

    assert response.status_code == 403


def test_admin_customers_masks_cpf_and_omits_sensitive_fields(admin_client: TestClient, db_session: Session):
    customer = User(
        full_name="Cliente LGPD",
        email="cliente.lgpd@example.com",
        cpf="98765432100",
        password_hash="hashed",
        is_admin=False,
    )
    db_session.add(customer)
    db_session.flush()
    db_session.add(Order(user_id=customer.id, customer_name=customer.full_name, total_amount="27.50"))
    db_session.commit()

    response = admin_client.get("/admin/customers")

    assert response.status_code == 200
    data = response.json()
    customer_data = next(item for item in data if item["email"] == "cliente.lgpd@example.com")
    assert customer_data["cpf_masked"] == "***.***.***-00"
    assert customer_data["total_orders"] == 1
    assert customer_data["total_spent"] == "27.50"
    assert "password_hash" not in customer_data
    assert "cpf" not in customer_data
    assert "98765432100" not in response.text
