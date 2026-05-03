from pydantic import BaseModel, Field


class AppSettingsRead(BaseModel):
    establishment_name: str
    whatsapp_phone: str | None
    menu_is_open: bool
    totem_message: str


class AppSettingsUpdate(BaseModel):
    establishment_name: str | None = Field(default=None, min_length=1, max_length=120)
    whatsapp_phone: str | None = Field(default=None, max_length=32)
    menu_is_open: bool | None = None
    totem_message: str | None = Field(default=None, min_length=1, max_length=240)
