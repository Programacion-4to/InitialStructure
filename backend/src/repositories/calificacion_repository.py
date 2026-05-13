from sqlalchemy.orm import Session

from src.db.models.calificacion_model import Calificacion


class CalificacionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_viaje(self, viaje_id: int) -> Calificacion | None:
        return self.db.query(Calificacion).filter(Calificacion.viaje_id == viaje_id).first()

    def create(self, viaje_id: int, puntaje_pasajero: int | None, puntaje_conductor: int | None, comentario: str | None) -> Calificacion:
        c = Calificacion(
            viaje_id=viaje_id,
            puntaje_pasajero=puntaje_pasajero,
            puntaje_conductor=puntaje_conductor,
            comentario=comentario,
        )
        self.db.add(c)
        self.db.commit()
        self.db.refresh(c)
        return c

    def puntajes_conductor(self, conductor_id: int) -> list[int]:
        from src.db.models.viaje_model import Viaje

        rows = (
            self.db.query(Calificacion.puntaje_conductor)
            .join(Viaje, Viaje.id == Calificacion.viaje_id)
            .filter(Viaje.conductor_id == conductor_id, Calificacion.puntaje_conductor.isnot(None))
            .all()
        )
        return [r[0] for r in rows]

    def puntajes_conductor_mes(self, conductor_id: int, anio: int, mes: int) -> list[int]:
        from sqlalchemy import extract

        from src.db.models.viaje_model import Viaje

        rows = (
            self.db.query(Calificacion.puntaje_conductor)
            .join(Viaje, Viaje.id == Calificacion.viaje_id)
            .filter(
                Viaje.conductor_id == conductor_id,
                Viaje.estado == "finalizado",
                Calificacion.puntaje_conductor.isnot(None),
                extract("year", Viaje.fecha_fin) == anio,
                extract("month", Viaje.fecha_fin) == mes,
            )
            .all()
        )
        return [r[0] for r in rows]
