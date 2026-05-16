from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TipoContenido = Literal["pelicula", "serie"]
ClasificacionEdad = Literal["ATP", "+13", "+16", "+18"]


class GeneroSchema(BaseModel):
    id: int
    nombre: str

    model_config = {"from_attributes": True}


class CreateContenidoSchema(BaseModel):
    titulo: str = Field(min_length=1)
    tipo: TipoContenido
    anio: int = Field(ge=1900)
    descripcion: str | None = None
    duracion_min: int | None = Field(default=None, gt=0)
    clasificacion_edad: ClasificacionEdad
    generos_ids: list[int] = Field(default_factory=list)


class UpdateContenidoSchema(BaseModel):
    titulo: str | None = Field(default=None, min_length=1)
    tipo: TipoContenido | None = None
    anio: int | None = Field(default=None, ge=1900)
    descripcion: str | None = None
    duracion_min: int | None = Field(default=None, gt=0)
    clasificacion_edad: ClasificacionEdad | None = None
    generos_ids: list[int] | None = None


class ContenidoSchema(BaseModel):
    id: int
    titulo: str
    tipo: TipoContenido
    anio: int
    descripcion: str | None = None
    duracion_min: int | None = None
    clasificacion_edad: ClasificacionEdad
    promedio_calificaciones: float | None = None

    model_config = {"from_attributes": True}


class CreateTemporadaSchema(BaseModel):
    contenido_id: int
    numero: int = Field(ge=1)
    anio: int = Field(ge=1900)


class CreateEpisodioSchema(BaseModel):
    temporada_id: int
    numero: int = Field(ge=1)
    titulo: str = Field(min_length=1)
    duracion_min: int = Field(gt=0)


class UpsertVistaSchema(BaseModel):
    episodio_id: int | None = None
    contenido_id: int | None = None
    segundos_vistos: int = Field(default=0, ge=0)
    terminado: bool = False


class UpsertCalificacionSchema(BaseModel):
    puntaje: int = Field(ge=1, le=5)


CreateVistaSchema = UpsertVistaSchema
CreateCalificacionSchema = UpsertCalificacionSchema


class MiListaSchema(BaseModel):
    perfil_id: int
    contenido_id: int


class VistaSchema(BaseModel):
    id: int
    perfil_id: int
    episodio_id: int | None = None
    contenido_id: int | None = None
    fecha: datetime | None = None
    segundos_vistos: int
    terminado: bool

    model_config = {"from_attributes": True}


class CalificacionSchema(BaseModel):
    id: int
    perfil_id: int
    contenido_id: int
    puntaje: int
    fecha: datetime | None = None

    model_config = {"from_attributes": True}
