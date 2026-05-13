from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.viaje_dto import CalificacionDTO, CalificacionResponseDTO, CreateViajeDTO, ViajeResponseDTO
from src.schemas.viaje_schema import CalificacionSchema, CreateViajeSchema
from src.services.viaje_service import ViajeService

router = APIRouter(prefix="/viajes", tags=["viajes"])


@router.post("/", response_model=ViajeResponseDTO, status_code=status.HTTP_201_CREATED)
def solicitar_viaje(payload: CreateViajeSchema, db: Session = Depends(get_db)):
    dto = CreateViajeDTO(**payload.model_dump())
    return ViajeService(db).create(dto)


@router.get("/{viaje_id}", response_model=ViajeResponseDTO)
def get_viaje(viaje_id: int, db: Session = Depends(get_db)):
    return ViajeService(db).get(viaje_id)


@router.post("/{viaje_id}/asignar", response_model=ViajeResponseDTO)
def asignar_conductor(viaje_id: int, db: Session = Depends(get_db)):
    return ViajeService(db).asignar(viaje_id)


@router.post("/{viaje_id}/iniciar", response_model=ViajeResponseDTO)
def iniciar_viaje(viaje_id: int, db: Session = Depends(get_db)):
    return ViajeService(db).iniciar(viaje_id)


@router.post("/{viaje_id}/finalizar", response_model=ViajeResponseDTO)
def finalizar_viaje(viaje_id: int, db: Session = Depends(get_db)):
    return ViajeService(db).finalizar(viaje_id)


@router.post("/{viaje_id}/cancelar", response_model=ViajeResponseDTO)
def cancelar_viaje(viaje_id: int, db: Session = Depends(get_db)):
    return ViajeService(db).cancelar(viaje_id)


@router.post("/{viaje_id}/calificacion", response_model=CalificacionResponseDTO, status_code=status.HTTP_201_CREATED)
def calificar_viaje(viaje_id: int, payload: CalificacionSchema, db: Session = Depends(get_db)):
    dto = CalificacionDTO(**payload.model_dump())
    return ViajeService(db).calificar(viaje_id, dto)
