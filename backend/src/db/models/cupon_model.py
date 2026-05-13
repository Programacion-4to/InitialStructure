from sqlalchemy import Column, Date, Integer, String

from src.db.connection import Base


class Cupon(Base):
    __tablename__ = "cupones"

    id = Column(Integer, primary_key=True)
    codigo = Column(String, unique=True, nullable=False)
    porcentaje_descuento = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
