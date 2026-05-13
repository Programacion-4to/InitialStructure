from sqlalchemy import Column, Integer, Numeric, Time

from src.db.connection import Base


class MultiplicadorHorario(Base):
    __tablename__ = "multiplicadores_horario"

    id = Column(Integer, primary_key=True)
    dia_semana = Column(Integer, nullable=False)
    hora_desde = Column(Time, nullable=False)
    hora_hasta = Column(Time, nullable=False)
    factor = Column(Numeric(3, 2), nullable=False)
