from fastapi import Request
from fastapi.responses import JSONResponse

from src.utils.errors import AppError


async def app_error_handler(request: Request, exc: AppError):
    content = {"error": exc.__class__.__name__, "message": exc.message}
    content.update(exc.extra)
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )
