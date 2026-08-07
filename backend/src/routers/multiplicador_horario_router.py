from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.multiplicador_horario_dto import CreateMultiplicadorDTO, MultiplicadorResponseDTO
from src.middlewares.auth_middleware import get_current_user, require_admin
from src.schemas.multiplicador_horario_schema import CreateMultiplicadorSchema
from src.services.multiplicador_horario_service import MultiplicadorHorarioService

router = APIRouter(prefix="/multiplicadores-horario", tags=["multiplicadores-horario"])


@router.post("/", response_model=MultiplicadorResponseDTO, status_code=status.HTTP_201_CREATED)
def create_multiplicador(
    payload: CreateMultiplicadorSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    dto = CreateMultiplicadorDTO(**payload.model_dump())
    return MultiplicadorHorarioService(db).create(dto)


@router.get("/", response_model=list[MultiplicadorResponseDTO])
def list_multiplicadores(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return MultiplicadorHorarioService(db).list_all()
