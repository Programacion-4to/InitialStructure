from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.sql import func

from src.db.connection import Base


class Viaje(Base):
    __tablename__ = "viajes"

    id = Column(Integer, primary_key=True)
    pasajero_id = Column(Integer, ForeignKey("pasajeros.id"), nullable=False)
    conductor_id = Column(Integer, ForeignKey("conductores.id"), nullable=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=True)
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id"), nullable=False)
    cupon_id = Column(Integer, ForeignKey("cupones.id"), nullable=True)
    categoria = Column(String, nullable=False)
    origen = Column(Text, nullable=False)
    destino = Column(Text, nullable=False)
    distancia_km = Column(Numeric(10, 2), nullable=False)
    fecha_solicitud = Column(DateTime, server_default=func.now())
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    estado = Column(String, nullable=False, default="pendiente")
    tarifa_final = Column(Numeric(10, 2), nullable=False)
    multiplicador_aplicado = Column(Numeric(3, 2), nullable=False, default=1.0)
