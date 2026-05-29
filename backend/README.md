# Titoflix Backend

API REST de Titoflix hecha con FastAPI, SQLAlchemy, Pydantic, PostgreSQL y MinIO/S3.

## Como correrlo

### Docker, recomendado

Desde la raiz:

```powershell
docker compose up -d --build
```

Solo backend:

```powershell
docker compose build backend
docker compose up -d backend
```

### Sin Docker

Desde `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

En este modo hay que proveer PostgreSQL y MinIO en `.env`.

## URLs

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`

Cuando se usa el frontend como proxy:

- API publica: `http://localhost:3000/api/v1`
- API por tunel: `https://titoflix.watch/api/v1`

## Servicios internos

Dentro de Docker:

- PostgreSQL: `postgres:5432`
- MinIO API: `minio:9000`
- Frontend llama al backend por `INTERNAL_BACKEND_URL=http://backend:8000`

MinIO Console (`:9001`) es solo administracion.

## Startup y migraciones livianas

En startup el backend:

- crea tablas si no existen;
- agrega columnas nuevas necesarias en bases existentes;
- ajusta constraints/valores de calidades de video;
- crea o actualiza la cuenta admin principal ID `1`.

Esto no reemplaza una herramienta formal de migraciones, pero alcanza para el entorno del proyecto.

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

## Auth y admin

Endpoints:

```http
POST /api/v1/auth/login
POST /api/v1/auth/admin-login
GET /api/v1/auth/me
```

Admin principal:

- ID: `1`
- Usuario default: `titoflix-admin`
- Password default: `admin1234`

Solo el admin principal puede cambiar permisos admin:

```http
PUT /api/v1/cuentas/{id}/admin
```

Body:

```json
{
  "is_admin": true
}
```

## Cuentas y perfiles

```http
POST /api/v1/cuentas
GET /api/v1/cuentas
GET /api/v1/cuentas/{id}
PUT /api/v1/cuentas/{id}
DELETE /api/v1/cuentas/{id}
POST /api/v1/cuentas/perfiles
GET /api/v1/cuentas/{id}/perfiles
GET /api/v1/cuentas/perfiles/{id}
PUT /api/v1/cuentas/perfiles/{id}
DELETE /api/v1/cuentas/perfiles/{id}
```

Planes:

- `basico`: 1 perfil, calidad hasta `FHD`, 0 descargas.
- `estandar`: 2 perfiles, calidad hasta `QHD`, 10 descargas activas.
- `premium`: 5 perfiles, calidad hasta `4K`, 30 descargas activas.

Perfiles:

- `es_infantil=true` limita catalogo, Mi Lista, descargas y playback a contenido `ATP`.
- `pin` es opcional y se guarda hasheado.
- tras 3 PIN incorrectos el perfil se bloquea 15 minutos.
- `avatar` puede ser data URL; se guarda en MinIO bajo `assets`.

## Catalogo y uploads

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
GET /api/v1/temporadas/{id}
PUT /api/v1/temporadas/{id}
DELETE /api/v1/temporadas/{id}
POST /api/v1/episodios
GET /api/v1/temporadas/{id}/episodios
GET /api/v1/episodios/{id}
PUT /api/v1/episodios/{id}
DELETE /api/v1/episodios/{id}
```

Las peliculas se crean con video directo. Las series se crean sin video y los videos se cargan en episodios.

El backend usa FFmpeg/ffprobe para:

- validar que el archivo sea video;
- detectar duracion;
- generar variantes `FHD`, `QHD`, `4K` segun resolucion fuente;
- generar miniaturas de episodios.

## Playback y streaming

```http
GET /api/v1/contenidos/{id}/playback?quality=QHD&perfil_id=10
GET /api/v1/contenidos/{id}/stream?token=...&quality=QHD
GET /api/v1/episodios/{id}/playback?quality=FHD&perfil_id=10
GET /api/v1/episodios/{id}/stream?token=...&quality=FHD
```

`/playback`:

- valida permisos de cuenta/perfil;
- valida restriccion infantil;
- valida calidad maxima del plan;
- elige la mejor variante permitida si no se manda `quality`;
- devuelve `stream_url` con token temporal de media.

`/stream`:

- verifica el token de media;
- lee el objeto desde MinIO;
- responde con soporte de `Range` para playback parcial.

## Progreso, Mi Lista y calificaciones

```http
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
```

Vistas:

- una vista apunta a `contenido_id` o `episodio_id`, nunca ambos;
- se marca `terminado` al llegar al 90%;
- el upsert tolera reportes simultaneos del reproductor.

Calificaciones:

- solo se puede calificar contenido empezado;
- un perfil tiene una calificacion por contenido;
- se puede eliminar la calificacion.

## Recomendaciones, descargas y reportes

```http
GET /api/v1/perfiles/{id}/recomendaciones
GET /api/v1/contenidos/top
GET /api/v1/contenidos/top?genero=drama
POST /api/v1/perfiles/{id}/descargas
GET /api/v1/perfiles/{id}/descargas
DELETE /api/v1/perfiles/{id}/descargas/{descarga_id}
GET /api/v1/reportes/visualizacion?anio=2026&mes=5
```

Descargas:

- vencen a los 30 dias;
- las vencidas o eliminadas no cuentan para el limite;
- respetan perfil infantil.

Reporte:

- requiere admin;
- devuelve total mensual, desglose por genero y top 20 contenidos.

## Assets

```http
GET /api/v1/assets/{asset_path}
```

Sirve portadas, miniaturas y avatars desde MinIO con streaming.

## Validacion

Compilar dentro del contenedor:

```powershell
docker compose exec backend python -m compileall src
```

Ver logs:

```powershell
docker compose logs -f backend
```

## Documentacion relacionada

- General: `../README.md`
- Docker: `../DOCKER.md`
- Modelo de datos: `../docs/modelo-datos.md`
- Script SQL: `../database.sql`
