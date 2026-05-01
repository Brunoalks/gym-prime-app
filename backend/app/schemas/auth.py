from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120, pattern=r".*\S.*")
    email: EmailStr
    cpf: str | None = Field(default=None, min_length=11, max_length=14, pattern=r"^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$")
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_admin: bool

    model_config = {"from_attributes": True}
