from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.vehiculo_dto import CreateVehiculoDTO, UpdateVehiculoDTO, VehiculoResponseDTO
from src.middlewares.auth_middleware import ensure_self_conductor, get_current_user, require_admin
from src.schemas.vehiculo_schema import CreateVehiculoSchema, UpdateVehiculoSchema
from src.services.vehiculo_service import VehiculoService
from src.utils.errors import ForbiddenError

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])


@router.post("/", response_model=VehiculoResponseDTO, status_code=status.HTTP_201_CREATED)
def create_vehiculo(
    payload: CreateVehiculoSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ensure_self_conductor(payload.conductor_id, user)
    dto = CreateVehiculoDTO(**payload.model_dump())
    return VehiculoService(db).create(dto)


@router.get("/{vehiculo_id}", response_model=VehiculoResponseDTO)
def get_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = VehiculoService(db).get_by_id(vehiculo_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if user.role != "admin":
        ensure_self_conductor(result.conductor_id, user)
    return result


@router.put("/{vehiculo_id}", response_model=VehiculoResponseDTO)
def update_vehiculo(
    vehiculo_id: int,
    payload: UpdateVehiculoSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = VehiculoService(db).get_by_id(vehiculo_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if user.role != "admin":
        ensure_self_conductor(existing.conductor_id, user)
    dto = UpdateVehiculoDTO(**payload.model_dump())
    return VehiculoService(db).update(vehiculo_id, dto)


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = VehiculoService(db).get_by_id(vehiculo_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if user.role != "admin":
        ensure_self_conductor(existing.conductor_id, user)
    VehiculoService(db).delete(vehiculo_id)
