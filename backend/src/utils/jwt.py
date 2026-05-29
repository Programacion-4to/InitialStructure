from datetime import datetime, timedelta, timezone             # Utilidades para manejo de fechas y tiempos
from typing import Any                                         # Soporte para tipos de datos genéricos

from jose import JWTError, jwt                                 # Librería para codificación y decodificación JWT

from src.config import settings                                # Configuración global de la aplicación
from src.utils import UnauthorizedError                        # Excepción para errores de autenticación


ALGORITHM = settings.JWT_ALGORITHM                             # Algoritmo de cifrado (ej. HS256)


def create_access_token(                                       # Función para generar nuevos tokens
    payload: dict[str, Any],                                   # Datos a incluir en el token
    expires_delta: timedelta | None = None,                    # Tiempo de expiración opcional
) -> str:
    expire = datetime.now(timezone.utc) + (                    # Calcula el tiempo actual en UTC
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    data = payload.copy()                                      # Crea copia del payload para no mutar el original
    data.update({"exp": expire})                               # Agrega el claim de expiración 'exp'

    return jwt.encode(                                         # Retorna el token codificado y firmado
        data,
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:         # Función para validar y leer tokens
    try:
        return jwt.decode(                                     # Intenta decodificar el token con la clave secreta
            token,
            settings.JWT_SECRET,
            algorithms=[ALGORITHM],
        )
    except JWTError:                                           # Captura errores de firma, expiración o formato
        raise UnauthorizedError("Token inválido o expirado")   # Lanza error de no autorizado