from sqlalchemy import Boolean, Column, Float, Integer, String

from src.db.connection import Base


class Conductores(Base):
    __tablename__ = "conductores"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    licencia = Column(String, unique=True, nullable=False)
    calificacion_promedio = Column(Float, nullable=False, default=0.0)
    disponible = Column(Boolean, nullable=False, default=True)

