from sqlalchemy.orm import Session

from src.db.models.vehiculo_model import Vehiculo


class VehiculoRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, conductor_id: int, patente: str, modelo: str, anio: int, categoria: str) -> Vehiculo:
        v = Vehiculo(conductor_id=conductor_id, patente=patente, modelo=modelo, anio=anio, categoria=categoria)
        self.db.add(v)
        self.db.commit()
        self.db.refresh(v)
        return v

    def get_by_id(self, vehiculo_id: int) -> Vehiculo | None:
        return self.db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()

    def get_by_patente(self, patente: str) -> Vehiculo | None:
        return self.db.query(Vehiculo).filter(Vehiculo.patente == patente).first()

    def list_by_conductor(self, conductor_id: int) -> list[Vehiculo]:
        return self.db.query(Vehiculo).filter(Vehiculo.conductor_id == conductor_id).all()

    def find_available_for_conductor(self, conductor_id: int, categoria: str) -> Vehiculo | None:
        return (
            self.db.query(Vehiculo)
            .filter(Vehiculo.conductor_id == conductor_id, Vehiculo.categoria == categoria)
            .first()
        )

    def update(self, v: Vehiculo) -> Vehiculo:
        self.db.add(v)
        self.db.commit()
        self.db.refresh(v)
        return v

    def delete(self, v: Vehiculo) -> None:
        self.db.delete(v)
        self.db.commit()
