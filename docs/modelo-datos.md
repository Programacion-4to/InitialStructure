# Modelo de Datos - Titoflix

## Diagrama ER Simplificado

Este es el diagrama recomendado para reproducir en draw.io. Cada bloque es una tabla y cada linea indica la cardinalidad principal.

```text
[CUENTA] 1 -------- N [PERFIL]

[CONTENIDO] 1 ----- N [TEMPORADA] 1 ----- N [EPISODIO]

[CONTENIDO] N ----- N [GENERO]
    via tabla puente: CONTENIDO_GENEROS

[PERFIL] N -------- N [CONTENIDO]
    via tabla puente: MI_LISTA

[PERFIL] 1 -------- N [VISTA]
[VISTA] N -------- 0..1 [CONTENIDO]   (si es pelicula)
[VISTA] N -------- 0..1 [EPISODIO]    (si es serie)

[PERFIL] 1 -------- N [CALIFICACION]
[CALIFICACION] N -- 1 [CONTENIDO]

[PERFIL] 1 -------- N [DESCARGA]
[DESCARGA] N ------ 0..1 [CONTENIDO]  (si es pelicula)
[DESCARGA] N ------ 0..1 [EPISODIO]   (si es serie)
```

## Como Dibujarlo En Draw.io

1. Crear una caja por tabla principal: `Cuenta`, `Perfil`, `Contenido`, `Temporada`, `Episodio`, `Genero`, `Vista`, `Calificacion`, `Descarga`.
2. Dibujar las relaciones 1:N con una linea y etiquetas `1` y `N`.
3. Para las relaciones N:M, dibujar `Contenido N:N Genero` y `Perfil N:N Contenido`.
4. Si el profesor pide modelo relacional, agregar las cajas puente `contenido_generos` y `mi_lista`.
5. Para `Vista` y `Descarga`, conectar con `Perfil` y luego con `Contenido` y `Episodio`, aclarando: `contenido_id o episodio_id, no ambos`.

## Campos Principales

```text
CUENTA
- id PK
- email UK
- password_hash
- plan
- is_admin
- fecha_alta

PERFIL
- id PK
- cuenta_id FK
- nombre
- es_infantil
- avatar
- pin
- pin_intentos_fallidos
- pin_bloqueado_hasta

CONTENIDO
- id PK
- titulo
- tipo: pelicula | serie
- anio
- descripcion
- duracion_min
- clasificacion_edad

TEMPORADA
- id PK
- contenido_id FK
- numero
- anio

EPISODIO
- id PK
- temporada_id FK
- numero
- titulo
- duracion_min

GENERO
- id PK
- nombre UK

VISTA
- id PK
- perfil_id FK
- contenido_id FK opcional
- episodio_id FK opcional
- fecha
- segundos_vistos
- terminado

CALIFICACION
- id PK
- perfil_id FK
- contenido_id FK
- puntaje
- fecha

DESCARGA
- id PK
- perfil_id FK
- contenido_id FK opcional
- episodio_id FK opcional
- fecha_descarga
- vence_en
- eliminada
```

## Tablas Puente

Las relaciones N:M se guardan con tablas intermedias:

- `contenido_generos`: `contenido_id FK`, `genero_id FK`.
- `mi_lista`: `perfil_id FK`, `contenido_id FK`, `fecha_agregada`.

## Relaciones Con Recurso Alternativo

`vistas` y `descargas` tienen una regla especial: apuntan a una pelicula (`contenido_id`) o a un episodio (`episodio_id`), pero no a ambos al mismo tiempo.

Constraint usada:

```sql
CHECK (
    (contenido_id IS NOT NULL AND episodio_id IS NULL)
    OR
    (contenido_id IS NULL AND episodio_id IS NOT NULL)
)
```

## Tabla Tecnica Omitida Del Diagrama Simple

El proyecto tambien tiene `video_variants`, usada para guardar variantes de calidad (`FHD`, `QHD`, `4K`) de peliculas o episodios. Se omite del diagrama principal porque es soporte tecnico de streaming y no una entidad central de la consigna.

Si se dibuja, tiene estas relaciones:

```text
[CONTENIDO] 1 ----- N [VIDEO_VARIANT]
[EPISODIO]  1 ----- N [VIDEO_VARIANT]
```

Tambien usa la misma regla de exclusividad: `contenido_id` o `episodio_id`, no ambos.

## Relaciones

- `cuentas 1:N perfiles`
- `contenidos 1:N temporadas`
- `temporadas 1:N episodios`
- `perfiles 1:N vistas`
- `contenidos 0:N vistas` para peliculas; cada vista puede apuntar a 0 o 1 contenido.
- `episodios 0:N vistas` para series; cada vista puede apuntar a 0 o 1 episodio.
- `perfiles 1:N calificaciones`
- `contenidos 1:N calificaciones`
- `contenidos N:M generos` mediante `contenido_generos`
- `perfiles N:M contenidos` mediante `mi_lista`
- `perfiles 1:N descargas`
- `contenidos 0:N descargas` para peliculas; cada descarga puede apuntar a 0 o 1 contenido.
- `episodios 0:N descargas` para series; cada descarga puede apuntar a 0 o 1 episodio.
- `contenidos 0:N video_variants` para peliculas; cada variante puede apuntar a 0 o 1 contenido.
- `episodios 0:N video_variants` para series; cada variante puede apuntar a 0 o 1 episodio.

## Reglas Principales

- Planes validos: `basico`, `estandar`, `premium`.
- Limite de perfiles: `basico=1`, `estandar=2`, `premium=5`.
- Limite de descargas activas por cuenta: `basico=0`, `estandar=10`, `premium=30`.
- Clasificaciones validas: `ATP`, `+13`, `+16`, `+18`.
- Perfiles infantiles solo pueden listar, reproducir, guardar o descargar contenido `ATP`.
- Una vista referencia una pelicula o un episodio, nunca ambos.
- Una descarga referencia una pelicula o un episodio, nunca ambos.
- Un perfil solo puede tener una calificacion por contenido.
