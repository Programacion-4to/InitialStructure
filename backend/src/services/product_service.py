from fastapi import UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.dtos import (
    CalificacionResponseDTO,
    ContenidoResponseDTO,
    CreateCalificacionDTO,
    CreateContenidoDTO,
    CreateEpisodioDTO,
    CreateTemporadaDTO,
    CreateVistaDTO,
    EpisodioResponseDTO,
    GeneroResponseDTO,
    TemporadaResponseDTO,
    UpdateContenidoDTO,
    VistaResponseDTO,
)
from src.mappers import (
    to_calificacion_response,
    to_contenido_response,
    to_contenido_response_list,
    to_episodio_response,
    to_genero_response,
    to_genero_response_list,
    to_temporada_response,
    to_vista_response,
    to_vista_response_list,
)
from src.repositories import (
    CalificacionRepository,
    ContenidoRepository,
    EpisodioRepository,
    GeneroRepository,
    TemporadaRepository,
    VistaRepository,
)
from src.repositories import PerfilRepository
from src.services.storage_service import StorageService
from src.utils import ConflictError, ForbiddenError, NotFoundError


class VideoSourceDTO(BaseModel):
    file_id: str
    mime_type: str
    filename: str


class GeneroService:
    def __init__(self, db: Session):
        self.genero_repo = GeneroRepository(db)

    def create(self, nombre: str) -> GeneroResponseDTO:
        nombre = nombre.strip()
        if not nombre:
            raise ConflictError("El nombre del genero es obligatorio")

        if self.genero_repo.find_by_name(nombre):
            raise ConflictError("Ya existe un genero con ese nombre")

        genero = self.genero_repo.create(nombre)
        return to_genero_response(genero)

    def list_all(self) -> list[GeneroResponseDTO]:
        return to_genero_response_list(self.genero_repo.list_all())

    def delete(self, genero_id: int) -> None:
        if not self.genero_repo.delete(genero_id):
            raise NotFoundError("Genero no encontrado")


