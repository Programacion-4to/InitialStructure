from typing import cast
from sqlalchemy.orm import Session                               # Importa la sesión de SQLAlchemy

from src.dtos import (                                  # Importa DTOs de Usuario
    CreateCuentaDTO,                                             # DTO para creación de Cuenta
    CreatePerfilDTO,                                             # DTO para creación de Perfil
    CuentaResponseDTO,                                           # DTO para respuesta de Cuenta
    PerfilResponseDTO,                                           # DTO para respuesta de Perfil
    UpdateCuentaDTO,                                             # DTO para actualización de Cuenta
    UpdatePerfilDTO,                                             # DTO para actualización de Perfil
)
from src.mappers import (                         # Importa funciones de mapeo de usuario
    to_cuenta_response,                                      # Mapper de Cuenta a DTO
    to_cuenta_response_list,                                 # Mapper de lista de Cuentas a DTOs
    to_perfil_response,                                      # Mapper de Perfil a DTO
    to_perfil_response_list,                                 # Mapper de lista de Perfiles a DTOs
)
from src.repositories import CuentaRepository, PerfilRepository                                        
# Importa repositorios de datos
# Repositorio para Cuentas y para Perfiles

from src.config.env import settings
from src.services.storage_service import StorageService
from src.utils import ConflictError, NotFoundError, hash_password


PLAN_LIMITS = {                                      # Define los límites de perfiles permitidos por plan
    "basico": 1,                                     # Límite de perfiles para el plan básico
    "estandar": 2,                                   # Límite de perfiles para el plan estándar
    "premium": 5,                                    # Límite de perfiles para el plan premium
}


class CuentaService:                                            # Servicio para lógica de negocio de Cuentas
    def __init__(self, db: Session):                            # Inicializa el servicio con sesión de BD
        self.cuenta_repo = CuentaRepository(db)                 # Instancia el repositorio de Cuentas
        self.perfil_repo = PerfilRepository(db)

    def create(self, dto: CreateCuentaDTO) -> CuentaResponseDTO: # Crea una nueva cuenta
        existing = self.cuenta_repo.find_by_email(dto.email)    # Verifica si el email ya está registrado

        if existing:                                            # Si ya existe, lanza error de conflicto
            raise ConflictError("Ya existe una cuenta con ese email")
        
        password_hash = hash_password(dto.password)

        cuenta = self.cuenta_repo.create(                       # Persiste la nueva cuenta
            email=dto.email,
            password_hash=password_hash,
            plan=dto.plan,
            is_admin=dto.is_admin,
        )

        return to_cuenta_response(cuenta)                       # Retorna respuesta mapeada

    def get_by_id(self, cuenta_id: int) -> CuentaResponseDTO:   # Busca una cuenta por ID
        cuenta = self.cuenta_repo.find_by_id(cuenta_id)         # Obtiene cuenta del repositorio

        if not cuenta:                                          # Si no existe, lanza error de no encontrado
            raise NotFoundError("Cuenta no encontrada")

        return to_cuenta_response(cuenta)                       # Retorna respuesta mapeada

    def list_all(self) -> list[CuentaResponseDTO]:              # Obtiene listado de todas las cuentas
        cuentas = self.cuenta_repo.list_all()                   # Consulta todas las cuentas
        return to_cuenta_response_list(cuentas)                 # Retorna lista de respuestas mapeadas

    def update(self, cuenta_id: int, dto: UpdateCuentaDTO) -> CuentaResponseDTO: # Actualiza datos de una cuenta
        fields = dto.model_dump(exclude_unset=True)             # Extrae solo los campos enviados

        if "email" in fields:
            existing = self.cuenta_repo.find_by_email(fields["email"])
            if existing and existing.id != cuenta_id:
                raise ConflictError("Ya existe una cuenta con ese email")

        if "password" in fields:
            fields["password_hash"] = hash_password(fields.pop("password"))

        if "plan" in fields:
            perfiles = self.perfil_repo.list_by_cuenta(cuenta_id)
            if len(perfiles) > PLAN_LIMITS[fields["plan"]]:
                raise ConflictError("La cuenta tiene mas perfiles que los permitidos por ese plan")

        cuenta = self.cuenta_repo.update(cuenta_id, **fields)   # Realiza la actualización

        if not cuenta:                                          # Si no existe, lanza error
            raise NotFoundError("Cuenta no encontrada")

        return to_cuenta_response(cuenta)                       # Retorna cuenta actualizada

    def delete(self, cuenta_id: int) -> None:                   # Elimina una cuenta
        cuenta = self.cuenta_repo.find_by_id(cuenta_id)
        if not cuenta:
            raise NotFoundError("Cuenta no encontrada")

        StorageService().delete_prefix(
            f"{settings.S3_ASSETS_PREFIX.strip('/')}/cuentas/{cuenta_id}"
        )
        deleted = self.cuenta_repo.delete(cuenta_id)            # Ejecuta eliminación

        if not deleted:                                         # Si no pudo eliminar (no existe), lanza error
            raise NotFoundError("Cuenta no encontrada")


