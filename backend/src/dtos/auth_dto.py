from pydantic import BaseModel


class LoginDTO(BaseModel):
    email: str
    password: str


class TokenDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    pasajero_id: int | None = None
    conductor_id: int | None = None


class RegisterPasajeroDTO(BaseModel):
    email: str
    password: str
    nombre: str
    telefono: str


class RegisterConductorDTO(BaseModel):
    email: str
    password: str
    nombre: str
    licencia: str


class RegisterAdminDTO(BaseModel):
    email: str
    password: str


class CurrentUserDTO(BaseModel):
    id: int
    email: str
    role: str
    pasajero_id: int | None
    conductor_id: int | None

    model_config = {"from_attributes": True}
