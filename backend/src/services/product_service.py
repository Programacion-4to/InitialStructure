from datetime import datetime, timedelta

from fastapi import UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.dtos import (
    CalificacionResponseDTO,
    ContinuarViendoResponseDTO,
    ContenidoResponseDTO,
    CreateCalificacionDTO,
    CreateContenidoDTO,
    CreateDescargaDTO,
    CreateEpisodioDTO,
    CreateTemporadaDTO,
    CreateVistaDTO,
    EpisodioResponseDTO,
    DescargaResponseDTO,
    GeneroResponseDTO,
    ReporteVisualizacionDTO,
    ReporteVisualizacionItemDTO,
    VideoProcessingWarningDTO,
    TemporadaResponseDTO,
    UpdateContenidoDTO,
    UpdateEpisodioDTO,
    UpdateTemporadaDTO,
    VistaResponseDTO,
)
from src.config.env import settings
from src.mappers import (
    to_calificacion_response,
    to_contenido_response,
    to_contenido_response_list,
    to_descarga_response,
    to_descarga_response_list,
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
    DescargaRepository,
    EpisodioRepository,
    GeneroRepository,
    TemporadaRepository,
    VideoVariantRepository,
    VistaRepository,
)
from src.repositories import PerfilRepository
from src.services.storage_service import StorageService
from src.services.video_processing_service import QUALITY_PRIORITY, VideoProcessingService
from src.utils import ConflictError, ForbiddenError, NotFoundError


class VideoSourceDTO(BaseModel):
    file_id: str
    mime_type: str
    filename: str
    quality: str | None = None


def _variant_uploads_to_payload(variants) -> dict[str, dict]:
    return {
        quality: {
            "video_storage_key": upload.object_key,
            "video_mime": upload.mime_type,
            "video_size": upload.size,
        }
        for quality, upload in variants.items()
    }


def _processing_warning(source_quality: str, message: str | None) -> VideoProcessingWarningDTO | None:
    if not message:
        return None
    return VideoProcessingWarningDTO(message=message, source_quality=source_quality)


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

    def get_by_id(self, genero_id: int) -> GeneroResponseDTO:
        genero = self.genero_repo.find_by_id(genero_id)
        if not genero:
            raise NotFoundError("Genero no encontrado")
        return to_genero_response(genero)

    def update(self, genero_id: int, nombre: str) -> GeneroResponseDTO:
        nombre = nombre.strip()
        if not nombre:
            raise ConflictError("El nombre del genero es obligatorio")

        existing = self.genero_repo.find_by_name(nombre)
        if existing and existing.id != genero_id:
            raise ConflictError("Ya existe un genero con ese nombre")

        genero = self.genero_repo.update(genero_id, nombre)
        if not genero:
            raise NotFoundError("Genero no encontrado")
        return to_genero_response(genero)

    def delete(self, genero_id: int) -> None:
        if not self.genero_repo.delete(genero_id):
            raise NotFoundError("Genero no encontrado")


