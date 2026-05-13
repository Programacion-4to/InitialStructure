from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.metodo_pago_dto import CreateMetodoPagoDTO, MetodoPagoResponseDTO
from src.schemas.metodo_pago_schema import CreateMetodoPagoSchema
from src.services.metodo_pago_service import MetodoPagoService

router = APIRouter(prefix="/metodos-pago", tags=["metodos-pago"])


@router.post("/", response_model=MetodoPagoResponseDTO, status_code=status.HTTP_201_CREATED)
def create_metodo(payload: CreateMetodoPagoSchema, db: Session = Depends(get_db)):
    dto = CreateMetodoPagoDTO(**payload.model_dump())
    return MetodoPagoService(db).create(dto)
