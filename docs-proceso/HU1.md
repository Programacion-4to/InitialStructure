# HU1 — Alta de pasajeros y conductores

> Como administrador, quiero registrar pasajeros y conductores.

## Criterios cubiertos

- [x] El email del pasajero es único (validado en service → `ConflictError 409`).
- [x] La licencia del conductor es única (validado en service → `ConflictError 409`).
- [x] El conductor arranca con `calificacion_promedio = 0` y `disponible = true` (forzado en repository).

## Backend

- **`backend/src/db/models/conductores_model.py`**
  - Líneas: 1 ~ 14
  - Agrego la columna `disponible` (Boolean, default `True`) y default `0.0` en `calificacion_promedio`, para que el conductor arranque "vacío" según el criterio de la HU.

- **`backend/src/dtos/conductores_dto.py`**
  - Líneas: 1 ~ 31
  - Saco `calificacion_promedio` del DTO de creación (lo fija el sistema, no el cliente). Sumo `disponible` al `UpdateConductoresDTO` y al `ConductoresResponseDTO`.

- **`backend/src/schemas/conductores_schema.py`**
  - Líneas: 1 ~ 21
  - `CreateConductoresSchema` ya no pide `calificacion_promedio`. `UpdateConductoresSchema` acepta `disponible` para los flujos posteriores.

- **`backend/src/repositories/conductores_repository.py`**
  - Líneas: 1 ~ 36
  - `create` fuerza `calificacion_promedio=0.0` y `disponible=True`. Agrego `get_by_licencia` para chequear unicidad desde el service.

- **`backend/src/services/conductores_service.py`**
  - Líneas: 1 ~ 51
  - `create` valida licencia única antes de insertar y lanza `ConflictError`. `update` revalida si se cambia la licencia.

- **`backend/src/routers/conductores_router.py`**
  - Líneas: 1 ~ 40
  - `POST /conductores` recibe sólo `nombre` y `licencia`. `PUT` usa `UpdateConductoresSchema` (parcial, permite togglear `disponible`).

- **`backend/src/repositories/pasajero_repository.py`**
  - Líneas: 1 ~ 31
  - Sumo `get_by_email` para que el service pueda validar unicidad del email.

- **`backend/src/services/pasajero_service.py`**
  - Líneas: 1 ~ 52
  - `create` valida email único antes de insertar y lanza `ConflictError`. `update` revalida si se cambia el email.

## Frontend

Sin cambios en esta HU (el frontend todavía está en placeholder). Cuando esté armado se conectan los `POST /pasajeros` y `POST /conductores` desde la pantalla de alta del admin.
