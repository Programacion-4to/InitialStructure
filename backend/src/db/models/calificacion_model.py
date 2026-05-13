from sqlalchemy import Column, ForeignKey, Integer, Text

from src.db.connection import Base


class Calificacion(Base):
    __tablename__ = "calificaciones"

    id = Column(Integer, primary_key=True)
    viaje_id = Column(Integer, ForeignKey("viajes.id"), unique=True, nullable=False)
    puntaje_pasajero = Column(Integer, nullable=True)
    puntaje_conductor = Column(Integer, nullable=True)
    comentario = Column(Text, nullable=True)