class PerfilService:                                            # Servicio para lógica de negocio de Perfiles
    def __init__(self, db: Session):                            # Inicializa repositorios requeridos
        self.cuenta_repo = CuentaRepository(db)                 # Repositorio de Cuentas
        self.perfil_repo = PerfilRepository(db)                 # Repositorio de Perfiles

    def create(self, dto: CreatePerfilDTO) -> PerfilResponseDTO: # Crea un nuevo perfil
        cuenta = self.cuenta_repo.find_by_id(dto.cuenta_id)     # Busca cuenta asociada

        if not cuenta:                                          # Valida existencia de cuenta
            raise NotFoundError("Cuenta no encontrada")

        perfiles = self.perfil_repo.list_by_cuenta(dto.cuenta_id) # Obtiene perfiles actuales de la cuenta
        max_perfiles = PLAN_LIMITS[cast(str, cuenta.plan)]       # Determina límite según plan de suscripción

        if len(perfiles) >= max_perfiles:                       # Valida límite de perfiles permitidos
            raise ConflictError("El plan no permite crear más perfiles")

        repeated_name = any(perfil.nombre == dto.nombre for perfil in perfiles) # Comprueba si el nombre ya existe

        if repeated_name:                                       # Evita duplicidad de nombres en la cuenta
            raise ConflictError("Ya existe un perfil con ese nombre en la cuenta")

        pin_hash = hash_password(dto.pin) if dto.pin else None

        perfil = self.perfil_repo.create(                       # Persiste el nuevo perfil
            cuenta_id=dto.cuenta_id,
            nombre=dto.nombre,
            pin=pin_hash,
            es_infantil=dto.es_infantil,
            avatar=None,
        )

        if dto.avatar:
            try:
                avatar = self._store_avatar(dto.avatar, dto.cuenta_id, perfil.id, dto.nombre)
                perfil = self.perfil_repo.update(perfil.id, avatar=avatar) or perfil
            except Exception:
                self.perfil_repo.delete(perfil.id)
                raise

        return to_perfil_response(perfil)                       # Retorna respuesta mapeada

    def get_by_id(self, perfil_id: int) -> PerfilResponseDTO:   # Busca perfil por ID
        perfil = self.perfil_repo.find_by_id(perfil_id)         # Consulta repositorio

        if not perfil:                                          # Valida existencia
            raise NotFoundError("Perfil no encontrado")

        return to_perfil_response(perfil)                       # Retorna respuesta mapeada

    def list_by_cuenta(self, cuenta_id: int) -> list[PerfilResponseDTO]: # Lista perfiles de una cuenta
        cuenta = self.cuenta_repo.find_by_id(cuenta_id)         # Verifica cuenta antes de listar

        if not cuenta:                                          # Si la cuenta no existe
            raise NotFoundError("Cuenta no encontrada")

        perfiles = self.perfil_repo.list_by_cuenta(cuenta_id)   # Obtiene lista de perfiles
        return to_perfil_response_list(perfiles)                # Retorna lista mapeada

    def update(self, perfil_id: int, dto: UpdatePerfilDTO) -> PerfilResponseDTO: # Actualiza datos del perfil
        fields = dto.model_dump(exclude_unset=True)             # Filtra solo campos proporcionados

        perfil_actual = self.perfil_repo.find_by_id(perfil_id)
        if not perfil_actual:
            raise NotFoundError("Perfil no encontrado")

        if "nombre" in fields:
            perfiles = self.perfil_repo.list_by_cuenta(perfil_actual.cuenta_id)
            repeated_name = any(
                perfil.id != perfil_id and perfil.nombre == fields["nombre"]
                for perfil in perfiles
            )
            if repeated_name:
                raise ConflictError("Ya existe un perfil con ese nombre en la cuenta")

        if "pin" in fields:
            fields["pin"] = hash_password(fields["pin"]) if fields["pin"] else None
            fields["pin_intentos_fallidos"] = 0
            fields["pin_bloqueado_hasta"] = None

        if "avatar" in fields:
            avatar = fields["avatar"]
            if avatar and self._is_data_url(avatar):
                fields["avatar"] = self._store_avatar(
                    avatar,
                    perfil_actual.cuenta_id,
                    perfil_actual.id,
                    fields.get("nombre") or perfil_actual.nombre,
                )
                self._delete_stored_avatar(perfil_actual.avatar)
            elif avatar is None:
                self._delete_stored_avatar(perfil_actual.avatar)

        perfil = self.perfil_repo.update(perfil_id, **fields)   # Aplica cambios

        if not perfil:                                          # Valida existencia
            raise NotFoundError("Perfil no encontrado")

        return to_perfil_response(perfil)                       # Retorna perfil actualizado

    def delete(self, perfil_id: int) -> None:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")

        StorageService().delete_prefix(
            f"{settings.S3_ASSETS_PREFIX.strip('/')}/cuentas/{perfil.cuenta_id}/perfiles/{perfil_id}"
        )
        deleted = self.perfil_repo.delete(perfil_id)

        if not deleted:
            raise NotFoundError("Perfil no encontrado")

    def _store_avatar(self, avatar: str, cuenta_id: int, perfil_id: int, profile_name: str) -> str:
        if not self._is_data_url(avatar):
            return avatar

        upload = StorageService().upload_asset_data_url(
            avatar,
            cuenta_id=cuenta_id,
            perfil_id=perfil_id,
            filename=f"{profile_name}-avatar",
        )
        return upload.object_key

    def _delete_stored_avatar(self, avatar: str | None) -> None:
        if avatar and avatar.startswith(f"{settings.S3_ASSETS_PREFIX.strip('/')}/"):
            StorageService().delete_object(avatar)

    def _is_data_url(self, value: str) -> bool:
        return value.startswith("data:")
