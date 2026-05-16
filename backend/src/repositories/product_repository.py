from sqlalchemy import func
from sqlalchemy.orm import Session, aliased

from src.db import Calificacion, Contenido, Episodio, Genero, Temporada, Vista


class GeneroRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, nombre: str) -> Genero:
        genero = Genero(nombre=nombre)
        self.db.add(genero)
        self.db.commit()
        self.db.refresh(genero)
        return genero

    def find_by_id(self, genero_id: int) -> Genero | None:
        return self.db.query(Genero).filter(Genero.id == genero_id).first()

    def find_by_name(self, nombre: str) -> Genero | None:
        return self.db.query(Genero).filter(func.lower(Genero.nombre) == nombre.lower()).first()

    def list_all(self) -> list[Genero]:
        return self.db.query(Genero).order_by(Genero.nombre).all()

    def delete(self, genero_id: int) -> bool:
        genero = self.find_by_id(genero_id)
        if not genero:
            return False

        self.db.delete(genero)
        self.db.commit()
        return True


class ContenidoRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        titulo: str,
        tipo: str,
        anio: int,
        clasificacion_edad: str,
        descripcion: str | None = None,
        duracion_min: int | None = None,
        generos_ids: list[int] | None = None,
        storage_folder_id: str | None = None,
        video_storage_key: str | None = None,
        video_mime: str | None = None,
        video_size: int | None = None,
    ) -> Contenido:
        contenido = Contenido(
            titulo=titulo,
            tipo=tipo,
            anio=anio,
            descripcion=descripcion,
            duracion_min=duracion_min,
            clasificacion_edad=clasificacion_edad,
            storage_folder_id=storage_folder_id,
            video_storage_key=video_storage_key,
            video_mime=video_mime,
            video_size=video_size,
        )

        if generos_ids:
            contenido.generos = self.db.query(Genero).filter(Genero.id.in_(generos_ids)).all()

        self.db.add(contenido)
        self.db.commit()
        self.db.refresh(contenido)
        return contenido

    def find_by_id(self, contenido_id: int) -> Contenido | None:
        return self.db.query(Contenido).filter(Contenido.id == contenido_id).first()

    def list_all(self) -> list[Contenido]:
        return self.db.query(Contenido).all()

    def search(
        self,
        texto: str | None = None,
        tipo: str | None = None,
        genero_id: int | None = None,
        genero: str | None = None,
        clasificacion_edad: str | None = None,
        ordenar: str | None = None,
    ) -> list[Contenido]:
        query = self.db.query(Contenido)

        if texto:
            query = query.filter(Contenido.titulo.ilike(f"%{texto}%"))

        if tipo:
            query = query.filter(Contenido.tipo == tipo)

        if clasificacion_edad:
            query = query.filter(Contenido.clasificacion_edad == clasificacion_edad)

        if genero_id:
            query = query.join(Contenido.generos).filter(Genero.id == genero_id)
        elif genero:
            query = query.join(Contenido.generos).filter(Genero.nombre.ilike(genero))

        if ordenar == "anio_desc":
            query = query.order_by(Contenido.anio.desc(), Contenido.titulo.asc())
        else:
            query = query.order_by(Contenido.titulo.asc())

        return query.all()

    def top(self, limit: int = 10, genero: str | None = None) -> list[Contenido]:
        vista_contenido = aliased(Vista)
        vista_episodio = aliased(Vista)
        total_vistas = (
            func.count(func.distinct(vista_contenido.id))
            + func.count(func.distinct(vista_episodio.id))
        )

        query = (
            self.db.query(Contenido)
            .outerjoin(vista_contenido, vista_contenido.contenido_id == Contenido.id)
            .outerjoin(Temporada, Temporada.contenido_id == Contenido.id)
            .outerjoin(Episodio, Episodio.temporada_id == Temporada.id)
            .outerjoin(vista_episodio, vista_episodio.episodio_id == Episodio.id)
            .filter(
                (vista_contenido.terminado.is_(True))
                | (vista_episodio.terminado.is_(True))
            )
        )

        if genero:
            query = query.join(Contenido.generos).filter(Genero.nombre.ilike(genero))

        return (
            query.group_by(Contenido.id)
            .order_by(total_vistas.desc(), Contenido.titulo.asc())
            .limit(limit)
            .all()
        )

    def update(self, contenido_id: int, **fields) -> Contenido | None:
        generos_ids = fields.pop("generos_ids", None)
        contenido = self.find_by_id(contenido_id)
        if not contenido:
            return None

        for key, value in fields.items():
            setattr(contenido, key, value)

        if generos_ids is not None:
            contenido.generos = self.db.query(Genero).filter(Genero.id.in_(generos_ids)).all()

        self.db.commit()
        self.db.refresh(contenido)
        return contenido

    def delete(self, contenido_id: int) -> bool:
        contenido = self.find_by_id(contenido_id)
        if not contenido:
            return False

        self.db.delete(contenido)
        self.db.commit()
        return True


class TemporadaRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        contenido_id: int,
        numero: int,
        anio: int,
        storage_folder_id: str | None = None,
    ) -> Temporada:
        temporada = Temporada(
            contenido_id=contenido_id,
            numero=numero,
            anio=anio,
            storage_folder_id=storage_folder_id,
        )
        self.db.add(temporada)
        self.db.commit()
        self.db.refresh(temporada)
        return temporada

    def find_by_id(self, temporada_id: int) -> Temporada | None:
        return self.db.query(Temporada).filter(Temporada.id == temporada_id).first()

    def list_by_contenido(self, contenido_id: int) -> list[Temporada]:
        return (
            self.db.query(Temporada)
            .filter(Temporada.contenido_id == contenido_id)
            .order_by(Temporada.numero)
            .all()
        )

    def delete(self, temporada_id: int) -> bool:
        temporada = self.find_by_id(temporada_id)
        if not temporada:
            return False

        self.db.delete(temporada)
        self.db.commit()
        return True


class EpisodioRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        temporada_id: int,
        numero: int,
        titulo: str,
        duracion_min: int,
        video_storage_key: str | None = None,
        video_mime: str | None = None,
        video_size: int | None = None,
    ) -> Episodio:
        episodio = Episodio(
            temporada_id=temporada_id,
            numero=numero,
            titulo=titulo,
            duracion_min=duracion_min,
            video_storage_key=video_storage_key,
            video_mime=video_mime,
            video_size=video_size,
        )
        self.db.add(episodio)
        self.db.commit()
        self.db.refresh(episodio)
        return episodio

    def find_by_id(self, episodio_id: int) -> Episodio | None:
        return self.db.query(Episodio).filter(Episodio.id == episodio_id).first()

    def list_by_temporada(self, temporada_id: int) -> list[Episodio]:
        return (
            self.db.query(Episodio)
            .filter(Episodio.temporada_id == temporada_id)
            .order_by(Episodio.numero)
            .all()
        )

    def delete(self, episodio_id: int) -> bool:
        episodio = self.find_by_id(episodio_id)
        if not episodio:
            return False

        self.db.delete(episodio)
        self.db.commit()
        return True


class VistaRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_perfil_and_episodio(self, perfil_id: int, episodio_id: int) -> Vista | None:
        return (
            self.db.query(Vista)
            .filter(Vista.perfil_id == perfil_id, Vista.episodio_id == episodio_id)
            .first()
        )

    def find_by_perfil_and_contenido(self, perfil_id: int, contenido_id: int) -> Vista | None:
        return (
            self.db.query(Vista)
            .filter(Vista.perfil_id == perfil_id, Vista.contenido_id == contenido_id)
            .first()
        )

    def find_existing(
        self,
        perfil_id: int,
        episodio_id: int | None = None,
        contenido_id: int | None = None,
    ) -> Vista | None:
        if episodio_id is not None:
            return self.find_by_perfil_and_episodio(perfil_id, episodio_id)

        if contenido_id is not None:
            return self.find_by_perfil_and_contenido(perfil_id, contenido_id)

        return None

    def create_or_update(
        self,
        perfil_id: int,
        segundos_vistos: int,
        terminado: bool,
        episodio_id: int | None = None,
        contenido_id: int | None = None,
    ) -> Vista:
        vista = self.find_existing(
            perfil_id=perfil_id,
            episodio_id=episodio_id,
            contenido_id=contenido_id,
        )

        if not vista:
            vista = Vista(
                perfil_id=perfil_id,
                episodio_id=episodio_id,
                contenido_id=contenido_id,
            )
            self.db.add(vista)

        vista.segundos_vistos = segundos_vistos
        vista.terminado = terminado

        self.db.commit()
        self.db.refresh(vista)
        return vista

    def list_by_perfil(self, perfil_id: int) -> list[Vista]:
        return (
            self.db.query(Vista)
            .filter(Vista.perfil_id == perfil_id)
            .order_by(Vista.fecha.desc())
            .all()
        )

    def delete(
        self,
        perfil_id: int,
        episodio_id: int | None = None,
        contenido_id: int | None = None,
    ) -> bool:
        vista = self.find_existing(
            perfil_id=perfil_id,
            episodio_id=episodio_id,
            contenido_id=contenido_id,
        )
        if not vista:
            return False

        self.db.delete(vista)
        self.db.commit()
        return True

    def continuar_viendo(self, perfil_id: int) -> list[Vista]:
        return (
            self.db.query(Vista)
            .filter(
                Vista.perfil_id == perfil_id,
                Vista.terminado.is_(False),
                Vista.segundos_vistos > 0,
            )
            .order_by(Vista.fecha.desc())
            .all()
        )


class CalificacionRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_perfil_and_contenido(self, perfil_id: int, contenido_id: int) -> Calificacion | None:
        return (
            self.db.query(Calificacion)
            .filter(
                Calificacion.perfil_id == perfil_id,
                Calificacion.contenido_id == contenido_id,
            )
            .first()
        )

    def create_or_update(
        self,
        perfil_id: int,
        contenido_id: int,
        puntaje: int,
    ) -> Calificacion:
        calificacion = self.find_by_perfil_and_contenido(perfil_id, contenido_id)

        if not calificacion:
            calificacion = Calificacion(perfil_id=perfil_id, contenido_id=contenido_id)
            self.db.add(calificacion)

        calificacion.puntaje = puntaje

        self.db.commit()
        self.db.refresh(calificacion)
        return calificacion

    def list_by_contenido(self, contenido_id: int) -> list[Calificacion]:
        return self.db.query(Calificacion).filter(Calificacion.contenido_id == contenido_id).all()

    def list_by_perfil(self, perfil_id: int) -> list[Calificacion]:
        return self.db.query(Calificacion).filter(Calificacion.perfil_id == perfil_id).all()

    def delete(self, perfil_id: int, contenido_id: int) -> bool:
        calificacion = self.find_by_perfil_and_contenido(perfil_id, contenido_id)
        if not calificacion:
            return False

        self.db.delete(calificacion)
        self.db.commit()
        return True
