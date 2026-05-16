from pydantic import BaseModel


class LoginDTO(BaseModel):
    email: str
    password: str


class TokenDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PinDTO(BaseModel):
    pin: str


class PerfilAuthDTO(BaseModel):
    pin: str | None = None


class PerfilAuthResponseDTO(BaseModel):
    message: str
    perfil_id: int
    cuenta_id: int
