from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.app_setting import AppSetting
from app.schemas.admin_settings import AppSettingsRead, AppSettingsUpdate
from app.services.audit import create_audit_log


SETTING_KEYS = ("establishment_name", "whatsapp_phone", "menu_is_open", "totem_message")


def _defaults() -> dict[str, str | None]:
    settings = get_settings()
    return {
        "establishment_name": "Gym Prime",
        "whatsapp_phone": settings.whatsapp_phone,
        "menu_is_open": "true",
        "totem_message": "Finalize seu pedido e retire no balcao.",
    }


def _to_bool(value: str | None) -> bool:
    return str(value).lower() not in {"false", "0", "no", "nao"}


def _serialize_value(key: str, value: str | bool | None) -> str | None:
    if key == "menu_is_open":
        return "true" if value else "false"
    return value.strip() if isinstance(value, str) else value


def get_app_settings(db: Session) -> AppSettingsRead:
    stored = {setting.key: setting.value for setting in db.query(AppSetting).filter(AppSetting.key.in_(SETTING_KEYS))}
    values = {**_defaults(), **stored}
    return AppSettingsRead(
        establishment_name=values["establishment_name"] or "Gym Prime",
        whatsapp_phone=values["whatsapp_phone"] or None,
        menu_is_open=_to_bool(values["menu_is_open"]),
        totem_message=values["totem_message"] or "Finalize seu pedido e retire no balcao.",
    )


def update_app_settings(db: Session, payload: AppSettingsUpdate, user_id: int) -> AppSettingsRead:
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setting = db.get(AppSetting, key)
        if setting is None:
            setting = AppSetting(key=key)
            db.add(setting)
        setting.value = _serialize_value(key, value)

    create_audit_log(
        db,
        action="settings.updated",
        entity="settings",
        user_id=user_id,
        metadata={"fields": sorted(changes.keys())},
    )
    db.commit()
    return get_app_settings(db)
