-- 0. Usuarios (auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('pasajero', 'conductor', 'admin')),
    pasajero_id INTEGER REFERENCES pasajeros(id),
    conductor_id INTEGER REFERENCES conductores(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Catálogo de Tarifas (HU4)
CREATE TABLE tarifas (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(20) NOT NULL UNIQUE CHECK (categoria IN ('economico', 'confort', 'premium')),
    precio_base NUMERIC(10, 2) NOT NULL CHECK (precio_base > 0),
    precio_por_km NUMERIC(10, 2) NOT NULL CHECK (precio_por_km > 0)
);

-- 2. Pasajeros (HU1)
CREATE TABLE pasajeros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL
);

-- 3. Conductores (HU1)
CREATE TABLE conductores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    licencia VARCHAR(50) NOT NULL UNIQUE,
    calificacion_promedio NUMERIC(3, 2) DEFAULT 0 CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5),
    disponible BOOLEAN DEFAULT TRUE
);

-- 4. Vehículos (HU2)
CREATE TABLE vehiculos (
    id SERIAL PRIMARY KEY,
    conductor_id INTEGER NOT NULL REFERENCES conductores(id),
    patente VARCHAR(20) NOT NULL UNIQUE,
    modelo VARCHAR(50) NOT NULL,
    anio INTEGER NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('economico', 'confort', 'premium'))
);

-- 5. Métodos de Pago (HU3)
CREATE TABLE metodos_pago (
    id SERIAL PRIMARY KEY,
    pasajero_id INTEGER NOT NULL REFERENCES pasajeros(id),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('tarjeta_credito', 'tarjeta_debito', 'efectivo', 'billetera_virtual')),
    ultimos_digitos CHAR(4) -- Solo para tarjetas, puede ser NULL en efectivo
);

-- 6. Cupones (HU13)
CREATE TABLE cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    porcentaje_descuento INTEGER NOT NULL CHECK (porcentaje_descuento BETWEEN 1 AND 100),
    fecha_vencimiento DATE NOT NULL
);

-- 7. Multiplicador Horario (HU11)
CREATE TABLE multiplicadores_horario (
    id SERIAL PRIMARY KEY,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_desde TIME NOT NULL,
    hora_hasta TIME NOT NULL,
    factor NUMERIC(3, 2) NOT NULL CHECK (factor > 1),
    CONSTRAINT check_horario_valido CHECK (hora_desde < hora_hasta)
);

-- 8. Viajes (HU5, HU6, HU7, HU11, HU13)
CREATE TABLE viajes (
    id SERIAL PRIMARY KEY,
    pasajero_id INTEGER NOT NULL REFERENCES pasajeros(id),
    conductor_id INTEGER REFERENCES conductores(id), -- NULL inicialmente (HU5)
    vehiculo_id INTEGER REFERENCES vehiculos(id),
    metodo_pago_id INTEGER NOT NULL REFERENCES metodos_pago(id),
    cupon_id INTEGER REFERENCES cupones(id),
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('economico', 'confort', 'premium')),
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    distancia_km NUMERIC(10, 2) NOT NULL CHECK (distancia_km > 0),
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'asignado', 'en_curso', 'finalizado', 'cancelado', 'sin_conductor')),
    tarifa_final NUMERIC(10, 2) NOT NULL, -- Se guarda el cálculo final (HU5)
    multiplicador_aplicado NUMERIC(3, 2) DEFAULT 1.0
);

-- 9. Calificaciones (HU8)
CREATE TABLE calificaciones (
    id SERIAL PRIMARY KEY,
    viaje_id INTEGER NOT NULL UNIQUE REFERENCES viajes(id),
    puntaje_pasajero INTEGER CHECK (puntaje_pasajero BETWEEN 1 AND 5),
    puntaje_conductor INTEGER CHECK (puntaje_conductor BETWEEN 1 AND 5),
    comentario TEXT
);

-- 10. Cargos / Penalidades (HU12)
CREATE TABLE cargos (
    id SERIAL PRIMARY KEY,
    viaje_id INTEGER NOT NULL REFERENCES viajes(id),
    monto NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(100) DEFAULT 'Penalidad por cancelación tardía'
);

-- 11. Tabla pivote para uso de cupones (HU13 - Para que no se repita por pasajero)
CREATE TABLE cupones_usados (
    pasajero_id INTEGER REFERENCES pasajeros(id),
    cupon_id INTEGER REFERENCES cupones(id),
    PRIMARY KEY (pasajero_id, cupon_id)
);