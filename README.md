# Titoflix

Aplicacion de streaming tipo Netflix con frontend Next.js, backend FastAPI, PostgreSQL y MinIO/S3 para videos y assets.

## Como correrlo

### Opcion 1: comandos de terminal

Desde la raiz del proyecto:

```powershell
docker compose up -d --build
```

URLs principales:

Desde la misma computadora donde corre Docker:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- MinIO Console: `http://localhost:9001`

Desde otro dispositivo en la misma red, reemplazar `localhost` por la IP de la computadora host:

- Frontend: `http://[IP_LOCAL]:3000`
- Backend: `http://[IP_LOCAL]:8000`
- Swagger: `http://[IP_LOCAL]:8000/docs`
- MinIO Console: `http://[IP_LOCAL]:9001`

Si se usa un tunel publico, usar la URL del tunel para el servicio expuesto:

- Frontend/API por tunel: `[URL_DE_TUNEL]`
- Swagger si el tunel apunta al backend: `[URL_DE_TUNEL]/docs`
- API si el tunel apunta al frontend con proxy: `[URL_DE_TUNEL]/api/v1`

MinIO no hace falta exponerlo publicamente para usar la app. En Docker, backend habla con MinIO por `http://minio:9000`; la consola `:9001` es para administracion y normalmente se abre solo desde el host o desde la LAN.

Para detenerlo:

```powershell
docker compose down
```

### Opcion 2: manager.bat

En Windows tambien se puede usar:

```powershell
.\manager.bat
```

El menu permite levantar, detener y administrar los servicios del proyecto.

## Cuenta admin

El backend crea o actualiza automaticamente una cuenta admin fija al arrancar:

- Usuario: `titoflix-admin`
- Contrasena: `admin1234`

Endpoint:

```http
POST /api/v1/auth/admin-login
```

```json
{
  "username": "titoflix-admin",
  "password": "admin1234"
}
```

## Entregables

- Modelo de datos / diagrama ER: `docs/modelo-datos.md`
- Script SQL: `database.sql`
- Modelos SQLAlchemy: `backend/src/db/models/`
- Schemas Pydantic: `backend/src/schemas/`
- API REST FastAPI: `backend/src/routers/`

## Historias y endpoints

### HU1 - Alta de cuenta y planes

```http
POST /api/v1/cuentas
GET /api/v1/cuentas/{id}
PUT /api/v1/cuentas/{id}
DELETE /api/v1/cuentas/{id}
```

Ejemplo:

```json
{
  "email": "ana@mail.com",
  "password": "password123",
  "plan": "premium"
}
```

### HU2 - Perfiles dentro de la cuenta

```http
POST /api/v1/cuentas/perfiles
GET /api/v1/cuentas/{id}/perfiles
PUT /api/v1/cuentas/perfiles/{id}
DELETE /api/v1/cuentas/perfiles/{id}
```

### HU3 - Catalogo: peliculas y series

```http
POST /api/v1/generos
POST /api/v1/contenidos
POST /api/v1/temporadas
POST /api/v1/episodios
POST /api/v1/contenidos/{id}/validar-publicacion
```

`validar-publicacion` verifica que una pelicula tenga video/duracion y que una serie tenga al menos una temporada con episodios.

### HU4 - Restriccion infantil

```http
GET /api/v1/contenidos?perfil_id=2
GET /api/v1/contenidos/{id}/playback?perfil_id=2
GET /api/v1/episodios/{id}/playback?perfil_id=2
```

Si el perfil es infantil y el contenido no es `ATP`, la API devuelve `403`.

### HU5 - Busqueda y filtros

```http
GET /api/v1/contenidos?q=texto
GET /api/v1/contenidos?genero=accion&tipo=serie
GET /api/v1/contenidos?ordenar=anio_desc
GET /api/v1/contenidos?perfil_id=2
```

### HU6 - Marcar vista y progreso

```http
POST /api/v1/perfiles/{id}/vistas
PUT /api/v1/perfiles/{id}/vistas
DELETE /api/v1/perfiles/{id}/vistas?contenido_id=1
```

Ejemplo:

```json
{
  "contenido_id": 1,
  "segundos_vistos": 5400
}
```

### HU7 - Continuar viendo

```http
GET /api/v1/perfiles/{id}/continuar
```

Devuelve hasta 10 contenidos no terminados, ordenados por ultima reproduccion. En series incluye el proximo episodio no terminado.

### HU8 - Mi Lista

```http
POST /api/v1/perfiles/{id}/mi-lista?contenido_id=1
GET /api/v1/perfiles/{id}/mi-lista
DELETE /api/v1/perfiles/{id}/mi-lista/{contenido_id}
```

### HU9 - Calificacion

```http
POST /api/v1/perfiles/{id}/calificaciones/{contenido_id}
PUT /api/v1/perfiles/{id}/calificaciones/{contenido_id}
DELETE /api/v1/perfiles/{id}/calificaciones/{contenido_id}
GET /api/v1/contenidos/{id}
```

Ejemplo:

```json
{
  "puntaje": 5
}
```

### HU10 - Recomendaciones y tops

```http
GET /api/v1/perfiles/{id}/recomendaciones
GET /api/v1/contenidos/top
GET /api/v1/contenidos/top?genero=drama
```

### HU11 - Control parental con PIN

```http
POST /api/v1/perfiles/{id}/desbloquear
```

Ejemplo:

```json
{
  "pin": "1234"
}
```

Tras 3 intentos fallidos, el perfil queda bloqueado por 15 minutos.

### HU12 - Subtitulos e idiomas

Descartada por indicacion del profesor.

### HU13 - Descargas offline con limite por plan

```http
POST /api/v1/perfiles/{id}/descargas
GET /api/v1/perfiles/{id}/descargas
DELETE /api/v1/perfiles/{id}/descargas/{descarga_id}
```

Ejemplo:

```json
{
  "contenido_id": 1
}
```

Limites activos por cuenta: `basico=0`, `estandar=10`, `premium=30`. Las descargas vencen a los 30 dias y las vencidas o eliminadas no cuentan para el limite.

### HU14 - Reporte de visualizacion

```http
GET /api/v1/reportes/visualizacion?anio=2026&mes=4
```

Respuesta resumida:

```json
{
  "anio": 2026,
  "mes": 4,
  "total_minutos": 120,
  "contenidos": []
}
```

Devuelve los 20 contenidos con mas minutos vistos del mes e incluye desglose por genero. Si no hay datos, devuelve lista vacia y total en 0.
