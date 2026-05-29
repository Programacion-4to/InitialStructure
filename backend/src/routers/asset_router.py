from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from src.config.env import settings
from src.services.storage_service import StorageService


router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/{asset_path:path}")
def stream_asset(asset_path: str, request: Request) -> StreamingResponse:
    object_key = f"{settings.S3_ASSETS_PREFIX.strip('/')}/{asset_path.strip('/')}"
    stream = StorageService().stream_file(
        object_key=object_key,
        range_header=request.headers.get("range"),
        fallback_mime_type="application/octet-stream",
    )
    media_type = stream.headers.get("Content-Type", "application/octet-stream")
    return StreamingResponse(
        stream.chunks,
        status_code=stream.status_code,
        media_type=media_type,
        headers=stream.headers,
    )
