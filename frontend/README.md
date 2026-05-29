# Titoflix Frontend

Frontend de Titoflix hecho con Next.js. Muestra login, seleccion y creacion de perfiles, catalogo, busqueda, Mi Lista, detalle de contenido, reproductor, continuar viendo y consola admin.

## Como correrlo

### Docker, recomendado

Desde la raiz:

```powershell
docker compose up -d --build
```

Solo frontend:

```powershell
docker compose build frontend
docker compose up -d frontend
```

### Sin Docker

Desde `frontend/`:

```powershell
npm install
npm run dev
```

Para desarrollo local sin Docker, asegurarse de que el backend responda en la URL configurada.

## URLs

- Local: `http://localhost:3000`
- LAN: `http://[IP_LOCAL]:3000`
- Tunel Cloudflare: `https://titoflix.watch`

La API se consume por defecto con rutas relativas:

```text
/api/v1
```

Next.js reescribe esas llamadas hacia `INTERNAL_BACKEND_URL`.

## Variables

Configuracion recomendada para Docker y Cloudflare Tunnel:

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_DIRECT_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=
INTERNAL_BACKEND_URL=http://backend:8000
NEXT_PUBLIC_MAX_UPLOAD_SIZE=10485760
```

Significado:

- `NEXT_PUBLIC_API_URL`: base usada por el navegador para API normal.
- `NEXT_PUBLIC_DIRECT_API_URL`: base alternativa para uploads grandes si se necesita evitar el proxy.
- `NEXT_PUBLIC_BACKEND_URL`: prefijo para `stream_url`; vacio significa usar el mismo host.
- `INTERNAL_BACKEND_URL`: destino interno del rewrite de Next.js.
- `NEXT_PUBLIC_MAX_UPLOAD_SIZE`: limite cliente para imagenes/JSON; los videos no usan este limite.

Para probar desde otro dispositivo sin proxy:

```env
NEXT_PUBLIC_API_URL=http://[IP_LOCAL]:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://[IP_LOCAL]:8000
```

## Funcionalidad

- Registro con seleccion de plan.
- Login normal y acceso admin.
- Perfiles con avatar, PIN y selector Adulto/Infantil.
- Menu de perfiles con cambio de perfil, ajustes y mejora de plan.
- Busqueda y filtros por texto, genero, tipo y orden.
- Catalogo separado en inicio, peliculas, series y Mi Lista.
- Detalle de contenido con calidad disponible segun plan.
- Reproducir, continuar y reproducir desde cero.
- Reproductor con reporte de progreso cada pocos segundos.
- Calificacion y eliminacion de calificacion.
- Consola admin para catalogo, reportes y permisos admin del admin principal.

## Consola admin

La ruta `/admin` solo permite cuentas con `is_admin=true`.

El admin principal hardcodeado es la cuenta ID `1`. Solo esa cuenta ve la pestaña `Permisos`, donde puede activar o quitar permisos admin a otras cuentas. No puede quitarse admin a si misma.

## Streaming

El frontend pide `/playback` al backend, recibe un `stream_url` con token temporal y lo pasa al reproductor.

Si `NEXT_PUBLIC_BACKEND_URL` esta vacio, el stream queda en el mismo dominio:

```text
/api/v1/contenidos/{id}/stream?token=...&quality=...
```

Esto funciona con Docker y Cloudflare porque el frontend proxyea `/api/v1`.

## MinIO

El frontend no accede directo a MinIO. Las imagenes y videos pasan por el backend:

- Portadas, miniaturas y avatars: `/api/v1/assets/...`
- Videos: `/api/v1/.../stream`

MinIO Console queda para administracion en `http://localhost:9001`.

## Documentacion relacionada

- General: `../README.md`
- Docker: `../DOCKER.md`
- Backend: `../backend/README.md`
- Modelo de datos: `../docs/modelo-datos.md`
