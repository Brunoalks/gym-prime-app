from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings


def get_minio_client() -> Minio:
    settings = get_settings()
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


def ensure_bucket() -> None:
    settings = get_settings()
    client = get_minio_client()
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)

    policy = f"""{{
  "Version": "2012-10-17",
  "Statement": [
    {{
      "Effect": "Allow",
      "Principal": {{"AWS": ["*"]}},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::{settings.minio_bucket}/*"]
    }}
  ]
}}"""
    try:
        client.set_bucket_policy(settings.minio_bucket, policy)
    except S3Error:
        pass
