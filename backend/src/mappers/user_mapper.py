from src.db import Cuenta, Perfil                           # Importa modelos de Cuenta y Perfil
from src.dtos import CuentaResponseDTO, PerfilResponseDTO # Importa DTOs de usuario

def to_cuenta_response(cuenta: Cuenta) -> CuentaResponseDTO:    # Convierte Cuenta a DTO
    """Convierte un Model SQLAlchemy en un DTO de respuesta (sin campos sensibles)."""
    return CuentaResponseDTO.model_validate(cuenta)             # Valida y transforma al esquema


def to_perfil_response(perfil: Perfil) -> PerfilResponseDTO:    # Convierte Perfil a DTO
    """Convierte un Model SQLAlchemy en un DTO de respuesta (sin campos sensibles)."""
    dto = PerfilResponseDTO.model_validate(perfil)              # Valida y transforma al esquema
    dto.has_pin = bool(perfil.pin)
    return dto


def to_cuenta_response_list(cuentas: list[Cuenta]) -> list[CuentaResponseDTO]:    # Convierte lista de Cuentas a DTOs
    """Convierte una lista de modelos SQLAlchemy en una lista de DTOs de respuesta."""
    return [to_cuenta_response(cuenta) for cuenta in cuentas]                     # Itera y aplica el mapper individual


def to_perfil_response_list(perfiles: list[Perfil]) -> list[PerfilResponseDTO]:   # Convierte lista de Perfiles a DTOs
    """Convierte una lista de modelos SQLAlchemy en una lista de DTOs de respuesta."""
    return [to_perfil_response(perfil) for perfil in perfiles]
