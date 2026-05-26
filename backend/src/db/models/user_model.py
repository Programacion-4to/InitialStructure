from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.connection import Base


class Cuenta(Base):                                           # Modelo de datos para Cuenta
    __tablename__ = "cuentas"                                 # Define el nombre de la tabla en BD

    id = Column(Integer, primary_key=True)                    # Identificador único de la cuenta (PK)
    email = Column(String, unique=True, nullable=False)       # Email único para inicio de sesión
    password_hash = Column(String, nullable=False)
    plan = Column(String, nullable=False)                     # Tipo de plan suscrito (ej. básico, premium)
    is_admin = Column(Boolean, default=False, nullable=False)  # Permite administrar catálogo sin perfil
    fecha_alta = Column(DateTime, server_default=func.now())  # Fecha y hora de creación automática

    perfiles = relationship(                                  # Relación 1:N con Perfil
        "Perfil",
        back_populates="cuenta",
        cascade="all, delete-orphan",                         # Borrado en cascada al eliminar cuenta
    )


class Perfil(Base):                                           # Modelo de datos para Perfil
    __tablename__ = "perfiles"                                # Define el nombre de la tabla en BD

    id = Column(Integer, primary_key=True)                    # Identificador único del perfil (PK)
    cuenta_id = Column(Integer, ForeignKey("cuentas.id"), nullable=False) # FK vinculada a la Cuenta
    nombre = Column(String, nullable=False)                   # Nombre del perfil
    pin = Column(String, nullable=True)                       # Código PIN opcional para acceso
    pin_intentos_fallidos = Column(Integer, default=0, nullable=False)
    pin_bloqueado_hasta = Column(DateTime, nullable=True)
    es_infantil = Column(Boolean, default=False)              # Flag para filtro de contenido infantil
    avatar = Column(String, nullable=True)                    # Ruta o identificador del avatar seleccionado

    cuenta = relationship("Cuenta", back_populates="perfiles")# Relación inversa con Cuenta
    vistas = relationship("Vista", back_populates="perfil", cascade="all, delete-orphan") # Historial de visualizaciones
    calificaciones = relationship(                            # Relación con Calificaciones del perfil
        "Calificacion",
        back_populates="perfil",
        cascade="all, delete-orphan",
    )
    mi_lista = relationship(                                  # Relación N:M con Contenido ("Mi lista")
        "Contenido",
        secondary="mi_lista",
        back_populates="en_listas",
    )

    __table_args__ = (
        UniqueConstraint("cuenta_id", "nombre", name="uq_perfil_nombre_por_cuenta"), # Evita perfiles con mismo nombre en una cuenta
    )
