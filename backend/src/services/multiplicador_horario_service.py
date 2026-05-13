from sqlalchemy.orm import Session

from src.dtos.multiplicador_horario_dto import CreateMultiplicadorDTO, MultiplicadorResponseDTO
from src.repositories.multiplicador_horario_repository import MultiplicadorHorarioRepository
from src.utils.errors import ConflictError


class MultiplicadorHorarioService:
    def __init__(self, db: Session):
        self.repo = MultiplicadorHorarioRepository(db)

    def create(self, dto: CreateMultiplicadorDTO) -> MultiplicadorResponseDTO:
        if self.repo.find_overlap(dto.dia_semana, dto.hora_desde, dto.hora_hasta) is not None:
            raise ConflictError("Existe una franja superpuesta para ese día")
        m = self.repo.create(dto.dia_semana, dto.hora_desde, dto.hora_hasta, dto.factor)
        return MultiplicadorResponseDTO(
            id=m.id,
            dia_semana=m.dia_semana,
            hora_desde=m.hora_desde,
            hora_hasta=m.hora_hasta,
            factor=float(m.factor),
        )

    def list_all(self) -> list[MultiplicadorResponseDTO]:
        return [
            MultiplicadorResponseDTO(
                id=m.id,
                dia_semana=m.dia_semana,
                hora_desde=m.hora_desde,
                hora_hasta=m.hora_hasta,
                factor=float(m.factor),
            )
            for m in self.repo.list_all()
        ]
