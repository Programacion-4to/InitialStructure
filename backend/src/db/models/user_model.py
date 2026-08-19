<<<<<<< Updated upstream
from sqlalchemy import Column, Integer, String, Boolean, DateTime
=======
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, Index
from sqlalchemy.orm import relationship
>>>>>>> Stashed changes
from sqlalchemy.sql import func

from src.db.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
<<<<<<< Updated upstream
    age = Column(Integer, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
=======
    plan = Column(String, nullable=False)                     # Tipo de plan suscrito (ej. básico, premium)
    is_admin = Column(Boolean, default=False, nullable=False)  # Permite administrar catálogo sin perfil
    role = Column(String, nullable=False, default="user", server_default="user")
    email_verified = Column(Boolean, nullable=False, default=False, server_default="false")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
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
    sessions = relationship("UserSession", back_populates="cuenta", cascade="all, delete-orphan")
    email_tokens = relationship("EmailToken", back_populates="cuenta", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token_hash = Column(String(64), unique=True, nullable=False)
    device_name = Column(String(160), nullable=False, default="Unknown device")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    last_used_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    cuenta = relationship("Cuenta", back_populates="sessions")


class EmailToken(Base):
    __tablename__ = "email_tokens"

    id = Column(String(36), primary_key=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False)
    purpose = Column(String(32), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    cuenta = relationship("Cuenta", back_populates="email_tokens")
    __table_args__ = (Index("ix_email_tokens_account_purpose", "cuenta_id", "purpose"),)
    descargas = relationship("Descarga", back_populates="perfil", cascade="all, delete-orphan")
    mi_lista = relationship(                                  # Relación N:M con Contenido ("Mi lista")
        "Contenido",
        secondary="mi_lista",
        back_populates="en_listas",
    )

    __table_args__ = (
        UniqueConstraint("cuenta_id", "nombre", name="uq_perfil_nombre_por_cuenta"), # Evita perfiles con mismo nombre en una cuenta
    )
>>>>>>> Stashed changes