class ContenidoService:
    def __init__(self, db: Session):
        self.contenido_repo = ContenidoRepository(db)
        self.genero_repo = GeneroRepository(db)
        self.perfil_repo = PerfilRepository(db)
        self.video_variant_repo = VideoVariantRepository(db)

    def create(self, dto: CreateContenidoDTO) -> ContenidoResponseDTO:
        return self.create_with_video(dto, video_file=None)

    def create_with_video(
        self,
        dto: CreateContenidoDTO,
        video_file: UploadFile | None,
        portada_file: UploadFile | None = None,
    ) -> ContenidoResponseDTO:
        self._validate_content_payload(
            tipo=dto.tipo,
            duracion_min=dto.duracion_min,
            generos_ids=dto.generos_ids,
            require_duration=dto.tipo != "pelicula",
        )

        storage = StorageService()
        folder_id = storage.create_folder(dto.titulo)
        video = None

        if dto.tipo == "pelicula":
            if video_file is None:
                raise ConflictError("Una pelicula debe incluir un archivo de video")
            self._validate_video_file(video_file)
            processed_video = VideoProcessingService(storage).process_and_upload_variants(
                video_file=video_file,
                parent_folder_id=folder_id,
            )
            video = processed_video.max_variant
            dto.duracion_min = processed_video.duration_min
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
            portada_url=None,
        )
        if portada_file is not None:
            portada_url = self._store_portada(portada_file, contenido.id)
            contenido = self.contenido_repo.update(contenido.id, portada_url=portada_url) or contenido
        if video and dto.tipo == "pelicula":
            self.video_variant_repo.replace_for_contenido(
                contenido_id=contenido.id,
                variants=_variant_uploads_to_payload(processed_video.variants),
            )
        response = to_contenido_response(contenido)
        if video and dto.tipo == "pelicula":
            response.processing_warning = _processing_warning(
                processed_video.source_quality,
                processed_video.warning_message,
            )
        return response

    def get_by_id(self, contenido_id: int) -> ContenidoResponseDTO:
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        return to_contenido_response(contenido)

    def validate_catalog_ready(self, contenido_id: int) -> dict[str, str]:
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        if not contenido.generos:
            raise ConflictError("Cada contenido debe tener al menos un genero")
        if contenido.tipo == "pelicula":
            if contenido.duracion_min is None or not contenido.video_storage_key:
                raise ConflictError("Una pelicula debe tener video y duracion directa")
            return {"message": "Contenido listo para publicar"}
        if contenido.tipo == "serie":
            if not contenido.temporadas:
                raise ConflictError("Una serie debe tener al menos una temporada")
            if any(not temporada.episodios for temporada in contenido.temporadas):
                raise ConflictError("Cada temporada debe tener al menos un episodio")
            return {"message": "Contenido listo para publicar"}
        raise ConflictError("El tipo debe ser pelicula o serie")

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
        return self.update_with_video(contenido_id, dto, video_file=None)

    def update_with_video(
        self,
        contenido_id: int,
        dto: UpdateContenidoDTO,
        video_file: UploadFile | None,
        portada_file: UploadFile | None = None,
    ) -> ContenidoResponseDTO:
        contenido_actual = self.contenido_repo.find_by_id(contenido_id)
        if not contenido_actual:
            raise NotFoundError("Contenido no encontrado")

        fields = dto.model_dump(exclude_unset=True, exclude_none=True)
        fields.pop("duracion_min", None)
        if "tipo" in fields and fields["tipo"] != contenido_actual.tipo:
            raise ConflictError("No se puede cambiar el tipo de contenido")

        self._validate_content_payload(
            tipo=fields.get("tipo", contenido_actual.tipo),
            duracion_min=fields.get("duracion_min", contenido_actual.duracion_min),
            generos_ids=fields.get("generos_ids"),
            require_generos=False,
        )

        if video_file is not None:
            if contenido_actual.tipo != "pelicula":
                raise ConflictError("Las series no llevan video directo; cambia el video desde sus episodios")
            self._validate_video_file(video_file)
            storage = StorageService()
            parent_folder_id = contenido_actual.storage_folder_id or storage.create_folder(
                fields.get("titulo", contenido_actual.titulo)
            )
            processed_video = VideoProcessingService(storage).process_and_upload_variants(
                video_file=video_file,
                parent_folder_id=parent_folder_id,
            )
            video = processed_video.max_variant
            fields["storage_folder_id"] = parent_folder_id
            fields["video_storage_key"] = video.object_key
            fields["video_mime"] = video.mime_type
            fields["video_size"] = video.size
            fields["duracion_min"] = processed_video.duration_min

        if portada_file is not None:
            portada_url = self._store_portada(portada_file, contenido_id)
            self._delete_asset(contenido_actual.portada_url)
            fields["portada_url"] = portada_url

        contenido = self.contenido_repo.update(contenido_id, **fields)
        if video_file is not None:
            self.video_variant_repo.replace_for_contenido(
                contenido_id=contenido.id,
                variants=_variant_uploads_to_payload(processed_video.variants),
            )
        response = to_contenido_response(contenido)
        if video_file is not None:
            response.processing_warning = _processing_warning(
                processed_video.source_quality,
                processed_video.warning_message,
            )
        return response

    def delete(self, contenido_id: int) -> None:
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")

        storage = StorageService()
        storage.delete_prefix(contenido.storage_folder_id)
        storage.delete_prefix(f"{settings.S3_ASSETS_PREFIX.strip('/')}/contenidos/{contenido_id}")
        storage.delete_object(contenido.video_storage_key)
        for variant in contenido.video_variants:
            storage.delete_object(variant.video_storage_key)
        for temporada in contenido.temporadas:
            storage.delete_prefix(temporada.storage_folder_id)
            for episodio in temporada.episodios:
                storage.delete_prefix(episodio.storage_folder_id)
                storage.delete_object(episodio.video_storage_key)
                for variant in episodio.video_variants:
                    storage.delete_object(variant.video_storage_key)

        if not self.contenido_repo.delete(contenido_id):
            raise NotFoundError("Contenido no encontrado")

    def top(self, genero: str | None = None) -> list[ContenidoResponseDTO]:
        contenidos = self.contenido_repo.top(limit=10, genero=genero)
        return to_contenido_response_list(contenidos)

    def recommendations(self, perfil_id: int) -> list[ContenidoResponseDTO]:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")

        contenidos = self.contenido_repo.recommendations_for_profile(
            perfil_id=perfil_id,
            limit=10,
            only_atp=perfil.es_infantil,
        )
        return to_contenido_response_list(contenidos)

    def get_video_source(
        self,
        contenido_id: int,
        quality: str | None = None,
        perfil_id: int | None = None,
        max_quality: str | None = None,
    ) -> VideoSourceDTO:
        contenido = self.contenido_repo.find_by_id(contenido_id)
        if not contenido:
            raise NotFoundError("Contenido no encontrado")
        if perfil_id is not None:
            self._validate_profile_can_access_content(perfil_id, contenido)
        if contenido.tipo != "pelicula":
            raise ConflictError("Las series se reproducen por episodio")
        variant = self._select_video_variant(contenido.video_variants, quality, max_quality)
        if variant:
            return VideoSourceDTO(
                file_id=variant.video_storage_key,
                mime_type=variant.video_mime or "video/mp4",
                filename=contenido.titulo,
                quality=variant.quality,
            )
        if quality and contenido.video_variants:
            raise NotFoundError("No hay video cargado para esa calidad")
        if not contenido.video_storage_key:
            raise NotFoundError("Video no encontrado")

        return VideoSourceDTO(
            file_id=contenido.video_storage_key,
            mime_type=contenido.video_mime or "video/mp4",
            filename=contenido.titulo,
        )

    def _validate_content_payload(
        self,
        tipo,
        duracion_min,
        generos_ids,
        require_generos=True,
        require_duration=True,
    ):
        if tipo is not None and tipo not in ("pelicula", "serie"):
            raise ConflictError("El tipo debe ser pelicula o serie")
        if tipo is None:
            return
        if require_generos and not generos_ids:
            raise ConflictError("Cada contenido debe tener al menos un genero")
        if generos_ids is not None and len(generos_ids) == 0:
            raise ConflictError("Cada contenido debe tener al menos un genero")
        if generos_ids:
            generos = [self.genero_repo.find_by_id(gid) for gid in generos_ids]
            if any(g is None for g in generos):
                raise NotFoundError("Uno o mas generos no existen")
        if tipo == "pelicula" and require_duration and duracion_min is None:
            raise ConflictError("Una pelicula debe tener duracion")
        if tipo == "serie" and duracion_min is not None:
            raise ConflictError("Una serie no debe tener duracion directa")

    def _validate_profile_can_access_content(self, perfil_id: int, contenido) -> None:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")
        if perfil.es_infantil and contenido.clasificacion_edad != "ATP":
            raise ForbiddenError("El perfil infantil no puede reproducir este contenido")

    def _validate_video_file(self, video_file: UploadFile) -> None:
        content_type = video_file.content_type or ""
        if not content_type.startswith("video/"):
            raise ConflictError("El archivo debe ser un video")

    def _select_video_variant(self, variants, quality: str | None, max_quality: str | None = None):
        if not variants:
            return None
        max_rank = QUALITY_PRIORITY.get(max_quality, 999) if max_quality else 999
        if quality:
            if QUALITY_PRIORITY.get(quality, 0) > max_rank:
                raise ForbiddenError("El plan no permite reproducir esa calidad")
            return next((variant for variant in variants if variant.quality == quality), None)
        allowed_variants = [
            variant for variant in variants if QUALITY_PRIORITY.get(variant.quality, 0) <= max_rank
        ]
        if not allowed_variants:
            return None
        return sorted(allowed_variants, key=lambda variant: QUALITY_PRIORITY.get(variant.quality, 0), reverse=True)[0]

    def _store_portada(self, portada_file: UploadFile, contenido_id: int) -> str:
        return StorageService().upload_asset_file(
            file=portada_file.file,
            filename=portada_file.filename or "portada",
            mime_type=portada_file.content_type or "application/octet-stream",
            asset_prefix=f"{settings.S3_ASSETS_PREFIX.strip('/')}/contenidos/{contenido_id}/portadas",
        ).object_key

    def _delete_asset(self, asset_key: str | None) -> None:
        if asset_key and asset_key.startswith(f"{settings.S3_ASSETS_PREFIX.strip('/')}/"):
            StorageService().delete_object(asset_key)


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

    def get_by_id(self, temporada_id: int) -> TemporadaResponseDTO:
        temporada = self.temporada_repo.find_by_id(temporada_id)
        if not temporada:
            raise NotFoundError("Temporada no encontrada")
        return to_temporada_response(temporada)

    def update(self, temporada_id: int, dto: UpdateTemporadaDTO) -> TemporadaResponseDTO:
        fields = dto.model_dump(exclude_unset=True, exclude_none=True)
        temporada = self.temporada_repo.update(temporada_id, **fields)
        if not temporada:
            raise NotFoundError("Temporada no encontrada")
        return to_temporada_response(temporada)

    def delete(self, temporada_id: int) -> None:
        temporada = self.temporada_repo.find_by_id(temporada_id)
        if not temporada:
            raise NotFoundError("Temporada no encontrada")

        storage = StorageService()
        storage.delete_prefix(temporada.storage_folder_id)
        storage.delete_prefix(
            f"{settings.S3_ASSETS_PREFIX.strip('/')}/contenidos/{temporada.contenido_id}/temporadas/{temporada.id}"
        )
        for episodio in temporada.episodios:
            storage.delete_prefix(episodio.storage_folder_id)
            storage.delete_object(episodio.video_storage_key)
            for variant in episodio.video_variants:
                storage.delete_object(variant.video_storage_key)

        if not self.temporada_repo.delete(temporada_id):
            raise NotFoundError("Temporada no encontrada")


