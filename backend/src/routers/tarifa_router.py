from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.tarifa_dto import CreateTarifaDTO, TarifaResponseDTO, UpdateTarifaDTO
from src.middlewares.auth_middleware import get_current_user, require_admin
from src.schemas.tarifa_schema import CreateTarifaSchema, UpdateTarifaSchema
from src.services.tarifa_service import TarifaService

router = APIRouter(prefix="/tarifas", tags=["tarifas"])


@router.post("/", response_model=TarifaResponseDTO, status_code=status.HTTP_201_CREATED)
def create_tarifa(
    payload: CreateTarifaSchema, db: Session = Depends(get_db), _: User = Depends(require_admin)
):
    dto = CreateTarifaDTO(**payload.model_dump())
    return TarifaService(db).create(dto)


@router.get("/", response_model=list[TarifaResponseDTO])
def list_tarifas(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return TarifaService(db).list_all()


@router.get("/{categoria}", response_model=TarifaResponseDTO)
def get_tarifa(categoria: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return TarifaService(db).get_by_categoria(categoria)


@router.put("/{categoria}", response_model=TarifaResponseDTO)
def update_tarifa(
    categoria: str,
    payload: UpdateTarifaSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    dto = UpdateTarifaDTO(**payload.model_dump())
    return TarifaService(db).update(categoria, dto)
