from sqlalchemy.orm import Session

from src.db.models.metodo_pago_model import MetodoPago


class MetodoPagoRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, pasajero_id: int, tipo: str, ultimos_digitos: str | None) -> MetodoPago:
        m = MetodoPago(pasajero_id=pasajero_id, tipo=tipo, ultimos_digitos=ultimos_digitos)
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return m

    def get_by_id(self, metodo_id: int) -> MetodoPago | None:
        return self.db.query(MetodoPago).filter(MetodoPago.id == metodo_id).first()

    def list_by_pasajero(self, pasajero_id: int) -> list[MetodoPago]:
        return self.db.query(MetodoPago).filter(MetodoPago.pasajero_id == pasajero_id).all()
