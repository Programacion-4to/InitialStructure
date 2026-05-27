from datetime import timedelta
import mimetypes
import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.db import get_db
from src.db.models import Cuenta, Perfil
from src.dtos import (
    CreateCalificacionDTO,
    CreateContenidoDTO,
    CreateEpisodioDTO,
    CreateTemporadaDTO,
    CreateVistaDTO,
    PerfilAuthDTO,
    CalificacionResponseDTO,
    ContenidoResponseDTO,
    ContinuarViendoResponseDTO,
    CreateDescargaDTO,
    DescargaResponseDTO,
    EpisodioResponseDTO,
    GeneroResponseDTO,
    TemporadaResponseDTO,
    UpdateContenidoDTO,
    VistaResponseDTO,
    ReporteVisualizacionDTO,
)
from src.schemas.auth_schema import PerfilAuthResponseSchema, PerfilAuthSchema
from src.middlewares import get_current_user_from_swagger, get_owned_profile, require_admin
from src.schemas.product_schema import (
    AddMiListaSchema,
    CreateEpisodioSchema,
    CreateDescargaSchema,
    CreateTemporadaSchema,
    UpdateEpisodioSchema,
    UpdateTemporadaSchema,
    UpsertCalificacionSchema,
    UpsertVistaSchema,
)
from src.services.product_service import (
    CalificacionService,
    ContenidoService,
    DescargaService,
    EpisodioService,
    GeneroService,
    MiListaService,
    ReporteService,
    TemporadaService,
    VistaService,
)
from src.services.auth_service import AuthService
from src.dtos import UpdateEpisodioDTO, UpdateTemporadaDTO
from src.services.storage_service import StorageService
from src.utils import BadRequestError, UnauthorizedError, create_access_token, decode_access_token


router = APIRouter(tags=["products"])

PLAN_MAX_QUALITY = {
    "basico": "FHD",
    "estandar": "QHD",
    "premium": "4K",
}


MEDIA_TOKEN_TTL_MINUTES = 10


def _create_media_token(
    current_user: Cuenta,
    resource_type: str,
    resource_id: int,
    quality: str | None,
    action: str,
) -> str:
    return create_access_token(
        {
            "sub": str(current_user.id),
            "scope": "media",
            "resource_type": resource_type,
            "resource_id": resource_id,
            "quality": quality,
            "action": action,
        },
        expires_delta=timedelta(minutes=MEDIA_TOKEN_TTL_MINUTES),
    )


def _verify_media_token(
    token: str,
    resource_type: str,
    resource_id: int,
    quality: str | None,
    action: str,
) -> None:
    payload = decode_access_token(token)
    if (
        payload.get("scope") != "media"
        or payload.get("resource_type") != resource_type
        or payload.get("resource_id") != resource_id
        or payload.get("quality") != quality
        or payload.get("action") != action
    ):
        raise UnauthorizedError("Token de media invalido")


def _stream_storage_video(
    file_id: str,
    mime_type: str,
    request: Request,
    filename: str | None = None,
    as_attachment: bool = False,
) -> StreamingResponse:
    stream = StorageService().stream_file(
        object_key=file_id,
        range_header=request.headers.get("range"),
        fallback_mime_type=mime_type,
    )
    headers = dict(stream.headers)
    if as_attachment and filename:
        headers["Content-Disposition"] = _content_disposition(filename, mime_type)
        headers["Cache-Control"] = "private, no-store"
    return StreamingResponse(
        stream.chunks,
        status_code=stream.status_code,
        media_type=mime_type,
        headers=headers,
    )


def _content_disposition(filename: str, mime_type: str) -> str:
    safe_name = re.sub(r"[^a-zA-Z0-9._ -]+", "", filename).strip() or "titoflix-video"
    safe_name = re.sub(r"\s+", "-", safe_name)
    extension = mimetypes.guess_extension(mime_type) or ".mp4"
    if not safe_name.lower().endswith(extension.lower()):
        safe_name = f"{safe_name}{extension}"
    encoded_name = quote(safe_name)
    return f"attachment; filename=\"{safe_name}\"; filename*=UTF-8''{encoded_name}"


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


