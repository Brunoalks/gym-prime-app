"""add product category

Revision ID: 20260507_1200
Revises: 20260503_1300
Create Date: 2026-05-07 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260507_1200"
down_revision: str | Sequence[str] | None = "20260503_1300"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("category", sa.String(length=40), nullable=False, server_default="snacks"),
    )


def downgrade() -> None:
    op.drop_column("products", "category")
