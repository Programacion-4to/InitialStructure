<<<<<<< Updated upstream
from pydantic import BaseModel, EmailStr
=======
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
>>>>>>> Stashed changes


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
<<<<<<< Updated upstream
=======
    id: int | None = None
    is_admin: bool = False
    email: str | None = None
    plan: str | None = None


class RegisterSchema(LoginSchema):
    plan: str = Field(default="basico", pattern="^(basico|estandar|premium)$")


class TokenValueSchema(BaseModel):
    token: str = Field(min_length=20, max_length=512)


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(TokenValueSchema):
    password: str = Field(min_length=8, max_length=72)


class SessionSchema(BaseModel):
    id: str
    device_name: str
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    current: bool = False


class AuthAccountSchema(BaseModel):
    id: int
    email: str
    plan: str
    is_admin: bool
    email_verified: bool = True


class PinSchema(BaseModel):
    pin: str = Field(pattern=r"^\d{4}$")


class PerfilAuthSchema(BaseModel):
    pin: str | None = Field(default=None, pattern=r"^\d{4}$")


class PerfilAuthResponseSchema(BaseModel):
    message: str
    perfil_id: int
    cuenta_id: int
>>>>>>> Stashed changes
