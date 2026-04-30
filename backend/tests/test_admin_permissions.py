from fastapi.testclient import TestClient


def test_non_admin_cannot_access_admin_orders(authenticated_client: TestClient):
    response = authenticated_client.get("/orders")

    assert response.status_code == 403


def test_admin_can_access_admin_orders(admin_client: TestClient):
    response = admin_client.get("/orders")

    assert response.status_code == 200
