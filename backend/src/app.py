from fastapi import FastAPI

<<<<<<< Updated upstream
from src.middlewares.error_middleware import app_error_handler
from src.routers import auth_router, user_router, pasajero_router, conductores_router
=======
from src.config import settings, validate_runtime_settings
from src.middlewares import app_error_handler
from src.routers import asset_router, auth_router, product_router, user_router
>>>>>>> Stashed changes
from src.utils.errors import AppError

app = FastAPI(title="Initial Structure API")

app.add_exception_handler(AppError, app_error_handler)

<<<<<<< Updated upstream
app.include_router(user_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(pasajero_router.router, prefix="/api")
app.include_router(conductores_router.router, prefix="/api")
# TODO: registrar product_router cuando se implemente
# app.include_router(product_router.router, prefix="/api")
=======
app.include_router(auth_router.router, prefix=API_PREFIX)
app.include_router(asset_router.router, prefix=API_PREFIX)
app.include_router(user_router.router, prefix=API_PREFIX)
app.include_router(product_router.router, prefix=API_PREFIX)


@app.on_event("startup")
def startup():
    validate_runtime_settings()
>>>>>>> Stashed changes


@app.get("/health")
def health():
    return {"status": "ok"}
