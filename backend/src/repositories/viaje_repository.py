from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from src.db.models.cargo_model import Cargo
from src.db.models.viaje_model import Viaje


class ViajeRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Viaje:
        v = Viaje(**kwargs)
        self.db.add(v)
        self.db.commit()
        self.db.refresh(v)
        return v

    def get_by_id(self, viaje_id: int) -> Viaje | None:
        return self.db.query(Viaje).filter(Viaje.id == viaje_id).first()

    def save(self, v: Viaje) -> Viaje:
        self.db.add(v)
        self.db.commit()
        self.db.refresh(v)
        return v

    def list_by_pasajero(
        self, pasajero_id: int, desde: Optional[datetime] = None, hasta: Optional[datetime] = None
    ) -> list[Viaje]:
        q = self.db.query(Viaje).filter(Viaje.pasajero_id == pasajero_id)
        if desde:
            q = q.filter(Viaje.fecha_solicitud >= desde)
        if hasta:
            q = q.filter(Viaje.fecha_solicitud <= hasta)
        return q.order_by(Viaje.fecha_solicitud.desc()).all()

    def list_finalizados_conductor(
        self, conductor_id: int, anio: int, mes: int
    ) -> list[Viaje]:
        from sqlalchemy import extract

        return (
            self.db.query(Viaje)
            .filter(
                Viaje.conductor_id == conductor_id,
                Viaje.estado == "finalizado",
                extract("year", Viaje.fecha_fin) == anio,
                extract("month", Viaje.fecha_fin) == mes,
            )
            .all()
        )

    def count_finalizados_por_conductor(self, conductor_id: int) -> int:
        return (
            self.db.query(Viaje)
            .filter(Viaje.conductor_id == conductor_id, Viaje.estado == "finalizado")
            .count()
        )

    def cargos_por_viaje(self, viaje_id: int) -> list[Cargo]:
        return self.db.query(Cargo).filter(Cargo.viaje_id == viaje_id).all()

    def crear_cargo(self, viaje_id: int, monto: float, motivo: str) -> Cargo:
        c = Cargo(viaje_id=viaje_id, monto=monto, motivo=motivo)
        self.db.add(c)
        self.db.commit()
        self.db.refresh(c)
        return c
