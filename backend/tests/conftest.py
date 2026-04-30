from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User
from app.services.cart import cart_store
from main import app


@pytest.fixture
def engine() -> Generator[Engine]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    cart_store.clear()
    try:
        yield engine
    finally:
        cart_store.clear()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(engine: Engine) -> Generator[Session]:
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(engine: Engine) -> Generator[TestClient]:
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db() -> Generator[Session]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def authenticated_client(client: TestClient) -> TestClient:
    client.post(
        "/auth/register",
        json={
            "full_name": "Cliente Teste",
            "email": "cliente.teste@example.com",
            "cpf": "12345678900",
            "password": "password123",
        },
    )
    client.post(
        "/auth/login",
        json={"email": "cliente.teste@example.com", "password": "password123"},
    )
    return client


@pytest.fixture
def admin_client(client: TestClient, db_session: Session) -> TestClient:
    admin = User(
        full_name="Admin Teste",
        email="admin.teste@example.com",
        cpf="11122233344",
        password_hash=hash_password("password123"),
        is_admin=True,
    )
    db_session.add(admin)
    db_session.commit()
    client.post(
        "/auth/login",
        json={"email": "admin.teste@example.com", "password": "password123"},
    )
    return client
