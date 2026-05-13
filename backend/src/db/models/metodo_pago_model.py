from sqlalchemy import Column, ForeignKey, Integer, String

from src.db.connection import Base


class MetodoPago(Base):
    __tablename__ = "metodos_pago"

    id = Column(Integer, primary_key=True)
    pasajero_id = Column(Integer, ForeignKey("pasajeros.id"), nullable=False)
    tipo = Column(String, nullable=False)
    ultimos_digitos = Column(String, nullable=True)
