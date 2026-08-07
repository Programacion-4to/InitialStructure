from fastapi import Depends, Header
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.repositories.user_repository import UserRepository
from src.utils.errors import ForbiddenError, UnauthorizedError
from src.utils.jwt import decode_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Falta o es inválido el header Authorization")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedError("Token sin sub")

    user = UserRepository(db).find_by_id(int(user_id))
    if user is None:
        raise UnauthorizedError("El usuario ya no existe")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise ForbiddenError("Se requiere rol admin")
    return user


def require_pasajero(user: User = Depends(get_current_user)) -> User:
    if user.role != "pasajero":
        raise ForbiddenError("Se requiere rol pasajero")
    return user


def require_conductor(user: User = Depends(get_current_user)) -> User:
    if user.role != "conductor":
        raise ForbiddenError("Se requiere rol conductor")
    return user


def ensure_self_pasajero(pasajero_id: int, user: User) -> None:
    if user.role == "admin":
        return
    if user.role == "pasajero" and user.pasajero_id == pasajero_id:
        return
    raise ForbiddenError("No tiene permiso sobre este pasajero")


def ensure_self_conductor(conductor_id: int, user: User) -> None:
    if user.role == "admin":
        return
    if user.role == "conductor" and user.conductor_id == conductor_id:
        return
    raise ForbiddenError("No tiene permiso sobre este conductor")
