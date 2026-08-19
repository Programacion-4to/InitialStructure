from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from src.config.env import settings
from src.utils.errors import UnauthorizedError

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)


<<<<<<< Updated upstream
def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as e:
        raise UnauthorizedError("Invalid or expired token") from e
=======
def create_access_token(                                       # Función para generar nuevos tokens
    payload: dict[str, Any],                                   # Datos a incluir en el token
    expires_delta: timedelta | None = None,                    # Tiempo de expiración opcional
) -> str:
    expire = datetime.now(timezone.utc) + (                    # Calcula el tiempo actual en UTC
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    data = payload.copy()                                      # Crea copia del payload para no mutar el original
    data.update({"exp": expire, "typ": data.get("typ", "access")})

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
>>>>>>> Stashed changes
