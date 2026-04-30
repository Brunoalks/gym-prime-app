from datetime import datetime

from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity: str | None
    entity_id: int | None
    metadata_json: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
