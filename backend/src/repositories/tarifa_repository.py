from sqlalchemy.orm import Session

from src.db.models.tarifa_model import Tarifa


class TarifaRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, categoria: str, precio_base: float, precio_por_km: float) -> Tarifa:
        t = Tarifa(categoria=categoria, precio_base=precio_base, precio_por_km=precio_por_km)
        self.db.add(t)
        self.db.commit()
        self.db.refresh(t)
        return t

    def list_all(self) -> list[Tarifa]:
        return self.db.query(Tarifa).all()

    def get_by_categoria(self, categoria: str) -> Tarifa | None:
        return self.db.query(Tarifa).filter(Tarifa.categoria == categoria).first()

    def update(self, t: Tarifa) -> Tarifa:
        self.db.add(t)
        self.db.commit()
        self.db.refresh(t)
        return t
