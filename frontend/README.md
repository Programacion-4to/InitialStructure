# Titoflix Frontend

Frontend de Titoflix hecho con Next.js. Consume la API REST del backend y muestra login, perfiles, catalogo, reproduccion, Mi Lista, recomendaciones y consola admin.

## Como correrlo

### Con Docker, recomendado

Desde la raiz del proyecto:

```powershell
docker compose up -d --build frontend
```

En la practica conviene levantar todo el stack:

```powershell
docker compose up -d --build
```

### Sin Docker

Desde `frontend/`:

```powershell
npm install
npm run dev
```

## URLs

Misma maquina:

- Frontend: `http://localhost:3000`

Desde otro dispositivo de la red:

- Frontend: `http://[IP_LOCAL]:3000`

Con tunel publico apuntando al frontend:

- Frontend: `[URL_DE_TUNEL]`
- API: `[URL_DE_TUNEL]/api/v1`

## Variables importantes

El frontend usa estas variables en Docker/build:

- `NEXT_PUBLIC_API_URL`: URL base usada por el navegador para llamar a la API.
- `NEXT_PUBLIC_DIRECT_API_URL`: URL alternativa para llamadas directas si se necesita.
- `NEXT_PUBLIC_BACKEND_URL`: prefijo para URLs de streaming devueltas por el backend.
- `INTERNAL_BACKEND_URL`: URL interna usada por Next.js cuando hace proxy desde el contenedor.

Configuracion recomendada para Docker/local:

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_DIRECT_API_URL=/api/v1
NEXT_PUBLIC_BACKEND_URL=
INTERNAL_BACKEND_URL=http://backend:8000
```

Si se prueba desde otro dispositivo con frontend directo por IP y sin proxy, puede usarse:

```env
NEXT_PUBLIC_API_URL=http://[IP_LOCAL]:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://[IP_LOCAL]:8000
```

Si se usa tunel, reemplazar por:

```env
NEXT_PUBLIC_API_URL=[URL_DE_TUNEL]/api/v1
NEXT_PUBLIC_BACKEND_URL=[URL_DE_TUNEL]
```

## MinIO

El usuario del frontend no deberia hablar directo con MinIO. La app pide assets y videos al backend, y el backend lee/escribe en MinIO por la red interna de Docker.

La consola de MinIO queda para administracion:

- Host local: `http://localhost:9001`
- LAN: `http://[IP_LOCAL]:9001`

No conviene exponer MinIO por tunel salvo que sea una decision explicita de administracion.

## Documentacion del proyecto

- README general: `../README.md`
- Backend: `../backend/README.md`
- Modelo de datos / diagrama ER: `../docs/modelo-datos.md`
