# Titoflix con Docker

Este proyecto corre con cuatro servicios separados:

- `frontend`: aplicacion Next.js en `http://localhost:3000`
- `backend`: API FastAPI en `http://localhost:8000`
- `postgres`: base de datos PostgreSQL en `localhost:5432`
- `minio`: storage compatible con S3 para videos, miniaturas, avatars y assets

## Requisitos

- Docker Desktop
- Docker Compose v2

## Uso rapido

En Windows ejecuta:

```bat
manager.bat
```

Opciones principales:

- `Iniciar servicios`: levanta todos los contenedores en segundo plano.
- `Ver consola del frontend/backend/postgres/MinIO`: abre logs en vivo del servicio elegido.
- `Detener servicios`: apaga los contenedores sin borrar volumenes.
- `Reconstruir e iniciar`: reconstruye imagenes y vuelve a levantar el stack.
- `Resetear tablas de Postgres`: elimina y vuelve a crear las tablas desde el backend.

Tambien podes usar Docker Compose directamente:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down
```

Para resetear solo las tablas de Postgres desde Docker:

```bash
docker compose exec backend python -c "from src.db import reset_database; reset_database()"
```

Ese comando no borra los archivos guardados en MinIO.

## URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Healthcheck backend: `http://localhost:8000/health`
- MinIO API S3: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Credenciales de MinIO:

- Usuario: `titoflix`
- Password: `titoflix-secret`
- Bucket: `titoflix-media`

## Variables importantes

El `docker-compose.yml` ya define las variables necesarias para desarrollo local:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/titoflix
S3_ENDPOINT_URL=http://minio:9000
S3_PUBLIC_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=titoflix
S3_SECRET_KEY=titoflix-secret
S3_BUCKET_NAME=titoflix-media
S3_REGION=us-east-1
S3_MEDIA_PREFIX=media
```

El backend crea las tablas al arrancar. PostgreSQL guarda datos en el volumen `postgres_data` y MinIO guarda archivos en `minio_data`.

## Storage S3/MinIO

Se elimino la integracion con Google Drive. Los videos se suben a MinIO usando la API S3 y se guardan en el bucket `titoflix-media`, bajo el prefijo `media`.

Los endpoints de playback siguen devolviendo `stream_url` y `mime_type`. La transmision del video pasa por el backend, que lee desde MinIO y respeta requests con header `Range` para reproduccion parcial.

## Borrar datos locales

Para apagar todo y borrar la base de datos y los archivos de MinIO:

```bash
docker compose down -v
```

Usalo con cuidado: elimina los volumenes `postgres_data` y `minio_data`.
