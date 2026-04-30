from fastapi.testclient import TestClient


def test_register_customer_creates_user_without_password_hash_in_response(client: TestClient):
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Cliente Teste",
            "email": "cliente.teste@example.com",
            "cpf": "12345678900",
            "password": "password123",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Cliente Teste"
    assert data["email"] == "cliente.teste@example.com"
    assert "password_hash" not in data


def test_login_returns_user_and_sets_http_only_cookie(client: TestClient):
    client.post(
        "/auth/register",
        json={
            "full_name": "Cliente Login",
            "email": "cliente.login@example.com",
            "cpf": "98765432100",
            "password": "password123",
        },
    )

    response = client.post(
        "/auth/login",
        json={"email": "cliente.login@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "cliente.login@example.com"
    assert "access_token=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]


def test_login_with_invalid_credentials_returns_clear_error(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "nao.existe@example.com", "password": "password123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Credenciais invalidas"


def test_register_with_duplicate_cpf_returns_conflict(client: TestClient):
    payload = {
        "full_name": "Cliente Teste",
        "email": "cliente.um@example.com",
        "cpf": "12345678900",
        "password": "password123",
    }
    client.post("/auth/register", json=payload)

    response = client.post(
        "/auth/register",
        json={**payload, "email": "cliente.dois@example.com"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "CPF ja cadastrado"


def test_session_without_cookie_returns_empty_user(client: TestClient):
    response = client.get("/auth/session")

    assert response.status_code == 200
    assert response.json() == {"user": None}
