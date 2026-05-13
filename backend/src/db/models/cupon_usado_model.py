from sqlalchemy import Column, ForeignKey, Integer

from src.db.connection import Base


class CuponUsado(Base):
    __tablename__ = "cupones_usados"

    pasajero_id = Column(Integer, ForeignKey("pasajeros.id"), primary_key=True)
    cupon_id = Column(Integer, ForeignKey("cupones.id"), primary_key=True)
