from fastapi.testclient import TestClient


def test_admin_settings_requires_authentication(client: TestClient):
    response = client.get("/admin/settings")

    assert response.status_code == 401


def test_admin_settings_forbids_non_admin(authenticated_client: TestClient):
    response = authenticated_client.get("/admin/settings")

    assert response.status_code == 403


def test_admin_can_update_settings_and_public_settings_reflect_change(admin_client: TestClient):
    response = admin_client.patch(
        "/admin/settings",
        json={
            "establishment_name": "Gym Prime Unidade Centro",
            "whatsapp_phone": "5511999998888",
            "menu_is_open": False,
            "totem_message": "Retire seu pedido na recepcao.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["establishment_name"] == "Gym Prime Unidade Centro"
    assert data["whatsapp_phone"] == "5511999998888"
    assert data["menu_is_open"] is False
    assert data["totem_message"] == "Retire seu pedido na recepcao."

    public_response = admin_client.get("/settings/public")
    assert public_response.status_code == 200
    assert public_response.json() == data
