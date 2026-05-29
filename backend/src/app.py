import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.db import create_tables
from src.middlewares import app_error_handler
from src.routers import asset_router, auth_router, product_router, user_router
from src.utils.errors import AppError


API_PREFIX = "/api/v1"

app = FastAPI(title="Titoflix API", version="1.0.0", redirect_slashes=False)

allowed_origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(auth_router.router, prefix=API_PREFIX)
app.include_router(asset_router.router, prefix=API_PREFIX)
app.include_router(user_router.router, prefix=API_PREFIX)
app.include_router(product_router.router, prefix=API_PREFIX)


@app.on_event("startup")
def startup():
    for attempt in range(1, 11):
        try:
            create_tables()
            return
        except Exception:
            if attempt == 10:
                raise
            time.sleep(2)


@app.get("/health")
def health():
    return {"status": "ok"}
