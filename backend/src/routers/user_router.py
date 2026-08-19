from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.user_dto import CreateUserDTO, UserResponseDTO
from src.schemas.user_schema import CreateUserSchema
from src.services.user_service import UserService

<<<<<<< Updated upstream
router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED)
def create_user(payload: CreateUserSchema, db: Session = Depends(get_db)):
    """Ejemplo completo: valida con Schema, arma DTO, llama al service."""
    dto = CreateUserDTO(**payload.model_dump())
    return UserService(db).create(dto)


@router.get("/{user_id}", response_model=UserResponseDTO)
def get_user(user_id: int, db: Session = Depends(get_db)):
    # TODO: llamar a UserService(db).get_by_id(user_id) y devolver el resultado
    ...
=======
router = APIRouter(prefix="/cuentas", tags=["cuentas"])

def require_root_admin(current_user: Cuenta = Depends(require_admin)) -> Cuenta:
    # The first V2 role model has one administrative role.  There is no magic
    # account id: administrators can be recovered through the bootstrap command.
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

    if dto.is_admin and (not current_user or not current_user.is_admin):
        raise ForbiddenError("Solo un admin puede crear cuentas admin")

    return CuentaService(db).create(dto)
>>>>>>> Stashed changes


@router.get("/", response_model=list[UserResponseDTO])
def list_users(db: Session = Depends(get_db)):
    # TODO: llamar a UserService(db).list_all()
    ...


<<<<<<< Updated upstream
@router.put("/{user_id}", response_model=UserResponseDTO)
def update_user(user_id: int, db: Session = Depends(get_db)):
    # TODO: recibir un UpdateUserSchema, llamar al service, devolver el DTO actualizado
    ...


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # TODO: llamar a UserService(db).delete(user_id)
    ...
=======
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
        if not current_user.is_admin:
            raise ForbiddenError("Solo el admin principal puede cambiar permisos de admin")

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
    CuentaService(db).delete(user_id)
>>>>>>> Stashed changes
