from sqlalchemy import Column, ForeignKey, Integer, String

from src.db.connection import Base


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True)
    conductor_id = Column(Integer, ForeignKey("conductores.id"), nullable=False)
    patente = Column(String, unique=True, nullable=False)
    modelo = Column(String, nullable=False)
    anio = Column(Integer, nullable=False)
    categoria = Column(String, nullable=False)  # 'economico' | 'confort' | 'premium'
