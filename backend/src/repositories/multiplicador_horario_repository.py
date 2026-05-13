from datetime import time

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from src.db.models.multiplicador_horario_model import MultiplicadorHorario


class MultiplicadorHorarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dia_semana: int, hora_desde: time, hora_hasta: time, factor: float) -> MultiplicadorHorario:
        m = MultiplicadorHorario(
            dia_semana=dia_semana, hora_desde=hora_desde, hora_hasta=hora_hasta, factor=factor
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return m

    def list_all(self) -> list[MultiplicadorHorario]:
        return self.db.query(MultiplicadorHorario).all()

    def find_overlap(self, dia_semana: int, hora_desde: time, hora_hasta: time) -> MultiplicadorHorario | None:
        return (
            self.db.query(MultiplicadorHorario)
            .filter(
                MultiplicadorHorario.dia_semana == dia_semana,
                and_(
                    MultiplicadorHorario.hora_desde < hora_hasta,
                    MultiplicadorHorario.hora_hasta > hora_desde,
                ),
            )
            .first()
        )

    def find_active(self, dia_semana: int, hora_actual: time) -> MultiplicadorHorario | None:
        return (
            self.db.query(MultiplicadorHorario)
            .filter(
                MultiplicadorHorario.dia_semana == dia_semana,
                MultiplicadorHorario.hora_desde <= hora_actual,
                MultiplicadorHorario.hora_hasta > hora_actual,
            )
            .first()
        )
