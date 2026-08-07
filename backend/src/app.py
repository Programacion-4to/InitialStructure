from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.middlewares.error_middleware import app_error_handler
from src.routers import (
    auth_router,
    conductores_router,
    cupon_router,
    metodo_pago_router,
    multiplicador_horario_router,
    pasajero_router,
    tarifa_router,
    vehiculo_router,
    viaje_router,
)
from src.utils.errors import AppError

app = FastAPI(title="Initial Structure API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(auth_router.router, prefix="/api")
app.include_router(pasajero_router.router, prefix="/api")
app.include_router(conductores_router.router, prefix="/api")
app.include_router(vehiculo_router.router, prefix="/api")
app.include_router(metodo_pago_router.router, prefix="/api")
app.include_router(tarifa_router.router, prefix="/api")
app.include_router(multiplicador_horario_router.router, prefix="/api")
app.include_router(cupon_router.router, prefix="/api")
app.include_router(viaje_router.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
