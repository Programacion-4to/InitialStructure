from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.conductores_dto import ConductoresResponseDTO, UpdateConductoresDTO
from src.dtos.vehiculo_dto import VehiculoResponseDTO
from src.dtos.viaje_dto import ConductorTopDTO, ReporteMensualDTO
from src.middlewares.auth_middleware import (
    ensure_self_conductor,
    get_current_user,
    require_admin,
)
from src.schemas.conductores_schema import UpdateConductoresSchema
from src.services.conductores_service import ConductoresService
from src.services.vehiculo_service import VehiculoService
from src.services.viaje_service import ViajeService

router = APIRouter(prefix="/conductores", tags=["conductores"])


@router.get("/top", response_model=list[ConductorTopDTO])
def top_conductores(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return ViajeService(db).top_conductores()


@router.get("/{conductor_id}", response_model=ConductoresResponseDTO)
def get_conductor(
    conductor_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    ensure_self_conductor(conductor_id, user)
    result = ConductoresService(db).get_by_id(conductor_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    return result


@router.put("/{conductor_id}", response_model=ConductoresResponseDTO)
def update_conductor(
    conductor_id: int,
    payload: UpdateConductoresSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ensure_self_conductor(conductor_id, user)
    dto = UpdateConductoresDTO(**payload.model_dump())
    result = ConductoresService(db).update(conductor_id, dto)
    if result is None:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    return result


@router.delete("/{conductor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conductor(conductor_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if not ConductoresService(db).delete(conductor_id):
        raise HTTPException(status_code=404, detail="Conductor no encontrado")


@router.get("/{conductor_id}/vehiculos", response_model=list[VehiculoResponseDTO])
def list_vehiculos_conductor(
    conductor_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    ensure_self_conductor(conductor_id, user)
    return VehiculoService(db).list_by_conductor(conductor_id)


@router.get("/{conductor_id}/reporte", response_model=ReporteMensualDTO)
def reporte_mensual(
    conductor_id: int,
    anio: int,
    mes: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ensure_self_conductor(conductor_id, user)
    return ViajeService(db).reporte_mensual(conductor_id, anio, mes)
