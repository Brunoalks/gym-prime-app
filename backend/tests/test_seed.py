from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.seed import DEMO_INVENTORY, DEMO_PRODUCTS, DEMO_VARIANTS, seed_database


def test_seed_is_idempotent(db_session: Session, monkeypatch):
    monkeypatch.setenv("SEED_ADMIN_EMAIL", "admin.seed@example.com")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "password123")
    monkeypatch.setenv("SEED_ADMIN_NAME", "Admin Seed")
    get_settings.cache_clear()

    seed_database(db_session)
    db_session.commit()
    seed_database(db_session)
    db_session.commit()

    assert db_session.query(User).filter(User.email == "admin.seed@example.com").count() == 1
    assert db_session.query(Product).count() == len(DEMO_PRODUCTS)
    assert db_session.query(ProductVariant).count() == len(DEMO_VARIANTS)
    assert db_session.query(Inventory).count() == len(DEMO_INVENTORY)

    get_settings.cache_clear()
