# Titoflix V2: arranque privado

## Desarrollo local

1. Copiar `.env.example` a `.env` y reemplazar todos los valores `CHANGE_ME`.
2. Levantar el stack con `docker compose up -d --build`.
3. Crear el administrador una sola vez:

```powershell
docker compose exec backend python -m src.scripts.bootstrap_admin --email admin@example.local --password "una-contrasena-larga"
```

4. Abrir `http://localhost:3000`. Mailpit queda disponible sólo localmente en `http://localhost:8025`.

El backend ejecuta `alembic upgrade head` antes de iniciar. En una instalación anterior, la migración establece el baseline sin borrar cuentas, catálogo ni media.

## Límites de exposición

- Sólo `gateway` publica la aplicación en el puerto 3000.
- PostgreSQL y MinIO Console escuchan únicamente en loopback; Redis, MinIO API, backend y worker no publican puertos.
- Las cargas de masters deben hacerse desde la LAN/local, nunca a través de Cloudflare.
- No iniciar el túnel ni asignar `titoflix.watch`. Para una beta futura, crear un `.env.test` con `ENVIRONMENT=test`, `COOKIE_SECURE=true`, SMTP real y `test.titoflix.watch`.

## Recuperación y backup

Antes de actualizar una instalación existente, crear un dump:

```powershell
docker compose exec -T postgres pg_dump -U postgres titoflix > backups/titoflix-YYYYMMDD.sql
```

Copiar también el volumen configurado por `MEDIA_DATA_PATH` a un segundo disco. Un segundo directorio dentro del mismo disco no es un backup.

## Estado de V2

Esta entrega establece migraciones, configuración segura, sesiones con refresh en cookie, verificación/recuperación de email, Redis, worker aislado, gateway privado y reproducción de playlists HLS en el navegador. La conversión asíncrona de las cargas existentes a HLS, la autorización Nginx `X-Accel-Redirect`, monitorización, túnel de test y Android requieren una siguiente entrega y pruebas con la laptop/medios reales.
