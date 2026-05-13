from datetime import date

from sqlalchemy.orm import Session

from src.db.models.cupon_model import Cupon
from src.db.models.cupon_usado_model import CuponUsado


class CuponRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, codigo: str, porcentaje_descuento: int, fecha_vencimiento: date) -> Cupon:
        c = Cupon(codigo=codigo, porcentaje_descuento=porcentaje_descuento, fecha_vencimiento=fecha_vencimiento)
        self.db.add(c)
        self.db.commit()
        self.db.refresh(c)
        return c

    def get_by_codigo(self, codigo: str) -> Cupon | None:
        return self.db.query(Cupon).filter(Cupon.codigo == codigo).first()

    def get_by_id(self, cupon_id: int) -> Cupon | None:
        return self.db.query(Cupon).filter(Cupon.id == cupon_id).first()

    def usado_por(self, pasajero_id: int, cupon_id: int) -> bool:
        return (
            self.db.query(CuponUsado)
            .filter(CuponUsado.pasajero_id == pasajero_id, CuponUsado.cupon_id == cupon_id)
            .first()
            is not None
        )

    def marcar_usado(self, pasajero_id: int, cupon_id: int) -> None:
        self.db.add(CuponUsado(pasajero_id=pasajero_id, cupon_id=cupon_id))
        self.db.commit()
