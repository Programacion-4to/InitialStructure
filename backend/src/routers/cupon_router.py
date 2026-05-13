from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.cupon_dto import CreateCuponDTO, CuponResponseDTO
from src.schemas.cupon_schema import CreateCuponSchema
from src.services.cupon_service import CuponService

router = APIRouter(prefix="/cupones", tags=["cupones"])


@router.post("/", response_model=CuponResponseDTO, status_code=status.HTTP_201_CREATED)
def create_cupon(payload: CreateCuponSchema, db: Session = Depends(get_db)):
    dto = CreateCuponDTO(**payload.model_dump())
    return CuponService(db).create(dto)
