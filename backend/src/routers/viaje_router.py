from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.viaje_dto import CalificacionDTO, CalificacionResponseDTO, CreateViajeDTO, ViajeResponseDTO
from src.middlewares.auth_middleware import (
    ensure_self_pasajero,
    get_current_user,
    require_admin,
)
from src.schemas.viaje_schema import CalificacionSchema, CreateViajeSchema
from src.services.viaje_service import ViajeService
from src.utils.errors import ForbiddenError

router = APIRouter(prefix="/viajes", tags=["viajes"])


def _ensure_pasajero_owns(viaje, user: User) -> None:
    if user.role == "admin":
        return
    if user.role == "pasajero" and user.pasajero_id == viaje.pasajero_id:
        return
    raise ForbiddenError("No tiene permiso sobre este viaje")


def _ensure_conductor_owns(viaje, user: User) -> None:
    if user.role == "admin":
        return
    if user.role == "conductor" and user.conductor_id == viaje.conductor_id:
        return
    raise ForbiddenError("No tiene permiso sobre este viaje")


@router.post("/", response_model=ViajeResponseDTO, status_code=status.HTTP_201_CREATED)
def solicitar_viaje(
    payload: CreateViajeSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ensure_self_pasajero(payload.pasajero_id, user)
    dto = CreateViajeDTO(**payload.model_dump())
    return ViajeService(db).create(dto)


@router.get("/{viaje_id}", response_model=ViajeResponseDTO)
def get_viaje(viaje_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = ViajeService(db).get(viaje_id)
    if user.role == "pasajero":
        _ensure_pasajero_owns(v, user)
    elif user.role == "conductor":
        _ensure_conductor_owns(v, user)
    return v


@router.post("/{viaje_id}/asignar", response_model=ViajeResponseDTO)
def asignar_conductor(viaje_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return ViajeService(db).asignar(viaje_id)


@router.post("/{viaje_id}/iniciar", response_model=ViajeResponseDTO)
def iniciar_viaje(viaje_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = ViajeService(db).get(viaje_id)
    _ensure_conductor_owns(v, user)
    return ViajeService(db).iniciar(viaje_id)


@router.post("/{viaje_id}/finalizar", response_model=ViajeResponseDTO)
def finalizar_viaje(viaje_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = ViajeService(db).get(viaje_id)
    _ensure_conductor_owns(v, user)
    return ViajeService(db).finalizar(viaje_id)


@router.post("/{viaje_id}/cancelar", response_model=ViajeResponseDTO)
def cancelar_viaje(viaje_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = ViajeService(db).get(viaje_id)
    if user.role == "pasajero":
        _ensure_pasajero_owns(v, user)
    elif user.role == "conductor":
        _ensure_conductor_owns(v, user)
    elif user.role != "admin":
        raise ForbiddenError("Rol no autorizado para cancelar")
    return ViajeService(db).cancelar(viaje_id)


@router.post(
    "/{viaje_id}/calificacion",
    response_model=CalificacionResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def calificar_viaje(
    viaje_id: int,
    payload: CalificacionSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = ViajeService(db).get(viaje_id)
    if user.role == "pasajero":
        _ensure_pasajero_owns(v, user)
    elif user.role == "conductor":
        _ensure_conductor_owns(v, user)
    elif user.role != "admin":
        raise ForbiddenError("Rol no autorizado")
    dto = CalificacionDTO(**payload.model_dump())
    return ViajeService(db).calificar(viaje_id, dto)