class EpisodioService:
    def __init__(self, db: Session):
        self.temporada_repo = TemporadaRepository(db)
        self.episodio_repo = EpisodioRepository(db)
        self.perfil_repo = PerfilRepository(db)
        self.video_variant_repo = VideoVariantRepository(db)

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

        storage = StorageService()
        episode_folder_id = storage.create_folder(
            name=f"Episodio {dto.numero} - {dto.titulo}",
            parent_folder_id=temporada.storage_folder_id,
        )
        processed_video = VideoProcessingService(storage).process_and_upload_variants(
            video_file=video_file,
            parent_folder_id=episode_folder_id,
        )
        video = processed_video.max_variant

        episodio = self.episodio_repo.create(
            temporada_id=dto.temporada_id,
            numero=dto.numero,
            titulo=dto.titulo,
            duracion_min=processed_video.duration_min,
            storage_folder_id=episode_folder_id,
            video_storage_key=video.object_key,
            video_mime=video.mime_type,
            video_size=video.size,
            thumbnail_url=None,
        )

        self.video_variant_repo.replace_for_episodio(
            episodio_id=episodio.id,
            variants=_variant_uploads_to_payload(processed_video.variants),
        )
        try:
            thumbnail_url = self._store_episode_thumbnail(
                processed_video=processed_video,
                episodio_id=episodio.id,
                temporada=temporada,
            )
        except Exception:
            thumbnail_url = None
        if thumbnail_url:
            episodio = self.episodio_repo.update(episodio.id, thumbnail_url=thumbnail_url) or episodio
        episodio = self.episodio_repo.find_by_id(episodio.id) or episodio

        response = to_episodio_response(episodio)
        response.processing_warning = _processing_warning(
            processed_video.source_quality,
            processed_video.warning_message,
        )
        return response

    def list_by_temporada(self, temporada_id: int) -> list[EpisodioResponseDTO]:
        if not self.temporada_repo.find_by_id(temporada_id):
            raise NotFoundError("Temporada no encontrada")
        return [
            to_episodio_response(e)
            for e in self.episodio_repo.list_by_temporada(temporada_id)
        ]

    def update(self, episodio_id: int, dto: UpdateEpisodioDTO) -> EpisodioResponseDTO:
        fields = dto.model_dump(exclude_unset=True, exclude_none=True)
        fields.pop("duracion_min", None)
        episodio = self.episodio_repo.update(episodio_id, **fields)
        if not episodio:
            raise NotFoundError("Episodio no encontrado")
        return to_episodio_response(episodio)

    def update_with_video(
        self,
        episodio_id: int,
        dto: UpdateEpisodioDTO,
        video_file: UploadFile | None,
    ) -> EpisodioResponseDTO:
        fields = dto.model_dump(exclude_unset=True, exclude_none=True)
        fields.pop("duracion_min", None)
        episodio = self.episodio_repo.find_by_id(episodio_id)
        if not episodio:
            raise NotFoundError("Episodio no encontrado")

        if video_file is not None:
            self._validate_video_file(video_file)
            storage = StorageService()
            episode_folder_id = episodio.storage_folder_id or storage.create_folder(
                name=f"Episodio {fields.get('numero', episodio.numero)} - {fields.get('titulo', episodio.titulo)}",
                parent_folder_id=episodio.temporada.storage_folder_id,
            )
            processed_video = VideoProcessingService(storage).process_and_upload_variants(
                video_file=video_file,
                parent_folder_id=episode_folder_id,
            )
            video = processed_video.max_variant
            fields["storage_folder_id"] = episode_folder_id
            fields["video_storage_key"] = video.object_key
            fields["video_mime"] = video.mime_type
            fields["video_size"] = video.size
            fields["duracion_min"] = processed_video.duration_min
            thumbnail_url = self._store_episode_thumbnail(
                processed_video=processed_video,
                episodio_id=episodio.id,
                temporada=episodio.temporada,
            )
            self._delete_asset(episodio.thumbnail_url)
            fields["thumbnail_url"] = thumbnail_url

        episodio = self.episodio_repo.update(episodio_id, **fields)
        if video_file is not None:
            self.video_variant_repo.replace_for_episodio(
                episodio_id=episodio.id,
                variants=_variant_uploads_to_payload(processed_video.variants),
            )
        response = to_episodio_response(episodio)
        if video_file is not None:
            response.processing_warning = _processing_warning(
                processed_video.source_quality,
                processed_video.warning_message,
            )
        return response

    def delete(self, episodio_id: int) -> None:
        episodio = self.episodio_repo.find_by_id(episodio_id)
        if not episodio:
            raise NotFoundError("Episodio no encontrado")

        storage = StorageService()
        storage.delete_prefix(episodio.storage_folder_id)
        storage.delete_prefix(
            f"{settings.S3_ASSETS_PREFIX.strip('/')}/contenidos/{episodio.temporada.contenido_id}/temporadas/{episodio.temporada_id}/episodios/{episodio.id}"
        )
        storage.delete_object(episodio.video_storage_key)
        for variant in episodio.video_variants:
            storage.delete_object(variant.video_storage_key)

        if not self.episodio_repo.delete(episodio_id):
            raise NotFoundError("Episodio no encontrado")

    def get_by_id(self, episodio_id: int) -> EpisodioResponseDTO:
        episodio = self.episodio_repo.find_by_id(episodio_id)
        if not episodio:
            raise NotFoundError("Episodio no encontrado")
        return to_episodio_response(episodio)

    def get_video_source(
        self,
        episodio_id: int,
        quality: str | None = None,
        perfil_id: int | None = None,
        max_quality: str | None = None,
    ) -> VideoSourceDTO:
        episodio = self.episodio_repo.find_by_id(episodio_id)
        if not episodio:
            raise NotFoundError("Episodio no encontrado")
        if perfil_id is not None:
            perfil = self.perfil_repo.find_by_id(perfil_id)
            if not perfil:
                raise NotFoundError("Perfil no encontrado")
            contenido = episodio.temporada.contenido
            if perfil.es_infantil and contenido.clasificacion_edad != "ATP":
                raise ForbiddenError("El perfil infantil no puede reproducir este contenido")
        variant = self._select_video_variant(episodio.video_variants, quality, max_quality)
        if variant:
            return VideoSourceDTO(
                file_id=variant.video_storage_key,
                mime_type=variant.video_mime or "video/mp4",
                filename=episodio.titulo,
                quality=variant.quality,
            )
        if quality and episodio.video_variants:
            raise NotFoundError("No hay video cargado para esa calidad")
        if not episodio.video_storage_key:
            raise NotFoundError("Video no encontrado")

        return VideoSourceDTO(
            file_id=episodio.video_storage_key,
            mime_type=episodio.video_mime or "video/mp4",
            filename=episodio.titulo,
        )

    def _validate_video_file(self, video_file: UploadFile) -> None:
        content_type = video_file.content_type or ""
        if not content_type.startswith("video/"):
            raise ConflictError("El archivo debe ser un video")

    def _select_video_variant(self, variants, quality: str | None, max_quality: str | None = None):
        if not variants:
            return None
        max_rank = QUALITY_PRIORITY.get(max_quality, 999) if max_quality else 999
        if quality:
            if QUALITY_PRIORITY.get(quality, 0) > max_rank:
                raise ForbiddenError("El plan no permite reproducir esa calidad")
            return next((variant for variant in variants if variant.quality == quality), None)
        allowed_variants = [
            variant for variant in variants if QUALITY_PRIORITY.get(variant.quality, 0) <= max_rank
        ]
        if not allowed_variants:
            return None
        return sorted(allowed_variants, key=lambda variant: QUALITY_PRIORITY.get(variant.quality, 0), reverse=True)[0]

    def _store_episode_thumbnail(self, processed_video, episodio_id: int, temporada) -> str | None:
        if not processed_video.thumbnail:
            return None

        return StorageService().upload_asset_bytes(
            payload=processed_video.thumbnail,
            filename=f"episodio-{episodio_id}-thumbnail.jpg",
            mime_type=processed_video.thumbnail_mime,
            asset_prefix=(
                f"{settings.S3_ASSETS_PREFIX.strip('/')}/contenidos/{temporada.contenido_id}/"
                f"temporadas/{temporada.id}/episodios/{episodio_id}/miniaturas"
            ),
        ).object_key

    def _delete_asset(self, asset_key: str | None) -> None:
        if asset_key and asset_key.startswith(f"{settings.S3_ASSETS_PREFIX.strip('/')}/"):
            StorageService().delete_object(asset_key)


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

    def list_by_perfil(self, perfil_id: int) -> list[VistaResponseDTO]:
        if not self.perfil_repo.find_by_id(perfil_id):
            raise NotFoundError("Perfil no encontrado")
        return to_vista_response_list(self.vista_repo.list_by_perfil(perfil_id))

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

    def continuar_viendo(self, perfil_id: int) -> list[ContinuarViendoResponseDTO]:
        if not self.perfil_repo.find_by_id(perfil_id):
            raise NotFoundError("Perfil no encontrado")
        items: list[ContinuarViendoResponseDTO] = []
        seen_content_ids: set[int] = set()

        for vista in self.vista_repo.continuar_viendo(perfil_id):
            contenido = vista.contenido
            episodio = vista.episodio
            if episodio is not None:
                contenido = episodio.temporada.contenido

            if contenido is None or contenido.id in seen_content_ids:
                continue

            seen_content_ids.add(contenido.id)
            items.append(
                ContinuarViendoResponseDTO(
                    contenido=to_contenido_response(contenido),
                    episodio=to_episodio_response(episodio) if episodio else None,
                    temporada=to_temporada_response(episodio.temporada) if episodio else None,
                    segundos_vistos=vista.segundos_vistos,
                    duracion_total=int(
                        (episodio.duracion_min if episodio else contenido.duracion_min or 0) * 60
                    ),
                    terminado=vista.terminado,
                    actualizado_en=vista.fecha,
                )
            )
            if len(items) == 10:
                break

        return items


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


