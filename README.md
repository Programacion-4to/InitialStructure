# Titoflix

> Para el arranque V2 privado, migraciones, creación explícita de admin y límites de exposición, ver [docs/V2_OPERATIONS.md](docs/V2_OPERATIONS.md).

Aplicacion de streaming tipo Netflix con frontend Next.js, backend FastAPI, PostgreSQL y MinIO/S3 para videos, portadas, miniaturas y avatars.

El stack esta pensado para correr con Docker. El frontend sirve la app en `:3000` y tambien proxyea `/api/v1/*` al backend, lo que permite usar la misma URL local o de Cloudflare Tunnel para la UI y la API.

## Stack

- Frontend: Next.js en `http://localhost:3000`
- Backend: FastAPI en `http://localhost:8000`
- Base de datos: PostgreSQL en `localhost:5432`
- Storage: MinIO compatible S3 en `localhost:9000`
- Consola MinIO: `http://localhost:9001`
- Tunel publico opcional: Cloudflare Tunnel hacia `http://host.docker.internal:3000`

## Como correrlo

### Opcion recomendada: manager.bat

En Windows:

```powershell
.\manager.bat
```

Opciones mas usadas:

- `1. Iniciar servicios`: levanta frontend, backend, PostgreSQL y MinIO.
- `2. Ver estado`: muestra los contenedores.
- `3` a `6`: logs de cada servicio.
- `8. Reconstruir e iniciar`: rebuild completo.
- `9. Resetear tablas de Postgres y buckets de MinIO`: borra datos y archivos locales.
- `10. Iniciar tunel de Cloudflare`: levanta servicios, espera a que el frontend responda en `localhost:3000` y luego inicia el tunel.
- `11. Ver estado/logs del tunel`.
- `12. Detener tunel de Cloudflare`.
- `13. Actualizar token de Cloudflare`.

### Docker Compose directo

Desde la raiz:

```powershell
docker compose up -d --build
```

Estado y logs:

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

Detener:

```powershell
docker compose down
```

Borrar tambien volumenes de PostgreSQL y MinIO:

```powershell
docker compose down -v
```

## URLs

Misma computadora:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`
- MinIO Console: `http://localhost:9001`

Desde otro dispositivo en la LAN, reemplazar `localhost` por la IP del host:

- Frontend: `http://[IP_LOCAL]:3000`
- Backend: `http://[IP_LOCAL]:8000`

Con Cloudflare Tunnel apuntando al frontend:

- App: `https://titoflix.watch`
- API por proxy: `https://titoflix.watch/api/v1`

MinIO no hace falta exponerlo publicamente. El backend habla con MinIO por la red interna de Docker (`http://minio:9000`).

## Configuracion

El archivo `.env.example` contiene valores listos para desarrollo. `scripts/ensure-env.ps1` crea `.env` si falta.

