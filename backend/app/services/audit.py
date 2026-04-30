from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


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
        metadata_json=metadata,
    )
    db.add(audit_log)
    return audit_log
