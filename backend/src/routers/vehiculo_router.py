from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.vehiculo_dto import CreateVehiculoDTO, UpdateVehiculoDTO, VehiculoResponseDTO
from src.schemas.vehiculo_schema import CreateVehiculoSchema, UpdateVehiculoSchema
from src.services.vehiculo_service import VehiculoService

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])


@router.post("/", response_model=VehiculoResponseDTO, status_code=status.HTTP_201_CREATED)
def create_vehiculo(payload: CreateVehiculoSchema, db: Session = Depends(get_db)):
    dto = CreateVehiculoDTO(**payload.model_dump())
    return VehiculoService(db).create(dto)


@router.get("/{vehiculo_id}", response_model=VehiculoResponseDTO)
def get_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    result = VehiculoService(db).get_by_id(vehiculo_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return result


@router.put("/{vehiculo_id}", response_model=VehiculoResponseDTO)
def update_vehiculo(vehiculo_id: int, payload: UpdateVehiculoSchema, db: Session = Depends(get_db)):
    dto = UpdateVehiculoDTO(**payload.model_dump())
    result = VehiculoService(db).update(vehiculo_id, dto)
    if result is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return result


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    if not VehiculoService(db).delete(vehiculo_id):
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
