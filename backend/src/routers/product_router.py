from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.db import get_db
from src.db.models import Cuenta
from src.dtos import (
    CreateCalificacionDTO,
    CreateContenidoDTO,
    CreateEpisodioDTO,
    CreateTemporadaDTO,
    CreateVistaDTO,
    CalificacionResponseDTO,
    ContenidoResponseDTO,
    EpisodioResponseDTO,
    GeneroResponseDTO,
    TemporadaResponseDTO,
    UpdateContenidoDTO,
    VistaResponseDTO,
)
from src.middlewares import require_admin
from src.schemas.product_schema import (
    CreateContenidoSchema,
    CreateEpisodioSchema,
    CreateTemporadaSchema,
    UpdateContenidoSchema,
    UpsertCalificacionSchema,
    UpsertVistaSchema,
)
from src.services.product_service import (
    CalificacionService,
    ContenidoService,
    EpisodioService,
    GeneroService,
    MiListaService,
    TemporadaService,
    VistaService,
)
from src.services.storage_service import StorageService


router = APIRouter(tags=["products"])


def _stream_storage_video(file_id: str, mime_type: str, request: Request) -> StreamingResponse:
    stream = StorageService().stream_file(
        object_key=file_id,
        range_header=request.headers.get("range"),
        fallback_mime_type=mime_type,
    )
    return StreamingResponse(
        stream.chunks,
        status_code=stream.status_code,
        media_type=mime_type,
        headers=stream.headers,
    )


def _vista_dto_from_request(
    perfil_id: int,
    payload: UpsertVistaSchema,
    episodio_id: int | None = None,
    contenido_id: int | None = None,
) -> CreateVistaDTO:
    payload_data = payload.model_dump()
    payload_episodio_id = payload_data.pop("episodio_id")
    payload_contenido_id = payload_data.pop("contenido_id")
    episodio_id = episodio_id if episodio_id is not None else payload_episodio_id
    contenido_id = contenido_id if contenido_id is not None else payload_contenido_id
    return CreateVistaDTO(
        perfil_id=perfil_id,
        episodio_id=episodio_id,
        contenido_id=contenido_id,
        **payload_data,
    )


def _calificacion_dto_from_request(
    perfil_id: int,
    contenido_id: int,
    payload: UpsertCalificacionSchema,
) -> CreateCalificacionDTO:
    payload_data = payload.model_dump()
    return CreateCalificacionDTO(
        perfil_id=perfil_id,
        contenido_id=contenido_id,
        **payload_data,
    )


