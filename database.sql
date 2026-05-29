CREATE TABLE cuentas (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    plan VARCHAR NOT NULL CHECK (plan IN ('basico', 'estandar', 'premium')),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE perfiles (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
    nombre VARCHAR NOT NULL,
    pin VARCHAR,
    pin_intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    pin_bloqueado_hasta TIMESTAMP,
    es_infantil BOOLEAN DEFAULT FALSE,
    avatar VARCHAR,
    CONSTRAINT uq_perfil_nombre_por_cuenta UNIQUE (cuenta_id, nombre)
);

CREATE TABLE generos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR UNIQUE NOT NULL
);

CREATE TABLE contenidos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR NOT NULL,
    tipo VARCHAR NOT NULL CHECK (tipo IN ('pelicula', 'serie')),
    anio INTEGER NOT NULL,
    descripcion VARCHAR,
    duracion_min DOUBLE PRECISION,
    clasificacion_edad VARCHAR NOT NULL CHECK (clasificacion_edad IN ('ATP', '+13', '+16', '+18')),
    storage_folder_id VARCHAR,
    video_storage_key VARCHAR,
    video_mime VARCHAR,
    video_size BIGINT,
    portada_url VARCHAR
);

CREATE TABLE contenido_generos (
    contenido_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE CASCADE,
    PRIMARY KEY (contenido_id, genero_id)
);

CREATE TABLE temporadas (
    id SERIAL PRIMARY KEY,
    contenido_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    storage_folder_id VARCHAR,
    CONSTRAINT uq_temporada_numero_por_contenido UNIQUE (contenido_id, numero)
);

CREATE TABLE episodios (
    id SERIAL PRIMARY KEY,
    temporada_id INTEGER NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    titulo VARCHAR NOT NULL,
    duracion_min DOUBLE PRECISION NOT NULL,
    storage_folder_id VARCHAR,
    video_storage_key VARCHAR,
    video_mime VARCHAR,
    video_size BIGINT,
    thumbnail_url VARCHAR,
    CONSTRAINT uq_episodio_numero_por_temporada UNIQUE (temporada_id, numero)
);

CREATE TABLE video_variants (
    id SERIAL PRIMARY KEY,
    contenido_id INTEGER REFERENCES contenidos(id) ON DELETE CASCADE,
    episodio_id INTEGER REFERENCES episodios(id) ON DELETE CASCADE,
    quality VARCHAR NOT NULL CHECK (quality IN ('FHD', 'QHD', '4K')),
    video_storage_key VARCHAR NOT NULL,
    video_mime VARCHAR,
    video_size BIGINT,
    CONSTRAINT ck_video_variant_un_solo_recurso CHECK (
        (contenido_id IS NOT NULL AND episodio_id IS NULL)
        OR (contenido_id IS NULL AND episodio_id IS NOT NULL)
    ),
    CONSTRAINT uq_video_variant_contenido_quality UNIQUE (contenido_id, quality),
    CONSTRAINT uq_video_variant_episodio_quality UNIQUE (episodio_id, quality)
);