Variables clave:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/titoflix
INTERNAL_BACKEND_URL=http://backend:8000
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_DIRECT_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=
S3_ENDPOINT_URL=http://minio:9000
S3_PUBLIC_ENDPOINT_URL=http://localhost:9000
CLOUDFLARE_TUNNEL_TOKEN=
```

Para el modo default con tunel, dejar `NEXT_PUBLIC_API_URL=/api/v1` y `NEXT_PUBLIC_BACKEND_URL=`. Asi la app usa el mismo dominio para UI, API, assets y streams.

## Cuenta admin

Al arrancar, el backend crea o actualiza una cuenta admin principal fija con ID `1`.

- Usuario: `titoflix-admin`
- Contrasena: `admin1234`
- Plan: `premium`

Login admin:

```http
POST /api/v1/auth/admin-login
```

```json
{
  "username": "titoflix-admin",
  "password": "admin1234"
}
```

Solo este admin principal puede administrar permisos admin de otras cuentas desde la pestaña `Permisos` de la consola. A este admin no se le pueden quitar permisos ni eliminar desde la API.

## Funcionalidad principal

- Registro/login de cuentas con planes `basico`, `estandar`, `premium`.
- Limites de perfiles por plan: `basico=1`, `estandar=2`, `premium=5`.
- Perfiles con avatar, PIN opcional y modo infantil.
- Catalogo con peliculas, series, temporadas, episodios, generos, portadas y miniaturas.
- Subida de videos a MinIO con procesamiento FFmpeg.
- Variantes de calidad: `FHD`, `QHD`, `4K`.
- Limites de calidad por plan: `basico=FHD`, `estandar=QHD`, `premium=4K`.
- Playback con token temporal de media y soporte de `Range`.
- Progreso de vistas, continuar viendo y reproducir desde cero.
- Mi Lista por perfil.
- Calificaciones, incluyendo eliminacion de la calificacion propia.
- Descargas offline con limite por plan.
- Recomendaciones y top 10.
- Reporte mensual de visualizacion para admin.

## Endpoints principales

Auth:

```http
POST /api/v1/auth/login
POST /api/v1/auth/admin-login
GET /api/v1/auth/me
```

Cuentas y perfiles:

```http
POST /api/v1/cuentas
GET /api/v1/cuentas
GET /api/v1/cuentas/{id}
PUT /api/v1/cuentas/{id}
PUT /api/v1/cuentas/{id}/admin
DELETE /api/v1/cuentas/{id}
POST /api/v1/cuentas/perfiles
GET /api/v1/cuentas/{id}/perfiles
GET /api/v1/cuentas/perfiles/{id}
PUT /api/v1/cuentas/perfiles/{id}
DELETE /api/v1/cuentas/perfiles/{id}
```

Catalogo:

```http
GET /api/v1/generos
POST /api/v1/generos
PUT /api/v1/generos/{id}
DELETE /api/v1/generos/{id}
GET /api/v1/contenidos
POST /api/v1/contenidos
GET /api/v1/contenidos/{id}
PUT /api/v1/contenidos/{id}
DELETE /api/v1/contenidos/{id}
POST /api/v1/contenidos/{id}/validar-publicacion
POST /api/v1/temporadas
GET /api/v1/contenidos/{id}/temporadas
PUT /api/v1/temporadas/{id}
DELETE /api/v1/temporadas/{id}
POST /api/v1/episodios
GET /api/v1/temporadas/{id}/episodios
PUT /api/v1/episodios/{id}
DELETE /api/v1/episodios/{id}
```

Playback:

```http
GET /api/v1/contenidos/{id}/playback?quality=QHD&perfil_id=10
GET /api/v1/contenidos/{id}/stream?token=...&quality=QHD
GET /api/v1/episodios/{id}/playback?quality=FHD&perfil_id=10
GET /api/v1/episodios/{id}/stream?token=...&quality=FHD
```

Perfiles y experiencia:

```http
POST /api/v1/perfiles/{id}/desbloquear
POST /api/v1/perfiles/{id}/vistas
GET /api/v1/perfiles/{id}/vistas
PUT /api/v1/perfiles/{id}/vistas
DELETE /api/v1/perfiles/{id}/vistas?contenido_id=1
GET /api/v1/perfiles/{id}/continuar
POST /api/v1/perfiles/{id}/mi-lista
GET /api/v1/perfiles/{id}/mi-lista
DELETE /api/v1/perfiles/{id}/mi-lista/{contenido_id}
POST /api/v1/perfiles/{id}/calificaciones/{contenido_id}
GET /api/v1/perfiles/{id}/calificaciones/{contenido_id}
PUT /api/v1/perfiles/{id}/calificaciones/{contenido_id}
DELETE /api/v1/perfiles/{id}/calificaciones/{contenido_id}
GET /api/v1/perfiles/{id}/recomendaciones
```

Descargas y reportes:

```http
POST /api/v1/perfiles/{id}/descargas
GET /api/v1/perfiles/{id}/descargas
DELETE /api/v1/perfiles/{id}/descargas/{descarga_id}
GET /api/v1/contenidos/top
GET /api/v1/reportes/visualizacion?anio=2026&mes=5
```

Assets:

```http
GET /api/v1/assets/{asset_path}
```

## Troubleshooting rapido

Cloudflare 1033:

- Significa que Cloudflare no llega al origen.
- Revisar `docker compose ps`.
- Confirmar que `http://localhost:3000` responde.
- Confirmar desde Docker:

```powershell
docker run --rm curlimages/curl:latest -sS -o /dev/null -w "%{http_code}\n" http://host.docker.internal:3000
```

Si da `200`, reiniciar el tunel:

```powershell
docker restart titoflix-cloudflared-tunnel
```

Bad Gateway en `/vistas`:

- Revisar logs del backend.
- El guardado de vistas usa upsert y tolera reportes simultaneos, pero si vuelve a aparecer mirar:

```powershell
docker compose logs -f backend
```

Bad Gateway o cortes en `/stream`:

- Verificar que el backend siga arriba.
- Probar una calidad menor.
- Revisar si el tunel esta cortando conexiones largas:

```powershell
docker logs -f titoflix-cloudflared-tunnel
```

## Entregables

- Modelo de datos: `docs/modelo-datos.md`
- Diagrama ER editable: `docs/streaming_erd.drawio`
- Script SQL: `database.sql`
- Modelos SQLAlchemy: `backend/src/db/models/`
- Schemas Pydantic: `backend/src/schemas/`
- API REST FastAPI: `backend/src/routers/`
