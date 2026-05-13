from sqlalchemy import Column, ForeignKey, Integer, Numeric, String

from src.db.connection import Base


class Cargo(Base):
    __tablename__ = "cargos"

    id = Column(Integer, primary_key=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"), nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    motivo = Column(String, nullable=False, default="Penalidad por cancelación tardía")
