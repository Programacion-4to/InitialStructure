from fastapi import Depends, Header
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.repositories.user_repository import UserRepository
from src.utils.errors import UnauthorizedError
from src.utils.jwt import decode_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
<<<<<<< Updated upstream
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
=======
) -> Cuenta:
    token = credentials.credentials if credentials else None
    return get_user_from_token(token, db)


def get_optional_current_user_from_swagger(
    credentials: HTTPAuthorizationCredentials | None = Security(cuenta_auth_scheme),
    db: Session = Depends(get_db),
) -> Cuenta | None:
    if credentials is None:
        return None
    return get_user_from_token(credentials.credentials, db)


def require_admin(current_user: Cuenta = Depends(get_current_user_from_swagger)) -> Cuenta:
    if current_user.role != "admin" and not current_user.is_admin:
        raise ForbiddenError("Solo una cuenta admin puede realizar esta accion")
    return current_user


def get_owned_profile(perfil_id: int, current_user: Cuenta = Depends(get_current_user_from_swagger), db: Session = Depends(get_db)) -> Perfil:
    perfil = PerfilRepository(db).find_by_id(perfil_id)
    if not perfil or (perfil.cuenta_id != current_user.id and not current_user.is_admin):
        raise UnauthorizedError("Perfil no autorizado")
    return perfil


def get_user_from_authorization(authorization: str | None, db: Session) -> Cuenta:
    if not authorization:
>>>>>>> Stashed changes
        raise UnauthorizedError("Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedError("Invalid token payload")

    user = UserRepository(db).find_by_id(int(user_id))
    if user is None:
        raise UnauthorizedError("User no longer exists")
    if not user.email_verified:
        raise UnauthorizedError("Debes verificar tu email antes de usar Titoflix")

    return user