CREATE TABLE vistas (
    id SERIAL PRIMARY KEY,
    perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    episodio_id INTEGER REFERENCES episodios(id) ON DELETE CASCADE,
    contenido_id INTEGER REFERENCES contenidos(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    segundos_vistos INTEGER DEFAULT 0,
    terminado BOOLEAN DEFAULT FALSE,
    CONSTRAINT ck_vista_un_solo_recurso CHECK (
        (episodio_id IS NOT NULL AND contenido_id IS NULL)
        OR (episodio_id IS NULL AND contenido_id IS NOT NULL)
    ),
    CONSTRAINT uq_vista_perfil_episodio UNIQUE (perfil_id, episodio_id),
    CONSTRAINT uq_vista_perfil_contenido UNIQUE (perfil_id, contenido_id)
);

CREATE TABLE calificaciones (
    id SERIAL PRIMARY KEY,
    perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    contenido_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    puntaje INTEGER NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_calificacion_perfil_contenido UNIQUE (perfil_id, contenido_id)
);

CREATE TABLE mi_lista (
    perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    contenido_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    fecha_agregada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (perfil_id, contenido_id)
);

CREATE TABLE descargas (
    id SERIAL PRIMARY KEY,
    perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    episodio_id INTEGER REFERENCES episodios(id) ON DELETE CASCADE,
    contenido_id INTEGER REFERENCES contenidos(id) ON DELETE CASCADE,
    fecha_descarga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vence_en TIMESTAMP NOT NULL,
    eliminada BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_descarga_un_solo_recurso CHECK (
        (episodio_id IS NOT NULL AND contenido_id IS NULL)
        OR (episodio_id IS NULL AND contenido_id IS NOT NULL)
    )
);

INSERT INTO cuentas (email, password_hash, plan, is_admin) VALUES
('admin@titoflix.local', 'hash-admin', 'premium', TRUE),
('ana@mail.com', 'hash-ana', 'premium', FALSE),
('bruno@mail.com', 'hash-bruno', 'estandar', FALSE),
('carla@mail.com', 'hash-carla', 'basico', FALSE),
('diego@mail.com', 'hash-diego', 'premium', FALSE);

INSERT INTO perfiles (cuenta_id, nombre, es_infantil) VALUES
(2, 'Ana', FALSE),
(2, 'Juan', FALSE),
(2, 'Peques', TRUE),
(3, 'Bruno', FALSE),
(3, 'Sofia', TRUE),
(4, 'Carla', FALSE),
(5, 'Diego', FALSE);

INSERT INTO generos (nombre) VALUES
('accion'),
('drama'),
('comedia'),
('documental'),
('infantil');

INSERT INTO contenidos (titulo, tipo, anio, descripcion, duracion_min, clasificacion_edad) VALUES
('Mision Sur', 'pelicula', 2025, 'Pelicula de accion.', 110, '+13'),
('Risas en Casa', 'pelicula', 2024, 'Comedia familiar.', 95, 'ATP'),
('Planeta Azul', 'serie', 2026, 'Serie documental.', NULL, 'ATP'),
('La Ciudad', 'serie', 2023, 'Drama urbano.', NULL, '+16'),
('Aventuras Mini', 'serie', 2022, 'Serie infantil.', NULL, 'ATP');

INSERT INTO contenido_generos (contenido_id, genero_id) VALUES
(1, 1), (1, 2) -- Mision Sur: accion, drama
(2, 3), (2, 5) -- Risas en Casa: comedia, infantil
(3, 4), (3, 5) -- Planeta Azul: documental, infantil
(4, 1), (4, 2) -- La Ciudad: accion, drama
(5, 3), (5, 5) -- Aventuras Mini: comedia, infantil;

INSERT INTO temporadas (contenido_id, numero, anio) VALUES
(3, 1, 2026),
(3, 2, 2026),
(4, 1, 2023),
(5, 1, 2022),
(5, 2, 2023);

INSERT INTO episodios (temporada_id, numero, titulo, duracion_min) VALUES
(1, 1, 'Oceanos', 45),
(1, 2, 'Bosques', 44),
(3, 1, 'Piloto', 50),
(4, 1, 'El mapa', 22),
(5, 1, 'La carrera', 24);

INSERT INTO video_variants (contenido_id, quality, video_storage_key, video_mime, video_size) VALUES
(1, 'FHD', 'media/contenidos/1/fhd.mp4', 'video/mp4', 1000000),
(2, 'FHD', 'media/contenidos/2/fhd.mp4', 'video/mp4', 900000),
(1, 'QHD', 'media/contenidos/1/qhd.mp4', 'video/mp4', 1500000);

INSERT INTO video_variants (episodio_id, quality, video_storage_key, video_mime, video_size) VALUES
(1, 'FHD', 'media/episodios/1/fhd.mp4', 'video/mp4', 500000),
(3, 'FHD', 'media/episodios/3/fhd.mp4', 'video/mp4', 600000);

INSERT INTO vistas (perfil_id, contenido_id, segundos_vistos, terminado) VALUES
(1, 1, 6600, TRUE),
(2, 2, 1200, FALSE),
(3, 1, 6200, TRUE),
(4, 2, 5700, TRUE),
(5, 2, 800, FALSE);

INSERT INTO vistas (perfil_id, episodio_id, segundos_vistos, terminado) VALUES
(1, 1, 2700, TRUE),
(1, 2, 600, FALSE),
(2, 4, 1320, TRUE),
(3, 3, 3000, TRUE),
(5, 5, 400, FALSE);

INSERT INTO calificaciones (perfil_id, contenido_id, puntaje) VALUES
(1, 1, 5),
(2, 2, 4),
(3, 1, 4),
(4, 2, 5),
(5, 2, 3);

INSERT INTO mi_lista (perfil_id, contenido_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(3, 4),
(5, 5);

INSERT INTO descargas (perfil_id, contenido_id, vence_en) VALUES
(1, 1, CURRENT_TIMESTAMP + INTERVAL '30 days'),
(2, 2, CURRENT_TIMESTAMP + INTERVAL '30 days'),
(3, 1, CURRENT_TIMESTAMP + INTERVAL '30 days'),
(4, 2, CURRENT_TIMESTAMP + INTERVAL '30 days'),
(5, 2, CURRENT_TIMESTAMP + INTERVAL '30 days');
