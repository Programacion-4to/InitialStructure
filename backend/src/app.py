from fastapi import FastAPI
from src.db.connection import engine, Base
import src.db.models  # Carga los modelos de SQLAlchemy

from src.middlewares.error_middleware import app_error_handler
from src.utils.errors import AppError

# 1. Crea las tablas en PostgreSQL si no existen
Base.metadata.create_all(bind=engine)

# 2. Instancia de FastAPI
app = FastAPI(title="Duolingo Clone API")

# Manejo de errores
app.add_exception_handler(AppError, app_error_handler)

@app.get("/health")
def health():
    return {"status": "ok"}