from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.config import get_settings
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductRead
from app.services.audit import create_audit_log
from app.services.bucket import ensure_bucket, get_minio_client


router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/products/{product_id}/image", response_model=ProductRead)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado")

    ensure_bucket()
    settings = get_settings()
    extension = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    object_name = f"products/{product_id}/{uuid4()}.{extension}"
    client = get_minio_client()
    client.put_object(
        settings.minio_bucket,
        object_name,
        file.file,
        length=-1,
        part_size=10 * 1024 * 1024,
        content_type=file.content_type,
    )

    product.image_url = f"{settings.minio_public_url}/{settings.minio_bucket}/{object_name}"
    create_audit_log(db, action="product.image_uploaded", entity="product", entity_id=product.id, user_id=_.id)
    db.commit()
    db.refresh(product)
    return product