@router.post(
    "/generos",
    response_model=GeneroResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_genero(
    nombre: str,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return GeneroService(db).create(nombre)


@router.get("/generos", response_model=list[GeneroResponseDTO])
def list_generos(db: Session = Depends(get_db)):
    return GeneroService(db).list_all()


@router.delete("/generos/{genero_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_genero(
    genero_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    GeneroService(db).delete(genero_id)


@router.post(
    "/contenidos",
    response_model=ContenidoResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_contenido(
    titulo: str = Form(...),
    tipo: str = Form(...),
    anio: int = Form(...),
    clasificacion_edad: str = Form(...),
    descripcion: str | None = Form(default=None),
    duracion_min: int | None = Form(default=None),
    generos_ids: list[int] = Form(...),
    video: UploadFile | None = File(default=None),
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = CreateContenidoDTO(
        titulo=titulo,
        tipo=tipo,
        anio=anio,
        descripcion=descripcion,
        duracion_min=duracion_min,
        clasificacion_edad=clasificacion_edad,
        generos_ids=generos_ids,
    )

    return ContenidoService(db).create_with_video(dto, video)


@router.get("/contenidos", response_model=list[ContenidoResponseDTO])
def search_contenidos(
    q: str | None = None,
    tipo: str | None = None,
    genero_id: int | None = None,
    genero: str | None = None,
    perfil_id: int | None = None,
    ordenar: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ContenidoService(db).search(
        q=q,
        tipo=tipo,
        genero_id=genero_id,
        genero=genero,
        perfil_id=perfil_id,
        ordenar=ordenar,
    )


@router.get("/contenidos/top", response_model=list[ContenidoResponseDTO])
def top_contenidos(genero: str | None = None, db: Session = Depends(get_db)):
    return ContenidoService(db).top(genero=genero)


@router.get("/contenidos/{contenido_id}", response_model=ContenidoResponseDTO)
def get_contenido(contenido_id: int, db: Session = Depends(get_db)):
    return ContenidoService(db).get_by_id(contenido_id)


@router.get("/contenidos/{contenido_id}/playback")
def get_contenido_playback(contenido_id: int, db: Session = Depends(get_db)):
    video = ContenidoService(db).get_video_source(contenido_id)
    return {
        "stream_url": f"/api/v1/contenidos/{contenido_id}/stream",
        "mime_type": video.mime_type,
    }


@router.get("/contenidos/{contenido_id}/stream")
def stream_contenido_video(
    contenido_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    video = ContenidoService(db).get_video_source(contenido_id)
    return _stream_storage_video(video.file_id, video.mime_type, request)


@router.put("/contenidos/{contenido_id}", response_model=ContenidoResponseDTO)
def update_contenido(
    contenido_id: int,
    payload: UpdateContenidoSchema,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = UpdateContenidoDTO(**payload.model_dump(exclude_unset=True))

    return ContenidoService(db).update(contenido_id, dto)


@router.delete("/contenidos/{contenido_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contenido(
    contenido_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ContenidoService(db).delete(contenido_id)


@router.post(
    "/temporadas",
    response_model=TemporadaResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_temporada(
    payload: CreateTemporadaSchema,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = CreateTemporadaDTO(**payload.model_dump())

    return TemporadaService(db).create(dto)


@router.get("/contenidos/{contenido_id}/temporadas", response_model=list[TemporadaResponseDTO])
def list_temporadas(contenido_id: int, db: Session = Depends(get_db)):
    return TemporadaService(db).list_by_contenido(contenido_id)


@router.delete("/temporadas/{temporada_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_temporada(
    temporada_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    TemporadaService(db).delete(temporada_id)


@router.post(
    "/episodios",
    response_model=EpisodioResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_episodio(
    temporada_id: int = Form(...),
    numero: int = Form(...),
    titulo: str = Form(...),
    duracion_min: int = Form(...),
    video: UploadFile = File(...),
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = CreateEpisodioDTO(
        temporada_id=temporada_id,
        numero=numero,
        titulo=titulo,
        duracion_min=duracion_min,
    )

    return EpisodioService(db).create_with_video(dto, video)


@router.get("/temporadas/{temporada_id}/episodios", response_model=list[EpisodioResponseDTO])
def list_episodios(temporada_id: int, db: Session = Depends(get_db)):
    return EpisodioService(db).list_by_temporada(temporada_id)


@router.get("/episodios/{episodio_id}/playback")
def get_episodio_playback(episodio_id: int, db: Session = Depends(get_db)):
    video = EpisodioService(db).get_video_source(episodio_id)
    return {
        "stream_url": f"/api/v1/episodios/{episodio_id}/stream",
        "mime_type": video.mime_type,
    }


@router.get("/episodios/{episodio_id}/stream")
def stream_episodio_video(
    episodio_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    video = EpisodioService(db).get_video_source(episodio_id)
    return _stream_storage_video(video.file_id, video.mime_type, request)


@router.delete("/episodios/{episodio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episodio(
    episodio_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    EpisodioService(db).delete(episodio_id)


@router.post(
    "/perfiles/{perfil_id}/vistas",
    response_model=VistaResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_vista_recurso(
    perfil_id: int,
    payload: UpsertVistaSchema,
    db: Session = Depends(get_db),
):
    dto = _vista_dto_from_request(
        perfil_id=perfil_id,
        payload=payload,
    )
    return VistaService(db).create_or_update(dto)


@router.put(
    "/perfiles/{perfil_id}/vistas",
    response_model=VistaResponseDTO,
)
def update_vista_recurso(
    perfil_id: int,
    payload: UpsertVistaSchema,
    db: Session = Depends(get_db),
):
    dto = _vista_dto_from_request(
        perfil_id=perfil_id,
        payload=payload,
    )
    return VistaService(db).create_or_update(dto)


@router.delete(
    "/perfiles/{perfil_id}/vistas",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vista_recurso(
    perfil_id: int,
    episodio_id: int | None = None,
    contenido_id: int | None = None,
    db: Session = Depends(get_db),
):
    VistaService(db).delete(
        perfil_id=perfil_id,
        episodio_id=episodio_id,
        contenido_id=contenido_id,
    )


@router.get("/perfiles/{perfil_id}/continuar", response_model=list[VistaResponseDTO])
def continuar_viendo(
    perfil_id: int,
    db: Session = Depends(get_db),
):
    return VistaService(db).continuar_viendo(perfil_id)


@router.post("/perfiles/{perfil_id}/mi-lista", response_model=list[ContenidoResponseDTO])
def add_to_mi_lista(
    perfil_id: int,
    contenido_id: int,
    db: Session = Depends(get_db),
):
    return MiListaService(db).add(perfil_id, contenido_id)


@router.get("/perfiles/{perfil_id}/mi-lista", response_model=list[ContenidoResponseDTO])
def get_mi_lista(
    perfil_id: int,
    db: Session = Depends(get_db),
):
    return MiListaService(db).list(perfil_id)


@router.delete("/perfiles/{perfil_id}/mi-lista/{contenido_id}", response_model=list[ContenidoResponseDTO])
def remove_from_mi_lista(
    perfil_id: int,
    contenido_id: int,
    db: Session = Depends(get_db),
):
    return MiListaService(db).remove(perfil_id, contenido_id)


@router.post(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    response_model=CalificacionResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_calificacion(
    perfil_id: int,
    contenido_id: int,
    payload: UpsertCalificacionSchema,
    db: Session = Depends(get_db),
):
    dto = _calificacion_dto_from_request(perfil_id, contenido_id, payload)
    return CalificacionService(db).create_or_update(dto)


@router.put(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    response_model=CalificacionResponseDTO,
)
def update_calificacion(
    perfil_id: int,
    contenido_id: int,
    payload: UpsertCalificacionSchema,
    db: Session = Depends(get_db),
):
    dto = _calificacion_dto_from_request(perfil_id, contenido_id, payload)
    return CalificacionService(db).create_or_update(dto)


@router.delete(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_calificacion(
    perfil_id: int,
    contenido_id: int,
    db: Session = Depends(get_db),
):
    CalificacionService(db).delete(perfil_id, contenido_id)
