# Titoflix Backend

API REST de Titoflix hecha con FastAPI, SQLAlchemy, Pydantic y PostgreSQL.

## Como correrlo

### Con Docker, recomendado

Desde la raiz del proyecto:

```powershell
docker compose up -d --build backend
```

En la practica conviene levantar todo el stack:

```powershell
docker compose up -d --build
```

### Sin Docker

Desde `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

Para este modo hay que tener PostgreSQL y MinIO configurados en `.env`.

## URLs

Misma maquina:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`

Desde otro dispositivo de la red:

- API: `http://[IP_LOCAL]:8000`
- Swagger: `http://[IP_LOCAL]:8000/docs`

Con tunel publico apuntando al backend:

- API: `[URL_DE_TUNEL]/api/v1`
- Swagger: `[URL_DE_TUNEL]/docs`

## Servicios internos

Dentro de Docker, el backend no usa `localhost` para hablar con otros contenedores:

- PostgreSQL: `postgres:5432`
- MinIO API: `minio:9000`

La consola de MinIO (`:9001`) es de administracion. No es necesaria para que el usuario use Titoflix y normalmente se abre solo desde el host o la LAN.

## Estructura

```text
src/
  app.py
  main.py
  config/
  db/
    connection.py
    models/
  schemas/
  dtos/
  mappers/
  repositories/
  services/
  routers/
  middlewares/
  utils/
```

## Endpoints principales

- Auth: `/api/v1/auth/login`, `/api/v1/auth/admin-login`, `/api/v1/auth/me`
- Cuentas/perfiles: `/api/v1/cuentas`, `/api/v1/cuentas/perfiles`
- Catalogo: `/api/v1/contenidos`, `/api/v1/generos`, `/api/v1/temporadas`, `/api/v1/episodios`
- Playback: `/api/v1/contenidos/{id}/playback`, `/api/v1/episodios/{id}/playback`
- PIN: `/api/v1/perfiles/{id}/desbloquear`
- Progreso: `/api/v1/perfiles/{id}/vistas`
- Continuar viendo: `/api/v1/perfiles/{id}/continuar`
- Mi Lista: `/api/v1/perfiles/{id}/mi-lista`
- Calificaciones: `/api/v1/perfiles/{id}/calificaciones/{contenido_id}`
- Descargas: `/api/v1/perfiles/{id}/descargas`
- Reportes: `/api/v1/reportes/visualizacion`

## Documentacion del proyecto

- README general: `../README.md`
- Modelo de datos / diagrama ER: `../docs/modelo-datos.md`
- Script SQL: `../database.sql`
