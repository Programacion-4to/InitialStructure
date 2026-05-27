from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db import get_db
from src.db.models.user_model import Cuenta
from src.dtos import (
    CreateCuentaDTO,
    CreatePerfilDTO,
    CuentaResponseDTO,
    PerfilResponseDTO,
    UpdateCuentaDTO,
    UpdatePerfilDTO,
)
from src.middlewares import get_current_user_from_swagger, get_optional_current_user_from_swagger, require_admin
from src.schemas.user_schema import (
    CreateCuentaSchema,
    CreatePerfilSchema,
    UpdateCuentaSchema,
    UpdatePerfilSchema,
)
from src.services.user_service import CuentaService, PerfilService
from src.utils import ForbiddenError

router = APIRouter(prefix="/cuentas", tags=["cuentas"])

ROOT_ADMIN_ID = 1


def require_root_admin(current_user: Cuenta = Depends(require_admin)) -> Cuenta:
    if current_user.id != ROOT_ADMIN_ID:
        raise ForbiddenError("Solo el admin principal puede cambiar permisos de admin")
    return current_user


@router.post("", response_model=CuentaResponseDTO, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CuentaResponseDTO, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: CreateCuentaSchema,
    db: Session = Depends(get_db),
    current_user: Cuenta | None = Depends(get_optional_current_user_from_swagger),
):
    """Crear una nueva cuenta de usuario."""
    dto = CreateCuentaDTO(**payload.model_dump())

    if dto.is_admin and (not current_user or current_user.id != ROOT_ADMIN_ID):
        raise ForbiddenError("Solo el admin principal puede crear cuentas admin")

    return CuentaService(db).create(dto)


@router.get("", response_model=list[CuentaResponseDTO])
@router.get("/", response_model=list[CuentaResponseDTO])
def list_users(_admin: Cuenta = Depends(require_admin), db: Session = Depends(get_db)):
    """Listar todas las cuentas de usuario."""
    return CuentaService(db).list_all()


@router.post("/perfiles", response_model=PerfilResponseDTO, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: CreatePerfilSchema,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Crear un nuevo perfil."""
    payload_data = payload.model_dump()
    requested_account_id = payload_data.pop("cuenta_id", None)

    if requested_account_id is not None and requested_account_id != current_user.id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para crear un perfil en otra cuenta")

    target_account_id = requested_account_id or current_user.id
    dto = CreatePerfilDTO(**payload_data, cuenta_id=target_account_id)
    return PerfilService(db).create(dto)


@router.get("/{user_id}/perfiles", response_model=list[PerfilResponseDTO])
def list_profiles_by_user(
    user_id: int,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Listar todos los perfiles de una cuenta."""
    if current_user.id != user_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para ver estos perfiles")
    return PerfilService(db).list_by_cuenta(user_id)


@router.get("/perfiles/{profile_id}", response_model=PerfilResponseDTO)
def get_profile(
    profile_id: int,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Obtener los datos de un perfil por ID."""
    perfil = PerfilService(db).get_by_id(profile_id)
    if current_user.id != perfil.cuenta_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para ver este perfil")
    return perfil


@router.put("/perfiles/{profile_id}", response_model=PerfilResponseDTO)
def update_profile(
    profile_id: int,
    payload: UpdatePerfilSchema,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Actualizar un perfil."""
    perfil = PerfilService(db).get_by_id(profile_id)
    if current_user.id != perfil.cuenta_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para actualizar este perfil")
    dto = UpdatePerfilDTO(**payload.model_dump(exclude_unset=True))
    return PerfilService(db).update(profile_id, dto)


@router.delete("/perfiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    profile_id: int,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Eliminar un perfil."""
    perfil = PerfilService(db).get_by_id(profile_id)
    if current_user.id != perfil.cuenta_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para eliminar este perfil")
    PerfilService(db).delete(profile_id)


@router.get("/{user_id}", response_model=CuentaResponseDTO)
def get_user(
    user_id: int,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Obtener los datos de una cuenta específica por ID."""
    if current_user.id != user_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para ver esta cuenta")
    return CuentaService(db).get_by_id(user_id)


@router.put("/{user_id}", response_model=CuentaResponseDTO)
def update_user(
    user_id: int,
    payload: UpdateCuentaSchema,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Actualizar una cuenta de usuario."""
    if current_user.id != user_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para actualizar esta cuenta")

    payload_data = payload.model_dump(exclude_unset=True)
    if "is_admin" in payload_data:
        if current_user.id != ROOT_ADMIN_ID:
            raise ForbiddenError("Solo el admin principal puede cambiar permisos de admin")
        if user_id == ROOT_ADMIN_ID and payload_data["is_admin"] is False:
            raise ForbiddenError("No se puede quitar permisos al admin principal")

    dto = UpdateCuentaDTO(**payload_data)
    return CuentaService(db).update(user_id, dto)


@router.put("/{user_id}/admin", response_model=CuentaResponseDTO)
def update_user_admin_permission(
    user_id: int,
    payload: UpdateCuentaSchema,
    _root_admin: Cuenta = Depends(require_root_admin),
    db: Session = Depends(get_db),
):
    """Permite al admin principal activar o quitar permisos admin."""
    payload_data = payload.model_dump(exclude_unset=True)
    if "is_admin" not in payload_data or len(payload_data) != 1:
        raise ForbiddenError("Solo se puede cambiar el permiso admin desde esta accion")
    if user_id == ROOT_ADMIN_ID and payload_data["is_admin"] is False:
        raise ForbiddenError("No se puede quitar permisos al admin principal")

    dto = UpdateCuentaDTO(is_admin=payload_data["is_admin"])
    return CuentaService(db).update(user_id, dto)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    """Eliminar una cuenta de usuario."""
    if current_user.id != user_id and not current_user.is_admin:
        raise ForbiddenError("No autorizado para eliminar esta cuenta")
    if user_id == ROOT_ADMIN_ID:
        raise ForbiddenError("No se puede eliminar el admin principal")
    CuentaService(db).delete(user_id)
