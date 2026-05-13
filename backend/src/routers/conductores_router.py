from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.conductores_dto import CreateConductoresDTO, ConductoresResponseDTO, UpdateConductoresDTO
from src.dtos.vehiculo_dto import VehiculoResponseDTO
from src.dtos.viaje_dto import ConductorTopDTO, ReporteMensualDTO
from src.schemas.conductores_schema import CreateConductoresSchema, UpdateConductoresSchema
from src.services.conductores_service import ConductoresService
from src.services.vehiculo_service import VehiculoService
from src.services.viaje_service import ViajeService

router = APIRouter(prefix="/conductores", tags=["conductores"])


@router.post("/", response_model=ConductoresResponseDTO, status_code=status.HTTP_201_CREATED)
def create_conductor(payload: CreateConductoresSchema, db: Session = Depends(get_db)):
    """Alta de conductor. Inicia con calificacion_promedio=0 y disponible=True."""
    dto = CreateConductoresDTO(**payload.model_dump())
    return ConductoresService(db).create(dto)


@router.get("/top", response_model=list[ConductorTopDTO])
def top_conductores(db: Session = Depends(get_db)):
    return ViajeService(db).top_conductores()


@router.get("/{conductor_id}", response_model=ConductoresResponseDTO)
def get_conductor(conductor_id: int, db: Session = Depends(get_db)):
    result = ConductoresService(db).get_by_id(conductor_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conductor no encontrado")
    return result


@router.put("/{conductor_id}", response_model=ConductoresResponseDTO)
def update_conductor(conductor_id: int, payload: UpdateConductoresSchema, db: Session = Depends(get_db)):
    dto = UpdateConductoresDTO(**payload.model_dump())
    result = ConductoresService(db).update(conductor_id, dto)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conductor no encontrado")
    return result


@router.delete("/{conductor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conductor(conductor_id: int, db: Session = Depends(get_db)):
    deleted = ConductoresService(db).delete(conductor_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conductor no encontrado")


@router.get("/{conductor_id}/vehiculos", response_model=list[VehiculoResponseDTO])
def list_vehiculos_conductor(conductor_id: int, db: Session = Depends(get_db)):
    return VehiculoService(db).list_by_conductor(conductor_id)


@router.get("/{conductor_id}/reporte", response_model=ReporteMensualDTO)
def reporte_mensual(conductor_id: int, anio: int, mes: int, db: Session = Depends(get_db)):
    return ViajeService(db).reporte_mensual(conductor_id, anio, mes)
