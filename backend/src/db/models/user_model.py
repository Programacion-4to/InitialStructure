from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from src.db.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'pasajero' | 'conductor' | 'admin'
    pasajero_id = Column(Integer, ForeignKey("pasajeros.id"), nullable=True)
    conductor_id = Column(Integer, ForeignKey("conductores.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
