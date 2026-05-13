from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.multiplicador_horario_dto import CreateMultiplicadorDTO, MultiplicadorResponseDTO
from src.schemas.multiplicador_horario_schema import CreateMultiplicadorSchema
from src.services.multiplicador_horario_service import MultiplicadorHorarioService

router = APIRouter(prefix="/multiplicadores-horario", tags=["multiplicadores-horario"])


@router.post("/", response_model=MultiplicadorResponseDTO, status_code=status.HTTP_201_CREATED)
def create_multiplicador(payload: CreateMultiplicadorSchema, db: Session = Depends(get_db)):
    dto = CreateMultiplicadorDTO(**payload.model_dump())
    return MultiplicadorHorarioService(db).create(dto)


@router.get("/", response_model=list[MultiplicadorResponseDTO])
def list_multiplicadores(db: Session = Depends(get_db)):
    return MultiplicadorHorarioService(db).list_all()