DOWNLOAD_LIMITS = {
    "basico": 0,
    "estandar": 10,
    "premium": 30,
}


class DescargaService:
    def __init__(self, db: Session):
        self.perfil_repo = PerfilRepository(db)
        self.contenido_repo = ContenidoRepository(db)
        self.episodio_repo = EpisodioRepository(db)
        self.descarga_repo = DescargaRepository(db)

    def create(self, dto: CreateDescargaDTO) -> DescargaResponseDTO:
        perfil = self.perfil_repo.find_by_id(dto.perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")

        if (dto.episodio_id is None and dto.contenido_id is None) or (
            dto.episodio_id is not None and dto.contenido_id is not None
        ):
            raise ConflictError("La descarga debe indicar un episodio o un contenido")

        contenido = None
        if dto.contenido_id is not None:
            contenido = self.contenido_repo.find_by_id(dto.contenido_id)
            if not contenido:
                raise NotFoundError("Contenido no encontrado")
            if contenido.tipo != "pelicula":
                raise ConflictError("Las series se descargan por episodio")

        if dto.episodio_id is not None:
            episodio = self.episodio_repo.find_by_id(dto.episodio_id)
            if not episodio:
                raise NotFoundError("Episodio no encontrado")
            contenido = episodio.temporada.contenido

        if perfil.es_infantil and contenido.clasificacion_edad != "ATP":
            raise ForbiddenError("El perfil infantil no puede descargar este contenido")

        now = datetime.utcnow()
        plan = perfil.cuenta.plan
        limit = DOWNLOAD_LIMITS.get(plan, 0)
        if self.descarga_repo.active_count_by_cuenta(perfil.cuenta_id, now) >= limit:
            raise ConflictError("Se supero el limite de descargas activas del plan")

        descarga = self.descarga_repo.create(
            perfil_id=dto.perfil_id,
            episodio_id=dto.episodio_id,
            contenido_id=dto.contenido_id,
            vence_en=now + timedelta(days=30),
        )
        return to_descarga_response(descarga)

    def list(self, perfil_id: int) -> list[DescargaResponseDTO]:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        if not perfil:
            raise NotFoundError("Perfil no encontrado")
        now = datetime.utcnow()
        descargas = [
            descarga
            for descarga in self.descarga_repo.list_by_perfil(perfil_id)
            if not descarga.eliminada and descarga.vence_en > now
        ]
        return to_descarga_response_list(descargas)

    def delete(self, perfil_id: int, descarga_id: int) -> None:
        descarga = self.descarga_repo.find_by_id(descarga_id)
        if not descarga or descarga.perfil_id != perfil_id:
            raise NotFoundError("Descarga no encontrada")
        self.descarga_repo.mark_deleted(descarga_id)


class ReporteService:
    def __init__(self, db: Session):
        self.contenido_repo = ContenidoRepository(db)

    def visualizacion(self, anio: int, mes: int) -> ReporteVisualizacionDTO:
        if mes < 1 or mes > 12:
            raise ConflictError("El mes debe estar entre 1 y 12")

        items: list[ReporteVisualizacionItemDTO] = []
        total_minutos = 0
        por_genero: dict[str, int] = {}

        for contenido in self.contenido_repo.list_all():
            segundos = 0
            for vista in contenido.vistas:
                if self._vista_cuenta(vista, anio, mes, contenido.duracion_min):
                    segundos += int(vista.segundos_vistos or 0)

            for temporada in contenido.temporadas:
                for episodio in temporada.episodios:
                    for vista in episodio.vistas:
                        if self._vista_cuenta(vista, anio, mes, episodio.duracion_min):
                            segundos += int(vista.segundos_vistos or 0)

            minutos = segundos // 60
            if minutos <= 0:
                continue

            total_minutos += minutos
            generos = [genero.nombre for genero in contenido.generos]
            for genero in generos:
                por_genero[genero] = por_genero.get(genero, 0) + minutos

            items.append(
                ReporteVisualizacionItemDTO(
                    contenido_id=contenido.id,
                    titulo=contenido.titulo,
                    tipo=contenido.tipo,
                    minutos_vistos=minutos,
                    generos=generos,
                )
            )

        items.sort(key=lambda item: (-item.minutos_vistos, item.titulo))
        return ReporteVisualizacionDTO(
            anio=anio,
            mes=mes,
            total_minutos=total_minutos,
            total_contenidos=len(items),
            por_genero=por_genero,
            contenidos=items[:20],
        )

    def _vista_cuenta(self, vista, anio: int, mes: int, duracion_min: float | None) -> bool:
        if not vista.fecha or vista.fecha.year != anio or vista.fecha.month != mes:
            return False
        if vista.terminado:
            return True
        if duracion_min is None:
            return False
        return vista.segundos_vistos >= duracion_min * 60 * 0.9


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

    def get(self, perfil_id: int, contenido_id: int) -> CalificacionResponseDTO:
        if not self.perfil_repo.find_by_id(perfil_id):
            raise NotFoundError("Perfil no encontrado")
        if not self.contenido_repo.find_by_id(contenido_id):
            raise NotFoundError("Contenido no encontrado")
        calificacion = self.calificacion_repo.find_by_perfil_and_contenido(perfil_id, contenido_id)
        if not calificacion:
            raise NotFoundError("Calificacion no encontrada")
        return to_calificacion_response(calificacion)

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
