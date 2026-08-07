from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.metodo_pago_dto import CreateMetodoPagoDTO, MetodoPagoResponseDTO
from src.middlewares.auth_middleware import ensure_self_pasajero, get_current_user
from src.schemas.metodo_pago_schema import CreateMetodoPagoSchema
from src.services.metodo_pago_service import MetodoPagoService

router = APIRouter(prefix="/metodos-pago", tags=["metodos-pago"])


@router.post("/", response_model=MetodoPagoResponseDTO, status_code=status.HTTP_201_CREATED)
def create_metodo(
    payload: CreateMetodoPagoSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ensure_self_pasajero(payload.pasajero_id, user)
    dto = CreateMetodoPagoDTO(**payload.model_dump())
    return MetodoPagoService(db).create(dto)
