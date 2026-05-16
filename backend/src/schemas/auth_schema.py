from pydantic import BaseModel, EmailStr, Field                 # Importa herramientas de validación de Pydantic


class LoginSchema(BaseModel):                                   # Esquema para el inicio de sesión
    email: EmailStr                                             # Valida que sea un formato de correo válido
    password: str = Field(min_length=8, max_length=72)          # Valida longitud de contraseña (seguridad)


class TokenSchema(BaseModel):                                   # Esquema para la respuesta del token JWT
    access_token: str                                           # El token de acceso generado
    token_type: str = "bearer"                                  # Tipo de token (por defecto bearer)


class PinSchema(BaseModel):                                     # Esquema para validación simple de PIN
    pin: str = Field(pattern=r"^\d{4}$")                        # Valida que sean exactamente 4 dígitos


class PerfilAuthSchema(BaseModel):                              # Esquema para acceso protegido a un perfil
    pin: str | None = Field(default=None, pattern=r"^\d{4}$")   # PIN opcional (regex para 4 dígitos numéricos)


class PerfilAuthResponseSchema(BaseModel):                      # Respuesta al validar acceso a un perfil
    message: str                                                # Mensaje de confirmación
    perfil_id: int                                              # Perfil validado
    cuenta_id: int                                              # Cuenta dueña del perfil
