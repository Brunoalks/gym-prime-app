from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://gym_prime:gym_prime@localhost:5432/gym_prime"
    jwt_secret_key: str = "change-me-in-production-local-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    whatsapp_phone: str | None = None
    minio_endpoint: str = "localhost:9000"
    minio_public_url: str = "http://localhost:9000"
    minio_access_key: str = "gym_prime"
    minio_secret_key: str = "gym_prime_secret"
    minio_bucket: str = "gym-prime"
    minio_secure: bool = False
    seed_admin_name: str = "Admin Gym Prime"
    seed_admin_email: str | None = None
    seed_admin_password: str | None = None
    seed_admin_cpf: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
