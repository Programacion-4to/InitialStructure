from datetime import datetime

from pydantic import BaseModel, Field


class GeneroResponseDTO(BaseModel):
    id: int
    nombre: str

    model_config = {"from_attributes": True}


class VideoVariantResponseDTO(BaseModel):
    id: int
    quality: str
    video_storage_key: str
    video_mime: str | None = None
    video_size: int | None = None

    model_config = {"from_attributes": True}


class VideoProcessingWarningDTO(BaseModel):
    message: str
    source_quality: str


class CreateContenidoDTO(BaseModel):
    titulo: str
    tipo: str
    anio: int
    descripcion: str | None = None
    duracion_min: float | None = None
    clasificacion_edad: str
    generos_ids: list[int] = Field(default_factory=list)
    storage_folder_id: str | None = None
    video_storage_key: str | None = None
    video_mime: str | None = None
    video_size: int | None = None
    portada_url: str | None = None


class UpdateContenidoDTO(BaseModel):
    titulo: str | None = None
    tipo: str | None = None
    anio: int | None = None
    descripcion: str | None = None
    duracion_min: float | None = None
    clasificacion_edad: str | None = None
    generos_ids: list[int] | None = None
    video_storage_key: str | None = None
    video_mime: str | None = None
    video_size: int | None = None
    portada_url: str | None = None


class ContenidoResponseDTO(BaseModel):
    id: int
    titulo: str
    tipo: str
    anio: int
    descripcion: str | None = None
    duracion_min: float | None = None
    clasificacion_edad: str
    generos: list[GeneroResponseDTO] = Field(default_factory=list)
    promedio_calificaciones: float | None = None
    storage_folder_id: str | None = None
    video_storage_key: str | None = None
    video_mime: str | None = None
    video_size: int | None = None
    video_variants: list[VideoVariantResponseDTO] = Field(default_factory=list)
    portada_url: str | None = None
    processing_warning: VideoProcessingWarningDTO | None = None

    model_config = {"from_attributes": True}


class CreateTemporadaDTO(BaseModel):
    contenido_id: int
    numero: int
    anio: int
    storage_folder_id: str | None = None


class UpdateTemporadaDTO(BaseModel):
    numero: int | None = None
    anio: int | None = None


class TemporadaResponseDTO(BaseModel):
    id: int
    contenido_id: int
    numero: int
    anio: int
    storage_folder_id: str | None = None

    model_config = {"from_attributes": True}


class CreateEpisodioDTO(BaseModel):
    temporada_id: int
    numero: int
    titulo: str
    duracion_min: float | None = None
    storage_folder_id: str | None = None
    video_storage_key: str | None = None
    video_mime: str | None = None
    video_size: int | None = None
    thumbnail_url: str | None = None


class UpdateEpisodioDTO(BaseModel):
    numero: int | None = None
    titulo: str | None = None
    duracion_min: float | None = None
    thumbnail_url: str | None = None


class EpisodioResponseDTO(BaseModel):
    id: int
    temporada_id: int
    numero: int
    titulo: str
    duracion_min: float
    storage_folder_id: str | None = None
    video_storage_key: str | None = None
    video_mime: str | None = None
    video_size: int | None = None
    video_variants: list[VideoVariantResponseDTO] = Field(default_factory=list)
    thumbnail_url: str | None = None
    processing_warning: VideoProcessingWarningDTO | None = None

    model_config = {"from_attributes": True}


class CreateVistaDTO(BaseModel):
    perfil_id: int
    episodio_id: int | None = None
    contenido_id: int | None = None
    segundos_vistos: int = 0
    terminado: bool = False


class VistaResponseDTO(BaseModel):
    id: int
    perfil_id: int
    episodio_id: int | None = None
    contenido_id: int | None = None
    fecha: datetime | None = None
    segundos_vistos: int
    terminado: bool

    model_config = {"from_attributes": True}


class ContinuarViendoResponseDTO(BaseModel):
    contenido: ContenidoResponseDTO
    episodio: EpisodioResponseDTO | None = None
    temporada: TemporadaResponseDTO | None = None
    segundos_vistos: int
    duracion_total: int
    terminado: bool
    actualizado_en: datetime | None = None


class CreateCalificacionDTO(BaseModel):
    perfil_id: int
    contenido_id: int
    puntaje: int


class CalificacionResponseDTO(BaseModel):
    id: int
    perfil_id: int
    contenido_id: int
    puntaje: int
    fecha: datetime | None = None

    model_config = {"from_attributes": True}


class MiListaDTO(BaseModel):
    perfil_id: int
    contenido_id: int


class CreateDescargaDTO(BaseModel):
    perfil_id: int
    episodio_id: int | None = None
    contenido_id: int | None = None


class DescargaResponseDTO(BaseModel):
    id: int
    perfil_id: int
    episodio_id: int | None = None
    contenido_id: int | None = None
    fecha_descarga: datetime | None = None
    vence_en: datetime
    eliminada: bool

    model_config = {"from_attributes": True}


class ReporteVisualizacionItemDTO(BaseModel):
    contenido_id: int
    titulo: str
    tipo: str
    minutos_vistos: int
    generos: list[str]


class ReporteVisualizacionDTO(BaseModel):
    anio: int
    mes: int
    total_minutos: int
    total_contenidos: int
    por_genero: dict[str, int]
    contenidos: list[ReporteVisualizacionItemDTO]


CreateProductDTO = CreateContenidoDTO
UpdateProductDTO = UpdateContenidoDTO
ProductResponseDTO = ContenidoResponseDTO
