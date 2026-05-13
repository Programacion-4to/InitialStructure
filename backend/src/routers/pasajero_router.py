from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.metodo_pago_dto import MetodoPagoResponseDTO
from src.dtos.pasajero_dto import CreatePasajeroDTO, PasajeroResponseDTO
from src.dtos.viaje_dto import HistorialResponseDTO
from src.schemas.pasajero_schema import CreatePasajeroSchema
from src.services.metodo_pago_service import MetodoPagoService
from src.services.pasajero_service import PasajeroService
from src.services.viaje_service import ViajeService

router = APIRouter(prefix="/pasajeros", tags=["pasajeros"])


@router.post("/", response_model=PasajeroResponseDTO, status_code=status.HTTP_201_CREATED)
def create_pasajero(payload: CreatePasajeroSchema, db: Session = Depends(get_db)):
    """Ejemplo completo: valida con Schema, arma DTO, llama al service."""
    dto = CreatePasajeroDTO(**payload.model_dump())
    return PasajeroService(db).create(dto)

@router.get("/{pasajero_id}", response_model=PasajeroResponseDTO)
def get_pasajero(pasajero_id: int, db: Session = Depends(get_db)):
    result = PasajeroService(db).get_by_id(pasajero_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasajero no encontrado")
    return result

@router.put("/{pasajero_id}", response_model=PasajeroResponseDTO)
def update_pasajero(pasajero_id: int, payload: CreatePasajeroSchema, db: Session = Depends(get_db)):
    dto = CreatePasajeroDTO(**payload.model_dump())
    result = PasajeroService(db).update(pasajero_id, dto)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasajero no encontrado")
    return result

@router.patch("/{pasajero_id}", response_model=PasajeroResponseDTO)
def patch_pasajero(pasajero_id: int, payload: CreatePasajeroSchema, db: Session = Depends(get_db)):
    dto = CreatePasajeroDTO(**payload.model_dump())
    result = PasajeroService(db).update(pasajero_id, dto)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasajero no encontrado")
    return result

@router.delete("/{pasajero_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pasajero(pasajero_id: int, db: Session = Depends(get_db)):
    deleted = PasajeroService(db).delete(pasajero_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasajero no encontrado")


@router.get("/{pasajero_id}/metodos-pago", response_model=list[MetodoPagoResponseDTO])
def list_metodos_pago(pasajero_id: int, db: Session = Depends(get_db)):
    return MetodoPagoService(db).list_by_pasajero(pasajero_id)


@router.get("/{pasajero_id}/viajes", response_model=HistorialResponseDTO)
def historial_pasajero(
    pasajero_id: int,
    desde: datetime | None = Query(default=None),
    hasta: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ViajeService(db).historial_pasajero(pasajero_id, desde, hasta)