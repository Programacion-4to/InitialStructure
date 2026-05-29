from pydantic import BaseModel, EmailStr, Field


class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class AdminLoginSchema(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=72)
    password: str = Field(min_length=8, max_length=72)


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: int | None = None
    is_admin: bool = False
    email: str | None = None
    plan: str | None = None


class AuthAccountSchema(BaseModel):
    id: int
    email: str
    plan: str
    is_admin: bool


class PinSchema(BaseModel):
    pin: str = Field(pattern=r"^\d{4}$")


class PerfilAuthSchema(BaseModel):
    pin: str | None = Field(default=None, pattern=r"^\d{4}$")


class PerfilAuthResponseSchema(BaseModel):
    message: str
    perfil_id: int
    cuenta_id: int
