from sqlalchemy import Column, Integer, Numeric, String

from src.db.connection import Base


class Tarifa(Base):
    __tablename__ = "tarifas"

    id = Column(Integer, primary_key=True)
    categoria = Column(String, unique=True, nullable=False)
    precio_base = Column(Numeric(10, 2), nullable=False)
    precio_por_km = Column(Numeric(10, 2), nullable=False)
