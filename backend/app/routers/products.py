from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductRead,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantRead,
    ProductVariantUpdate,
)
from app.services.audit import create_audit_log


router = APIRouter(prefix="/products", tags=["products"])


def get_product_or_404(product_id: int, db: Session) -> Product:
    product = db.scalar(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.variants))
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado")
    return product


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Product:
    product = Product(**payload.model_dump(exclude={"variants"}))
    product.variants = [ProductVariant(**variant.model_dump()) for variant in payload.variants]
    db.add(product)
    db.flush()
    create_audit_log(db, action="product.created", entity="product", entity_id=product.id, user_id=_.id)
    db.commit()
    db.refresh(product)
    return get_product_or_404(product.id, db)


@router.get("", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    return list(db.scalars(select(Product).options(selectinload(Product.variants)).order_by(Product.name)))


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Product:
    product = get_product_or_404(product_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    create_audit_log(db, action="product.updated", entity="product", entity_id=product.id, user_id=_.id)
    db.commit()
    return get_product_or_404(product.id, db)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    product = get_product_or_404(product_id, db)
    product.is_active = False
    for variant in product.variants:
        variant.is_active = False
    create_audit_log(db, action="product.deactivated", entity="product", entity_id=product.id, user_id=_.id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{product_id}/variants", response_model=ProductVariantRead, status_code=status.HTTP_201_CREATED)
def create_variant(
    product_id: int,
    payload: ProductVariantCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ProductVariant:
    get_product_or_404(product_id, db)
    variant = ProductVariant(product_id=product_id, **payload.model_dump())
    db.add(variant)
    db.flush()
    create_audit_log(db, action="product_variant.created", entity="product_variant", entity_id=variant.id, user_id=_.id)
    db.commit()
    db.refresh(variant)
    return variant


@router.patch("/{product_id}/variants/{variant_id}", response_model=ProductVariantRead)
def update_variant(
    product_id: int,
    variant_id: int,
    payload: ProductVariantUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ProductVariant:
    variant = db.scalar(
        select(ProductVariant).where(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
        )
    )
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante nao encontrada")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(variant, field, value)
    create_audit_log(db, action="product_variant.updated", entity="product_variant", entity_id=variant.id, user_id=_.id)
    db.commit()
    db.refresh(variant)
    return variant


@router.delete("/{product_id}/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    variant = db.scalar(
        select(ProductVariant).where(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
        )
    )
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante nao encontrada")

    variant.is_active = False
    create_audit_log(db, action="product_variant.deactivated", entity="product_variant", entity_id=variant.id, user_id=_.id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