@router.get("/generos/{genero_id}", response_model=GeneroResponseDTO)
def get_genero(genero_id: int, db: Session = Depends(get_db)):
    return GeneroService(db).get_by_id(genero_id)


@router.put("/generos/{genero_id}", response_model=GeneroResponseDTO)
def update_genero(
    genero_id: int,
    nombre: str,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return GeneroService(db).update(genero_id, nombre)


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
    generos_ids: list[int] = Form(...),
    portada: UploadFile | None = File(default=None),
    video: UploadFile | None = File(default=None),
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = CreateContenidoDTO(
        titulo=titulo,
        tipo=tipo,
        anio=anio,
        descripcion=descripcion,
        clasificacion_edad=clasificacion_edad,
        generos_ids=generos_ids,
    )

    return ContenidoService(db).create_with_video(dto, video, portada)


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


@router.post("/contenidos/{contenido_id}/validar-publicacion")
def validar_publicacion_contenido(
    contenido_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ContenidoService(db).validate_catalog_ready(contenido_id)


@router.get("/contenidos/{contenido_id}/playback")
def get_contenido_playback(
    contenido_id: int,
    quality: str | None = None,
    perfil_id: int | None = None,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    if perfil_id is not None:
        profile = db.query(Perfil).filter(Perfil.id == perfil_id).first()
        if not profile or (profile.cuenta_id != current_user.id and not current_user.is_admin):
            raise UnauthorizedError("Perfil no autorizado")
    video = ContenidoService(db).get_video_source(
        contenido_id,
        quality,
        perfil_id=perfil_id,
        max_quality=PLAN_MAX_QUALITY.get(current_user.plan, "FHD"),
    )
    effective_quality = video.quality or quality
    token = _create_media_token(current_user, "contenido", contenido_id, effective_quality, "stream")
    return {
        "stream_url": (
            f"/api/v1/contenidos/{contenido_id}/stream"
            f"?token={quote(token)}"
            + (f"&quality={quote(effective_quality)}" if effective_quality else "")
        ),
        "mime_type": video.mime_type,
    }


@router.get("/contenidos/{contenido_id}/stream")
def stream_contenido_video(
    contenido_id: int,
    request: Request,
    token: str,
    quality: str | None = None,
    db: Session = Depends(get_db),
):
    _verify_media_token(token, "contenido", contenido_id, quality, "stream")
    video = ContenidoService(db).get_video_source(contenido_id, quality)
    return _stream_storage_video(video.file_id, video.mime_type, request)


@router.get("/contenidos/{contenido_id}/download")
def download_contenido_video(
    contenido_id: int,
    request: Request,
    quality: str | None = None,
    _current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    video = ContenidoService(db).get_video_source(contenido_id, quality)
    return _stream_storage_video(
        video.file_id,
        video.mime_type,
        request,
        filename=video.filename,
        as_attachment=True,
    )


@router.put("/contenidos/{contenido_id}", response_model=ContenidoResponseDTO)
def update_contenido(
    contenido_id: int,
    titulo: str = Form(...),
    anio: int = Form(...),
    clasificacion_edad: str = Form(...),
    descripcion: str | None = Form(default=None),
    generos_ids: list[int] = Form(...),
    portada: UploadFile | None = File(default=None),
    video: UploadFile | None = File(default=None),
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = UpdateContenidoDTO(
        titulo=titulo,
        anio=anio,
        descripcion=descripcion,
        clasificacion_edad=clasificacion_edad,
        generos_ids=generos_ids,
    )

    return ContenidoService(db).update_with_video(contenido_id, dto, video, portada)


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


@router.get("/temporadas/{temporada_id}", response_model=TemporadaResponseDTO)
def get_temporada(temporada_id: int, db: Session = Depends(get_db)):
    return TemporadaService(db).get_by_id(temporada_id)


@router.delete("/temporadas/{temporada_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_temporada(
    temporada_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    TemporadaService(db).delete(temporada_id)


@router.put("/temporadas/{temporada_id}", response_model=TemporadaResponseDTO)
def update_temporada(
    temporada_id: int,
    payload: UpdateTemporadaSchema,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = UpdateTemporadaDTO(**payload.model_dump(exclude_unset=True))
    return TemporadaService(db).update(temporada_id, dto)


@router.post(
    "/episodios",
    response_model=EpisodioResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_episodio(
    temporada_id: int = Form(...),
    numero: int = Form(...),
    titulo: str = Form(...),
    video: UploadFile = File(...),
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = CreateEpisodioDTO(
        temporada_id=temporada_id,
        numero=numero,
        titulo=titulo,
    )

    return EpisodioService(db).create_with_video(dto, video)


@router.get("/temporadas/{temporada_id}/episodios", response_model=list[EpisodioResponseDTO])
def list_episodios(temporada_id: int, db: Session = Depends(get_db)):
    return EpisodioService(db).list_by_temporada(temporada_id)


@router.get("/episodios/{episodio_id}", response_model=EpisodioResponseDTO)
def get_episodio(episodio_id: int, db: Session = Depends(get_db)):
    return EpisodioService(db).get_by_id(episodio_id)


@router.get("/episodios/{episodio_id}/playback")
def get_episodio_playback(
    episodio_id: int,
    quality: str | None = None,
    perfil_id: int | None = None,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    if perfil_id is not None:
        profile = db.query(Perfil).filter(Perfil.id == perfil_id).first()
        if not profile or (profile.cuenta_id != current_user.id and not current_user.is_admin):
            raise UnauthorizedError("Perfil no autorizado")
    video = EpisodioService(db).get_video_source(
        episodio_id,
        quality,
        perfil_id=perfil_id,
        max_quality=PLAN_MAX_QUALITY.get(current_user.plan, "FHD"),
    )
    effective_quality = video.quality or quality
    token = _create_media_token(current_user, "episodio", episodio_id, effective_quality, "stream")
    return {
        "stream_url": (
            f"/api/v1/episodios/{episodio_id}/stream"
            f"?token={quote(token)}"
            + (f"&quality={quote(effective_quality)}" if effective_quality else "")
        ),
        "mime_type": video.mime_type,
    }


@router.get("/episodios/{episodio_id}/stream")
def stream_episodio_video(
    episodio_id: int,
    request: Request,
    token: str,
    quality: str | None = None,
    db: Session = Depends(get_db),
):
    _verify_media_token(token, "episodio", episodio_id, quality, "stream")
    video = EpisodioService(db).get_video_source(episodio_id, quality)
    return _stream_storage_video(video.file_id, video.mime_type, request)


@router.get("/episodios/{episodio_id}/download")
def download_episodio_video(
    episodio_id: int,
    request: Request,
    quality: str | None = None,
    _current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    video = EpisodioService(db).get_video_source(episodio_id, quality)
    return _stream_storage_video(
        video.file_id,
        video.mime_type,
        request,
        filename=video.filename,
        as_attachment=True,
    )


@router.delete("/episodios/{episodio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episodio(
    episodio_id: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    EpisodioService(db).delete(episodio_id)


@router.put("/episodios/{episodio_id}", response_model=EpisodioResponseDTO)
def update_episodio(
    episodio_id: int,
    numero: int = Form(...),
    titulo: str = Form(...),
    video: UploadFile | None = File(default=None),
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dto = UpdateEpisodioDTO(numero=numero, titulo=titulo)
    return EpisodioService(db).update_with_video(episodio_id, dto, video)


@router.post(
    "/perfiles/{perfil_id}/vistas",
    response_model=VistaResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_vista_recurso(
    perfil_id: int,
    payload: UpsertVistaSchema,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    dto = _vista_dto_from_request(
        perfil_id=profile.id,
        payload=payload,
    )
    return VistaService(db).create_or_update(dto)


@router.get("/perfiles/{perfil_id}/vistas", response_model=list[VistaResponseDTO])
def list_vistas(
    perfil_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return VistaService(db).list_by_perfil(profile.id)


@router.put(
    "/perfiles/{perfil_id}/vistas",
    response_model=VistaResponseDTO,
)
def update_vista_recurso(
    perfil_id: int,
    payload: UpsertVistaSchema,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    dto = _vista_dto_from_request(
        perfil_id=profile.id,
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
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    VistaService(db).delete(
        perfil_id=profile.id,
        episodio_id=episodio_id,
        contenido_id=contenido_id,
    )


@router.get("/perfiles/{perfil_id}/continuar", response_model=list[ContinuarViendoResponseDTO])
def continuar_viendo(
    perfil_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return VistaService(db).continuar_viendo(profile.id)


@router.get("/perfiles/{perfil_id}/recomendaciones", response_model=list[ContenidoResponseDTO])
def recomendaciones(
    perfil_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return ContenidoService(db).recommendations(profile.id)


@router.post("/perfiles/{perfil_id}/desbloquear", response_model=PerfilAuthResponseSchema)
def desbloquear_perfil(
    perfil_id: int,
    payload: PerfilAuthSchema,
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    dto = PerfilAuthDTO(**payload.model_dump())
    return AuthService(db).auth_perfil(current_user.id, perfil_id, dto)


@router.post("/perfiles/{perfil_id}/mi-lista", response_model=list[ContenidoResponseDTO])
def add_to_mi_lista(
    perfil_id: int,
    payload: AddMiListaSchema | None = None,
    contenido_id: int | None = Query(default=None),
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    target_contenido_id = payload.contenido_id if payload else contenido_id
    if target_contenido_id is None:
        raise BadRequestError("contenido_id es requerido")
    return MiListaService(db).add(profile.id, target_contenido_id)


@router.get("/perfiles/{perfil_id}/mi-lista", response_model=list[ContenidoResponseDTO])
def get_mi_lista(
    perfil_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return MiListaService(db).list(profile.id)


@router.delete("/perfiles/{perfil_id}/mi-lista/{contenido_id}", response_model=list[ContenidoResponseDTO])
def remove_from_mi_lista(
    perfil_id: int,
    contenido_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return MiListaService(db).remove(profile.id, contenido_id)


@router.post(
    "/perfiles/{perfil_id}/descargas",
    response_model=DescargaResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_descarga(
    perfil_id: int,
    payload: CreateDescargaSchema,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    dto = CreateDescargaDTO(perfil_id=profile.id, **payload.model_dump())
    return DescargaService(db).create(dto)


@router.get("/perfiles/{perfil_id}/descargas", response_model=list[DescargaResponseDTO])
def list_descargas(
    perfil_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return DescargaService(db).list(profile.id)


@router.delete("/perfiles/{perfil_id}/descargas/{descarga_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_descarga(
    perfil_id: int,
    descarga_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    DescargaService(db).delete(profile.id, descarga_id)


@router.get("/reportes/visualizacion", response_model=ReporteVisualizacionDTO)
def reporte_visualizacion(
    anio: int,
    mes: int,
    _admin: Cuenta = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ReporteService(db).visualizacion(anio=anio, mes=mes)


@router.post(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    response_model=CalificacionResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_calificacion(
    perfil_id: int,
    contenido_id: int,
    payload: UpsertCalificacionSchema,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    dto = _calificacion_dto_from_request(profile.id, contenido_id, payload)
    return CalificacionService(db).create_or_update(dto)


@router.get(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    response_model=CalificacionResponseDTO,
)
def get_calificacion(
    perfil_id: int,
    contenido_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    return CalificacionService(db).get(profile.id, contenido_id)


@router.put(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    response_model=CalificacionResponseDTO,
)
def update_calificacion(
    perfil_id: int,
    contenido_id: int,
    payload: UpsertCalificacionSchema,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    dto = _calificacion_dto_from_request(profile.id, contenido_id, payload)
    return CalificacionService(db).create_or_update(dto)


@router.delete(
    "/perfiles/{perfil_id}/calificaciones/{contenido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_calificacion(
    perfil_id: int,
    contenido_id: int,
    profile: Perfil = Depends(get_owned_profile),
    db: Session = Depends(get_db),
):
    CalificacionService(db).delete(profile.id, contenido_id)
