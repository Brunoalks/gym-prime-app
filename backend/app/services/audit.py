from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


SENSITIVE_METADATA_KEYS = {
    "authorization",
    "cookie",
    "cpf",
    "jwt",
    "password",
    "password_hash",
    "senha",
    "token",
    "access_token",
}


def sanitize_metadata(metadata: dict | None) -> dict | None:
    if metadata is None:
        return None

    sanitized = {}
    for key, value in metadata.items():
        if key.lower() in SENSITIVE_METADATA_KEYS:
            sanitized[key] = "***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_metadata(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_metadata(item) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value
    return sanitized


def create_audit_log(
    db: Session,
    action: str,
    entity: str | None = None,
    entity_id: int | None = None,
    user_id: int | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        metadata_json=sanitize_metadata(metadata),
    )
    db.add(audit_log)
    return audit_log
