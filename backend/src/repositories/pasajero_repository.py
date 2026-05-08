from sqlalchemy.orm import Session

from src.db.models.pasajero_model import Pasajero


class PasajeroRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, nombre: str, email: str, telefono: str) -> Pasajero:
        pasajero = Pasajero(email=email, nombre=nombre, telefono=telefono)
        self.db.add(pasajero)
        self.db.commit()
        self.db.refresh(pasajero)
        return pasajero

    def get_by_id(self, pasajero_id: int) -> Pasajero | None:
        return self.db.query(Pasajero).filter(Pasajero.id == pasajero_id).first()

    def get_by_email(self, email: str) -> Pasajero | None:
        return self.db.query(Pasajero).filter(Pasajero.email == email).first()

    def update(self, pasajero: Pasajero) -> Pasajero:
        self.db.add(pasajero)
        self.db.commit()
        self.db.refresh(pasajero)
        return pasajero

    def delete(self, pasajero: Pasajero) -> None:
        self.db.delete(pasajero)
        self.db.commit()