class ContenidoService:
    def __init__(self, db: Session):
        self.contenido_repo = ContenidoRepository(db)
        self.genero_repo = GeneroRepository(db)
        self.perfil_repo = PerfilRepository(db)

    def create(self, dto: CreateContenidoDTO) -> ContenidoResponseDTO:
        return self.create_with_video(dto, video_file=None)

    def create_with_video(
        self,
        dto: CreateContenidoDTO,
        video_file: UploadFile | None,
    ) -> ContenidoResponseDTO:
        self._validate_content_payload(
            tipo=dto.tipo,
            duracion_min=dto.duracion_min,
            generos_ids=dto.generos_ids,
        )

        storage = StorageService()
        folder_id = storage.create_folder(dto.titulo)
        video = None

        if dto.tipo == "pelicula":
            if video_file is None:
                raise ConflictError("Una pelicula debe incluir un archivo de video")
            self._validate_video_file(video_file)
            video = storage.upload_video(
                file=video_file.file,
                filename=video_file.filename or f"{dto.titulo}.mp4",
                mime_type=video_file.content_type or "video/mp4",
                parent_folder_id=folder_id,
            )
        elif video_file is not None:
            raise ConflictError("Las series no llevan video directo; carga videos en sus episodios")

        contenido = self.contenido_repo.create(
            titulo=dto.titulo,
            tipo=dto.tipo,
            anio=dto.anio,
            descripcion=dto.descripcion,
            duracion_min=dto.duracion_min,
            clasificacion_edad=dto.clasificacion_edad,
            generos_ids=dto.generos_ids,
            storage_folder_id=folder_id,
            video_storage_key=video.object_key if video else None,
            video_mime=video.mime_type if video else None,
            video_size=video.size if video else None,
        )
        return to_contenido_response(contenido)

    def get_by_id(self, contenido_id: int) -> ContenidoResponseDTO:
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        return to_contenido_response(contenido)

    def search(self, q=None, tipo=None, genero_id=None, genero=None, perfil_id=None, ordenar=None):
        clasificacion_edad = None
        if perfil_id is not None:
            perfil = self.perfil_repo.find_by_id(perfil_id)
            if not perfil:
                raise NotFoundError("Perfil no encontrado")
            if perfil.es_infantil:
                clasificacion_edad = "ATP"

        contenidos = self.contenido_repo.search(
            texto=q,
            tipo=tipo,
            genero_id=genero_id,
            genero=genero,
            clasificacion_edad=clasificacion_edad,
            ordenar=ordenar,
        )
        return to_contenido_response_list(contenidos)

    def update(self, contenido_id: int, dto: UpdateContenidoDTO) -> ContenidoResponseDTO:
        contenido_actual = self.contenido_repo.find_by_id(contenido_id)
        if not contenido_actual:
            raise NotFoundError("Contenido no encontrado")

        fields = dto.model_dump(exclude_unset=True)
        self._validate_content_payload(
            tipo=fields.get("tipo", contenido_actual.tipo),
            duracion_min=fields.get("duracion_min", contenido_actual.duracion_min),
            generos_ids=fields.get("generos_ids"),
            require_generos=False,
        )

        contenido = self.contenido_repo.update(contenido_id, **fields)
        return to_contenido_response(contenido)

    def delete(self, contenido_id: int) -> None:
        if not self.contenido_repo.delete(contenido_id):
            raise NotFoundError("Contenido no encontrado")

    def top(self, genero: str | None = None) -> list[ContenidoResponseDTO]:
        contenidos = self.contenido_repo.top(limit=10, genero=genero)
        return to_contenido_response_list(contenidos)

    def get_video_source(self, contenido_id: int) -> VideoSourceDTO:
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        if contenido.tipo != "pelicula":
            raise ConflictError("Las series se reproducen por episodio")
        if not contenido.video_storage_key:
            raise NotFoundError("Video no encontrado")

        return VideoSourceDTO(
            file_id=contenido.video_storage_key,
            mime_type=contenido.video_mime or "video/mp4",
            filename=contenido.titulo,
        )

    def _validate_content_payload(self, tipo, duracion_min, generos_ids, require_generos=True):
        if require_generos and not generos_ids:
            raise ConflictError("Cada contenido debe tener al menos un genero")
        if generos_ids:
            generos = [self.genero_repo.find_by_id(gid) for gid in generos_ids]
            if any(g is None for g in generos):
                raise NotFoundError("Uno o mas generos no existen")
        if tipo == "pelicula" and duracion_min is None:
            raise ConflictError("Una pelicula debe tener duracion")
        if tipo == "serie" and duracion_min is not None:
            raise ConflictError("Una serie no debe tener duracion directa")

    def _validate_video_file(self, video_file: UploadFile) -> None:
        content_type = video_file.content_type or ""
        if not content_type.startswith("video/"):
            raise ConflictError("El archivo debe ser un video")


