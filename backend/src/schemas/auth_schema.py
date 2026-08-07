from pydantic import BaseModel, EmailStr, Field


class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    pasajero_id: int | None = None
    conductor_id: int | None = None


class RegisterPasajeroSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nombre: str = Field(min_length=2)
    telefono: str = Field(min_length=6)


class RegisterConductorSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nombre: str = Field(min_length=2)
    licencia: str = Field(min_length=6)


class RegisterAdminSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
