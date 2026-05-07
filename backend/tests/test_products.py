from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.inventory import Inventory


def test_admin_product_crud(admin_client: TestClient):
    create_response = admin_client.post(
        "/products",
        json={
            "name": "Produto QA",
            "code": "produto-qa",
            "description": "Produto para teste",
            "price": "12.50",
        },
    )
    assert create_response.status_code == 201
    product = create_response.json()
    assert product["category"] == "snacks"

    list_response = admin_client.get("/products")
    assert list_response.status_code == 200
    assert any(item["id"] == product["id"] for item in list_response.json())

    update_response = admin_client.patch(
        f"/products/{product['id']}",
        json={"price": "14.00", "description": "Produto atualizado"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["price"] == "14.00"

    delete_response = admin_client.delete(f"/products/{product['id']}")
    assert delete_response.status_code == 204

    products = admin_client.get("/products").json()
    deleted_product = next(item for item in products if item["id"] == product["id"])
    assert deleted_product["is_active"] is False


def test_admin_variant_creation_belongs_to_product(admin_client: TestClient):
    product_response = admin_client.post(
        "/products",
        json={
            "name": "Bebida QA",
            "code": "bebida-qa",
            "price": "9.00",
        },
    )
    product = product_response.json()

    variant_response = admin_client.post(
        f"/products/{product['id']}/variants",
        json={
            "name": "Zero",
            "code": "zero",
            "price": "9.50",
        },
    )

    assert variant_response.status_code == 201
    variant = variant_response.json()
    assert variant["product_id"] == product["id"]
    assert variant["name"] == "Zero"


def test_admin_can_create_inventory_records(admin_client: TestClient, db_session: Session):
    product_response = admin_client.post(
        "/products",
        json={
            "name": "Estoque QA",
            "code": "estoque-qa",
            "price": "9.00",
            "category": "drinks",
        },
    )
    product = product_response.json()
    base_response = admin_client.post(
        "/inventory",
        json={"product_id": product["id"], "variant_id": None, "quantity": 3, "min_quantity": 1},
    )
    assert base_response.status_code == 201
    base_inventory = db_session.query(Inventory).filter_by(product_id=product["id"], variant_id=None).one()
    assert base_inventory.quantity == 3

    variant_response = admin_client.post(
        f"/products/{product['id']}/variants",
        json={
            "name": "Lata",
            "code": "lata",
            "price": "9.50",
        },
    )
    variant = variant_response.json()

    variant_inventory_response = admin_client.post(
        "/inventory",
        json={"product_id": product["id"], "variant_id": variant["id"], "quantity": 7, "min_quantity": 2},
    )
    assert variant_inventory_response.status_code == 201
    variant_inventory = db_session.query(Inventory).filter_by(product_id=product["id"], variant_id=variant["id"]).one()
    assert variant_inventory.min_quantity == 2


def test_duplicate_product_code_returns_conflict(admin_client: TestClient):
    payload = {
        "name": "Produto Unico",
        "code": "produto-unico",
        "price": "10.00",
    }
    assert admin_client.post("/products", json=payload).status_code == 201

    response = admin_client.post("/products", json={**payload, "name": "Produto Duplicado"})

    assert response.status_code == 409
    assert response.json()["detail"] == "Codigo de produto ou variante ja cadastrado"
