# Titoflix con Docker

Este proyecto corre con Docker Compose y separa la app en servicios independientes.

## Servicios

- `frontend`: Next.js en `http://localhost:3000`. Tambien proxyea `/api/v1/*` al backend.
- `backend`: FastAPI en `http://localhost:8000`.
- `postgres`: PostgreSQL en `localhost:5432`.
- `minio`: storage S3 compatible en `localhost:9000`.
- `minio-init`: crea el bucket inicial.
- `titoflix-cloudflared-tunnel`: contenedor opcional creado por `manager.bat` para Cloudflare Tunnel.

El backend instala FFmpeg para detectar duracion/resolucion y generar variantes de video `FHD`, `QHD` y `4K`.

## Requisitos

- Docker Desktop
- Docker Compose v2
- Windows PowerShell para usar `manager.bat` y scripts auxiliares

## Uso rapido

En Windows:

```bat
manager.bat
```

Opciones principales:

- `1. Iniciar servicios`: levanta el stack.
- `2. Ver estado`: muestra contenedores.
- `3` a `6`: logs de frontend, backend, postgres o MinIO.
- `7. Detener servicios`: apaga contenedores sin borrar volumenes.
- `8. Reconstruir e iniciar`: rebuild completo.
- `9. Resetear tablas de Postgres y buckets de MinIO`: borra base y archivos.
- `10. Iniciar tunel de Cloudflare`: levanta servicios, espera frontend en `localhost:3000` y arranca el conector.
- `11. Ver estado/logs del tunel`.
- `12. Detener tunel de Cloudflare`.
- `13. Actualizar token de Cloudflare`.

Comandos equivalentes:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down
```

## URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Healthcheck backend: `http://localhost:8000/health`
- MinIO API S3: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

En la configuracion default el navegador llama a la API con rutas relativas:

```text
/api/v1 -> Next.js -> http://backend:8000/api/v1
```

Esto permite que `https://titoflix.watch/api/v1` funcione cuando el tunel apunta al frontend.

## Variables importantes

El `.env` se crea desde `.env.example`.

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/titoflix
S3_ENDPOINT_URL=http://minio:9000
S3_PUBLIC_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=titoflix
S3_SECRET_KEY=titoflix-secret
S3_BUCKET_NAME=titoflix-media
S3_REGION=us-east-1
S3_MEDIA_PREFIX=media
S3_ASSETS_PREFIX=assets
INTERNAL_BACKEND_URL=http://backend:8000
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_DIRECT_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=
CLOUDFLARE_TUNNEL_TOKEN=
```

Credenciales MinIO default:

- Usuario: `titoflix`
- Password: `titoflix-secret`
- Bucket: `titoflix-media`

## Cloudflare Tunnel

El tunel configurado en Cloudflare debe apuntar a:

```text
http://host.docker.internal:3000
```

No debe apuntar al backend si se quiere servir la app completa desde el mismo dominio. El frontend se encarga de proxyear `/api/v1`.

Para arrancarlo:

1. Cargar `CLOUDFLARE_TUNNEL_TOKEN` en `.env` o usar la opcion `13` del manager.
2. Usar la opcion `10`.
3. Revisar logs con opcion `11`.

Si aparece Cloudflare 1033, el tunel esta activo pero no llega al origen. Verificar:

```powershell
docker compose ps
Invoke-WebRequest -UseBasicParsing http://localhost:3000
docker run --rm curlimages/curl:latest -sS -o /dev/null -w "%{http_code}\n" http://host.docker.internal:3000
```

Si el ultimo comando no devuelve `200`, Cloudflare tampoco podra llegar.

## Storage S3/MinIO

Se usa MinIO en vez de Google Drive. El backend guarda:

- videos y variantes bajo `media`
- portadas, miniaturas y avatars bajo `assets`

El usuario final no habla directo con MinIO. Assets y videos se sirven por el backend:

- Assets: `/api/v1/assets/{asset_path}`
- Streams: `/api/v1/contenidos/{id}/stream?...`
- Streams de episodios: `/api/v1/episodios/{id}/stream?...`

El backend respeta requests con header `Range`, necesario para reproduccion parcial en el navegador.

## Playback y calidades

Al subir videos, FFmpeg genera variantes hasta la resolucion disponible. Las calidades permitidas por plan son:

- `basico`: hasta `FHD`
- `estandar`: hasta `QHD`
- `premium`: hasta `4K`

Los endpoints `/playback` eligen la mejor calidad permitida si no se pasa `quality`, y rechazan calidades superiores al plan.

El endpoint `/stream` usa un token temporal de media generado por `/playback`. Ese token incluye recurso, accion y calidad.

## Reset de datos

Resetear tablas:

```powershell
docker compose exec backend python -c "from src.db import reset_database; reset_database()"
```

Resetear base y bucket desde el manager:

```text
9. Resetear tablas de Postgres y buckets de MinIO
```

Borrar volumenes manualmente:

```powershell
docker compose down -v
```

## Comandos utiles

Reconstruir solo backend:

```powershell
docker compose build backend
docker compose up -d backend
```

Reconstruir solo frontend:

```powershell
docker compose build frontend
docker compose up -d frontend
```

Validar backend dentro del contenedor:

```powershell
docker compose exec backend python -m compileall src
```

Ver logs del tunel:

```powershell
docker logs -f titoflix-cloudflared-tunnel
```
