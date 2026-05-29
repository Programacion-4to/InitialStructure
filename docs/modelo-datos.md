# Modelo de Datos - Titoflix

Este documento resume el modelo relacional usado por el backend SQLAlchemy y el script `database.sql`.

## Diagrama ER Simplificado

```text
[CUENTA] 1 -------- N [PERFIL]

[CONTENIDO] 1 ----- N [TEMPORADA] 1 ----- N [EPISODIO]

[CONTENIDO] N ----- N [GENERO]
    via [CONTENIDO_GENEROS]

[PERFIL] N -------- N [CONTENIDO]
    via [MI_LISTA]

[PERFIL] 1 -------- N [VISTA]
[VISTA] N -------- 0..1 [CONTENIDO]   (pelicula)
[VISTA] N -------- 0..1 [EPISODIO]    (serie)

[PERFIL] 1 -------- N [CALIFICACION]
[CALIFICACION] N -- 1 [CONTENIDO]

[PERFIL] 1 -------- N [DESCARGA]
[DESCARGA] N ------ 0..1 [CONTENIDO]  (pelicula)
[DESCARGA] N ------ 0..1 [EPISODIO]   (serie)

[CONTENIDO] 1 ----- N [VIDEO_VARIANT]
[EPISODIO]  1 ----- N [VIDEO_VARIANT]
```

## Tablas Principales

### cuentas

```text
id PK
email UK
password_hash
plan
is_admin
fecha_alta
```

Reglas:

- `plan` debe ser `basico`, `estandar` o `premium`.
- la cuenta admin principal se mantiene con ID `1`.
- solo el admin principal puede cambiar permisos admin de otras cuentas.

### perfiles

```text
id PK
cuenta_id FK -> cuentas.id
nombre
pin
pin_intentos_fallidos
pin_bloqueado_hasta
es_infantil
avatar
```

Reglas:

- `nombre` es unico por cuenta.
- `pin` es opcional y se guarda hasheado.
- tras 3 intentos fallidos de PIN, el perfil se bloquea 15 minutos.
- `es_infantil=true` limita el acceso a contenido `ATP`.
- `avatar` guarda una key de MinIO o URL/data URL durante el flujo de carga.

### contenidos

```text
id PK
titulo
tipo
anio
descripcion
duracion_min
clasificacion_edad
storage_folder_id
video_storage_key
video_mime
video_size
portada_url
```

Reglas:

- `tipo` debe ser `pelicula` o `serie`.
- una pelicula debe tener video y duracion directa.
- una serie no lleva video directo; sus videos estan en episodios.
- `clasificacion_edad` usa `ATP`, `+13`, `+16`, `+18`.
- `portada_url` apunta a un asset de MinIO.

### temporadas

```text
id PK
contenido_id FK -> contenidos.id
numero
anio
storage_folder_id
```

Reglas:

- pertenecen a contenidos de tipo `serie`.
- `numero` es unico por serie.

### episodios

```text
id PK
temporada_id FK -> temporadas.id
numero
titulo
duracion_min
storage_folder_id
video_storage_key
video_mime
video_size
thumbnail_url
```

Reglas:

- pertenecen a una temporada.
- `numero` es unico por temporada.
- el video se carga en el episodio.
- `thumbnail_url` se genera desde el video cuando hay thumbnail disponible.

### generos

```text
id PK
nombre UK
```

### video_variants

```text
id PK
contenido_id FK opcional -> contenidos.id
episodio_id FK opcional -> episodios.id
quality
video_storage_key
video_mime
video_size
```

Reglas:

- `quality` debe ser `FHD`, `QHD` o `4K`.
- referencia un contenido o un episodio, nunca ambos.
- una pelicula/episodio puede tener una variante por calidad.
- se generan con FFmpeg al subir video.

### vistas

```text
id PK
perfil_id FK -> perfiles.id
contenido_id FK opcional -> contenidos.id
episodio_id FK opcional -> episodios.id
fecha
segundos_vistos
terminado
```

Reglas:

- referencia una pelicula (`contenido_id`) o un episodio (`episodio_id`), nunca ambos.
- hay una vista por perfil/contenido o por perfil/episodio.
- se marca `terminado` al llegar al 90% de duracion.
- el repositorio hace upsert y tolera reportes simultaneos del reproductor.

### calificaciones

```text
id PK
perfil_id FK -> perfiles.id
contenido_id FK -> contenidos.id
puntaje
fecha
```

Reglas:

- `puntaje` va de 1 a 5.
- un perfil tiene una sola calificacion por contenido.
- solo se puede calificar contenido empezado.
- la calificacion se puede eliminar.

### descargas

```text
id PK
perfil_id FK -> perfiles.id
contenido_id FK opcional -> contenidos.id
episodio_id FK opcional -> episodios.id
fecha_descarga
vence_en
eliminada
```

Reglas:

- referencia una pelicula o un episodio, nunca ambos.
- vence a los 30 dias.
- las descargas vencidas o eliminadas no cuentan para el limite del plan.

## Tablas Puente

### contenido_generos

```text
contenido_id FK -> contenidos.id
genero_id FK -> generos.id
PK (contenido_id, genero_id)
```

### mi_lista

```text
perfil_id FK -> perfiles.id
contenido_id FK -> contenidos.id
fecha_agregada
PK (perfil_id, contenido_id)
```

Reglas:

- una entrada no se duplica para el mismo perfil/contenido.
- perfiles infantiles solo pueden agregar/ver contenido `ATP`.

## Constraints De Recurso Alternativo

`vistas`, `descargas` y `video_variants` usan una regla de exclusividad:

```sql
CHECK (
    (contenido_id IS NOT NULL AND episodio_id IS NULL)
    OR
    (contenido_id IS NULL AND episodio_id IS NOT NULL)
)
```

En `video_variants` la idea es equivalente: `contenido_id` o `episodio_id`, no ambos.

## Reglas De Negocio

Planes:

```text
basico   -> 1 perfil, calidad FHD, 0 descargas activas
estandar -> 2 perfiles, calidad QHD, 10 descargas activas
premium  -> 5 perfiles, calidad 4K, 30 descargas activas
```

Restricciones:

- perfiles infantiles solo acceden a contenido `ATP`;
- una pelicula debe tener video directo;
- una serie debe tener al menos una temporada y cada temporada publicada debe tener episodios;
- el playback valida perfil, plan y calidad;
- los tokens de stream son temporales y atan recurso, accion y calidad;
- el admin principal ID `1` no puede perder permisos admin ni eliminarse.

## Como Dibujarlo En Draw.io

1. Crear cajas para: `cuentas`, `perfiles`, `contenidos`, `temporadas`, `episodios`, `generos`, `video_variants`, `vistas`, `calificaciones`, `descargas`.
2. Agregar cajas puente: `contenido_generos` y `mi_lista`.
3. Dibujar relaciones 1:N y N:M segun el diagrama simplificado.
4. En `vistas`, `descargas` y `video_variants`, marcar que el recurso puede ser contenido o episodio, pero no ambos.
5. Agregar notas de plan/calidad y perfil infantil si se necesita explicar reglas de negocio.

## Archivos Relacionados

- SQL base: `../database.sql`
- Modelos SQLAlchemy: `../backend/src/db/models/`
- Repositorios: `../backend/src/repositories/`
- Servicios de negocio: `../backend/src/services/`
