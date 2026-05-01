"""add_data_integrity_constraints

Revision ID: 20260501_1536
Revises: cb80b1bd37f2
Create Date: 2026-05-01 15:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260501_1536"
down_revision: Union[str, Sequence[str], None] = "cb80b1bd37f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint("ck_products_price_non_negative", "products", "price >= 0")
    op.create_check_constraint(
        "ck_product_variants_price_non_negative",
        "product_variants",
        "price IS NULL OR price >= 0",
    )
    op.create_check_constraint("ck_orders_total_amount_non_negative", "orders", "total_amount >= 0")
    op.create_check_constraint("ck_order_items_quantity_positive", "order_items", "quantity > 0")
    op.create_check_constraint("ck_order_items_unit_price_non_negative", "order_items", "unit_price >= 0")
    op.create_check_constraint("ck_order_items_total_price_non_negative", "order_items", "total_price >= 0")
    op.create_check_constraint("ck_inventory_quantity_non_negative", "inventory", "quantity >= 0")
    op.create_check_constraint("ck_inventory_min_quantity_non_negative", "inventory", "min_quantity >= 0")
    op.create_index(
        "uq_inventory_base_product",
        "inventory",
        ["product_id"],
        unique=True,
        postgresql_where=sa.text("variant_id IS NULL"),
        sqlite_where=sa.text("variant_id IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_inventory_base_product", table_name="inventory")
    op.drop_constraint("ck_inventory_min_quantity_non_negative", "inventory", type_="check")
    op.drop_constraint("ck_inventory_quantity_non_negative", "inventory", type_="check")
    op.drop_constraint("ck_order_items_total_price_non_negative", "order_items", type_="check")
    op.drop_constraint("ck_order_items_unit_price_non_negative", "order_items", type_="check")
    op.drop_constraint("ck_order_items_quantity_positive", "order_items", type_="check")
    op.drop_constraint("ck_orders_total_amount_non_negative", "orders", type_="check")
    op.drop_constraint("ck_product_variants_price_non_negative", "product_variants", type_="check")
    op.drop_constraint("ck_products_price_non_negative", "products", type_="check")