class TemporadaService:
    def __init__(self, db: Session):
        self.contenido_repo = ContenidoRepository(db)
        self.temporada_repo = TemporadaRepository(db)

    def create(self, dto: CreateTemporadaDTO) -> TemporadaResponseDTO:
        contenido = self.contenido_repo.find_by_id(dto.contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        if contenido.tipo != "serie":
            raise ConflictError("Solo las series pueden tener temporadas")
        if not contenido.storage_folder_id:
            raise ConflictError("La serie no tiene carpeta de storage asociada")

        folder_id = StorageService().create_folder(
            name=f"Temporada {dto.numero}",
            parent_folder_id=contenido.storage_folder_id,
        )

        temporada = self.temporada_repo.create(
            contenido_id=dto.contenido_id,
            numero=dto.numero,
            anio=dto.anio,
            storage_folder_id=folder_id,
        )
        return to_temporada_response(temporada)

    def list_by_contenido(self, contenido_id: int) -> list[TemporadaResponseDTO]:
        if not self.contenido_repo.find_by_id(contenido_id):
            raise NotFoundError("Contenido no encontrado")
        return [
            to_temporada_response(t)
            for t in self.temporada_repo.list_by_contenido(contenido_id)
        ]

    def delete(self, temporada_id: int) -> None:
        if not self.temporada_repo.delete(temporada_id):
            raise NotFoundError("Temporada no encontrada")


class EpisodioService:
    def __init__(self, db: Session):
        self.temporada_repo = TemporadaRepository(db)
        self.episodio_repo = EpisodioRepository(db)

    def create(self, dto: CreateEpisodioDTO) -> EpisodioResponseDTO:
        return self.create_with_video(dto, video_file=None)

    def create_with_video(
        self,
        dto: CreateEpisodioDTO,
        video_file: UploadFile | None,
    ) -> EpisodioResponseDTO:
        temporada = self.temporada_repo.find_by_id(dto.temporada_id)
        if not temporada:
            raise NotFoundError("Temporada no encontrada")
        if not temporada.storage_folder_id:
            raise ConflictError("La temporada no tiene carpeta de storage asociada")
        if video_file is None:
            raise ConflictError("Un episodio debe incluir un archivo de video")

        content_type = video_file.content_type or ""
        if not content_type.startswith("video/"):
            raise ConflictError("El archivo debe ser un video")

        video = StorageService().upload_video(
            file=video_file.file,
            filename=video_file.filename or f"episodio-{dto.numero}.mp4",
            mime_type=video_file.content_type or "video/mp4",
            parent_folder_id=temporada.storage_folder_id,
        )

        episodio = self.episodio_repo.create(
            temporada_id=dto.temporada_id,
            numero=dto.numero,
            titulo=dto.titulo,
            duracion_min=dto.duracion_min,
            video_storage_key=video.object_key,
            video_mime=video.mime_type,
            video_size=video.size,
        )
        return to_episodio_response(episodio)

    def list_by_temporada(self, temporada_id: int) -> list[EpisodioResponseDTO]:
        if not self.temporada_repo.find_by_id(temporada_id):
            raise NotFoundError("Temporada no encontrada")
        return [
            to_episodio_response(e)
            for e in self.episodio_repo.list_by_temporada(temporada_id)
        ]

    def delete(self, episodio_id: int) -> None:
        if not self.episodio_repo.delete(episodio_id):
            raise NotFoundError("Episodio no encontrado")

    def get_video_source(self, episodio_id: int) -> VideoSourceDTO:
        episodio = self.episodio_repo.find_by_id(episodio_id)
        if not episodio:
            raise NotFoundError("Episodio no encontrado")
        if not episodio.video_storage_key:
            raise NotFoundError("Video no encontrado")

        return VideoSourceDTO(
            file_id=episodio.video_storage_key,
            mime_type=episodio.video_mime or "video/mp4",
            filename=episodio.titulo,
        )


class VistaService:
    def __init__(self, db: Session):
        self.perfil_repo = PerfilRepository(db)
        self.contenido_repo = ContenidoRepository(db)
        self.episodio_repo = EpisodioRepository(db)
        self.vista_repo = VistaRepository(db)

    def create(self, dto: CreateVistaDTO) -> VistaResponseDTO:
        return self.create_or_update(dto)

    def update(self, dto: CreateVistaDTO) -> VistaResponseDTO:
        return self.create_or_update(dto)

    def create_or_update(self, dto: CreateVistaDTO) -> VistaResponseDTO:
        perfil = self.perfil_repo.find_by_id(dto.perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")

        if (dto.episodio_id is None and dto.contenido_id is None) or (
            dto.episodio_id is not None and dto.contenido_id is not None
        ):
            raise ConflictError("La vista debe indicar un episodio o un contenido")

        contenido = None
        duracion_min = None

        if dto.episodio_id is not None:
            episodio = self.episodio_repo.find_by_id(dto.episodio_id)
            if not episodio:
                raise NotFoundError("Episodio no encontrado")
            contenido = episodio.temporada.contenido
            duracion_min = episodio.duracion_min

        if dto.contenido_id is not None:
            contenido = self.contenido_repo.find_by_id(dto.contenido_id)
            if not contenido:
                raise NotFoundError("Contenido no encontrado")
            if contenido.tipo != "pelicula":
                raise ConflictError("Las series deben registrarse por episodio")
            if contenido.duracion_min is None:
                raise ConflictError("El contenido no tiene duracion definida")
            duracion_min = contenido.duracion_min

        if perfil.es_infantil and contenido.clasificacion_edad != "ATP":
            raise ForbiddenError("El perfil infantil no puede ver este contenido")

        duracion_seg = duracion_min * 60
        if dto.segundos_vistos > duracion_seg:
            raise ConflictError("Los segundos vistos superan la duracion")

        terminado = dto.terminado or dto.segundos_vistos >= duracion_seg * 0.9
        vista = self.vista_repo.create_or_update(
            perfil_id=dto.perfil_id,
            episodio_id=dto.episodio_id,
            contenido_id=dto.contenido_id,
            segundos_vistos=dto.segundos_vistos,
            terminado=terminado,
        )
        return to_vista_response(vista)

    def delete(
        self,
        perfil_id: int,
        episodio_id: int | None = None,
        contenido_id: int | None = None,
    ) -> None:
        if not self.perfil_repo.find_by_id(perfil_id):
            raise NotFoundError("Perfil no encontrado")
        if (episodio_id is None and contenido_id is None) or (
            episodio_id is not None and contenido_id is not None
        ):
            raise ConflictError("La vista debe indicar un episodio o un contenido")

        deleted = self.vista_repo.delete(
            perfil_id=perfil_id,
            episodio_id=episodio_id,
            contenido_id=contenido_id,
        )
        if not deleted:
            raise NotFoundError("Vista no encontrada")

    def continuar_viendo(self, perfil_id: int) -> list[VistaResponseDTO]:
        if not self.perfil_repo.find_by_id(perfil_id):
            raise NotFoundError("Perfil no encontrado")
        return to_vista_response_list(self.vista_repo.continuar_viendo(perfil_id)[:10])


class MiListaService:
    def __init__(self, db: Session):
        self.perfil_repo = PerfilRepository(db)
        self.contenido_repo = ContenidoRepository(db)

    def add(self, perfil_id: int, contenido_id: int) -> list[ContenidoResponseDTO]:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        if perfil.es_infantil and contenido.clasificacion_edad != "ATP":
            raise ForbiddenError("El perfil infantil no puede agregar este contenido")

        perfil = self.perfil_repo.add_to_mi_lista(perfil_id, contenido_id)
        return to_contenido_response_list(perfil.mi_lista)

    def remove(self, perfil_id: int, contenido_id: int) -> list[ContenidoResponseDTO]:
        perfil = self.perfil_repo.remove_from_mi_lista(perfil_id, contenido_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")
        return to_contenido_response_list(perfil.mi_lista)

    def list(self, perfil_id: int) -> list[ContenidoResponseDTO]:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")
        contenidos = self.perfil_repo.get_mi_lista(perfil_id)
        if perfil.es_infantil:
            contenidos = [c for c in contenidos if c.clasificacion_edad == "ATP"]
        return to_contenido_response_list(contenidos)


class CalificacionService:
    def __init__(self, db: Session):
        self.perfil_repo = PerfilRepository(db)
        self.contenido_repo = ContenidoRepository(db)
        self.calificacion_repo = CalificacionRepository(db)
        self.vista_repo = VistaRepository(db)

    def create_or_update(self, dto: CreateCalificacionDTO) -> CalificacionResponseDTO:
        if not self.perfil_repo.find_by_id(dto.perfil_id):
            raise NotFoundError("Perfil no encontrado")
        if not self.contenido_repo.find_by_id(dto.contenido_id):
            raise NotFoundError("Contenido no encontrado")

        vistas = self.vista_repo.list_by_perfil(dto.perfil_id)
        empezo = any(
            (
                v.contenido_id == dto.contenido_id
                or (
                    v.episodio is not None
                    and v.episodio.temporada.contenido_id == dto.contenido_id
                )
            )
            and v.segundos_vistos > 0
            for v in vistas
        )
        if not empezo:
            raise ConflictError("Solo se puede calificar contenido empezado")

        calif = self.calificacion_repo.create_or_update(
            perfil_id=dto.perfil_id,
            contenido_id=dto.contenido_id,
            puntaje=dto.puntaje,
        )
        return to_calificacion_response(calif)

    def create(self, dto: CreateCalificacionDTO) -> CalificacionResponseDTO:
        return self.create_or_update(dto)

    def update(self, dto: CreateCalificacionDTO) -> CalificacionResponseDTO:
        return self.create_or_update(dto)

    def delete(self, perfil_id: int, contenido_id: int) -> None:
        if not self.perfil_repo.find_by_id(perfil_id):
            raise NotFoundError("Perfil no encontrado")
        if not self.contenido_repo.find_by_id(contenido_id):
            raise NotFoundError("Contenido no encontrado")
        if not self.calificacion_repo.delete(perfil_id, contenido_id):
            raise NotFoundError("Calificacion no encontrada")
