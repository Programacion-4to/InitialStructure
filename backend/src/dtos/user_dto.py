from datetime import datetime
from pydantic import BaseModel


class CreateCuentaDTO(BaseModel):
    email: str                                   # Email de la cuenta (obligatorio)
    password: str                                # Contraseña de la cuenta (obligatorio)
    plan: str                                    # Tipo de plan (ej: basico, estandar, premium)
    is_admin: bool = False                       # Permiso de administración


class UpdateCuentaDTO(BaseModel):
    email: str | None = None                     # Email opcional para actualizar
    password: str | None = None                  # Contraseña opcional para actualizar
    plan: str | None = None                      # Plan opcional para actualizar
    is_admin: bool | None = None                 # Permiso de administración opcional

class CuentaResponseDTO(BaseModel):
    id: int                                      # ID único de la cuenta
    email: str                                   # Email asociado a la cuenta
    plan: str                                    # Tipo de plan suscrito
    is_admin: bool                               # Permiso de administración
    fecha_alta: datetime | None = None           # Fecha de registro de la cuenta

    model_config = {"from_attributes": True}     # Configuración para lectura desde ORM


class CreatePerfilDTO(BaseModel):
    cuenta_id: int                               # ID de la cuenta al que pertenece el perfil
    nombre: str                                  # Nombre del perfil
    pin: str | None = None                       # PIN opcional de 4 dígitos
    es_infantil: bool = False                    # Flag para indicar si es perfil infantil
    avatar: str | None = None                    # URL o identificador del avatar


class UpdatePerfilDTO(BaseModel):
    nombre: str | None = None                    # Nombre opcional para actualizar
    pin: str | None = None                        # PIN opcional de 4 dígitos
    es_infantil: bool | None = None              # Estado opcional de perfil infantil
    avatar: str | None = None                    # Avatar opcional para actualizar

class PerfilResponseDTO(BaseModel):
    id: int                                      # ID único del perfil
    cuenta_id: int                               # ID de la cuenta a la que pertenece
    nombre: str                                  # Nombre del perfil
    es_infantil: bool                            # Indica si es un perfil infantil
    avatar: str | None = None                    # URL o referencia del avatar
    has_pin: bool = False

    model_config = {"from_attributes": True}     # Configuración para lectura desde ORM
