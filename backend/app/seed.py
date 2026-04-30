from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User

DEMO_PRODUCTS = [
    {
        "name": "Coca-Cola",
        "code": "coca-cola",
        "description": "Refrigerante lata gelado.",
        "price": "7.00",
    },
    {
        "name": "Shake Proteico",
        "code": "shake-proteico",
        "description": "Shake de whey protein para pre ou pos treino.",
        "price": "16.00",
    },
    {
        "name": "Sanduiche Natural",
        "code": "sanduiche-natural",
        "description": "Sanduiche leve com frango, salada e molho da casa.",
        "price": "18.50",
    },
]

DEMO_VARIANTS = [
    {"product_code": "coca-cola", "name": "Tradicional", "code": "tradicional", "price": "7.00"},
    {"product_code": "coca-cola", "name": "Zero", "code": "zero", "price": "7.00"},
    {"product_code": "shake-proteico", "name": "Chocolate", "code": "chocolate", "price": "16.00"},
    {"product_code": "shake-proteico", "name": "Baunilha", "code": "baunilha", "price": "16.00"},
]

DEMO_INVENTORY = [
    {"product_code": "coca-cola", "variant_code": "tradicional", "quantity": 24, "min_quantity": 6},
    {"product_code": "coca-cola", "variant_code": "zero", "quantity": 24, "min_quantity": 6},
    {"product_code": "shake-proteico", "variant_code": "chocolate", "quantity": 15, "min_quantity": 4},
    {"product_code": "shake-proteico", "variant_code": "baunilha", "quantity": 15, "min_quantity": 4},
    {"product_code": "sanduiche-natural", "variant_code": None, "quantity": 10, "min_quantity": 3},
]


def seed_database(db: Session) -> None:
    settings = get_settings()

    if settings.seed_admin_email and settings.seed_admin_password:
        admin = db.query(User).filter(User.email == settings.seed_admin_email).one_or_none()
        if admin is None:
            admin = User(
                full_name=settings.seed_admin_name,
                email=settings.seed_admin_email,
                cpf=settings.seed_admin_cpf,
                password_hash=hash_password(settings.seed_admin_password),
                is_admin=True,
            )
            db.add(admin)
        else:
            admin.full_name = settings.seed_admin_name
            admin.password_hash = hash_password(settings.seed_admin_password)
            admin.is_admin = True

    for product_data in DEMO_PRODUCTS:
        product = db.query(Product).filter(Product.code == product_data["code"]).one_or_none()
        if product is None:
            db.add(Product(**product_data))
        else:
            for field, value in product_data.items():
                setattr(product, field, value)
            product.is_active = True

    db.flush()

    for variant_data in DEMO_VARIANTS:
        product = db.query(Product).filter(Product.code == variant_data["product_code"]).one()
        variant = (
            db.query(ProductVariant)
            .filter(ProductVariant.product_id == product.id, ProductVariant.code == variant_data["code"])
            .one_or_none()
        )
        values = {key: value for key, value in variant_data.items() if key != "product_code"}
        if variant is None:
            db.add(ProductVariant(product_id=product.id, **values))
        else:
            for field, value in values.items():
                setattr(variant, field, value)
            variant.is_active = True

    db.flush()

    for inventory_data in DEMO_INVENTORY:
        product = db.query(Product).filter(Product.code == inventory_data["product_code"]).one()
        variant = None
        if inventory_data["variant_code"] is not None:
            variant = (
                db.query(ProductVariant)
                .filter(
                    ProductVariant.product_id == product.id,
                    ProductVariant.code == inventory_data["variant_code"],
                )
                .one()
            )

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == product.id,
                Inventory.variant_id == (variant.id if variant else None),
            )
            .one_or_none()
        )
        if inventory is None:
            db.add(
                Inventory(
                    product_id=product.id,
                    variant_id=variant.id if variant else None,
                    quantity=inventory_data["quantity"],
                    min_quantity=inventory_data["min_quantity"],
                )
            )
        else:
            inventory.quantity = inventory_data["quantity"]
            inventory.min_quantity = inventory_data["min_quantity"]
