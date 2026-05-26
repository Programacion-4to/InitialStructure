from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from src.config.env import settings
from src.utils.hash import hash_password


engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    """Dependency de FastAPI: abre una sesion por request y la cierra al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Crea todas las tablas en la BD y agrega columnas nuevas en bases existentes."""
    Base.metadata.create_all(bind=engine)
    ensure_account_admin_column()
    ensure_profile_pin_lock_columns()
    ensure_storage_media_columns()
    ensure_asset_media_columns()
    ensure_duration_columns_are_float()
    ensure_video_variant_quality_values()
    ensure_default_admin_account()
    print("Tablas creadas exitosamente")


def ensure_account_admin_column():
    """Agrega is_admin a cuentas si la tabla ya existia antes de este cambio."""
    inspector = inspect(engine)
    if not inspector.has_table("cuentas"):
        return

    column_names = {column["name"] for column in inspector.get_columns("cuentas")}
    if "is_admin" in column_names:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE cuentas ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE")
        )


def ensure_profile_pin_lock_columns():
    """Agrega columnas para limitar intentos de PIN en perfiles existentes."""
    inspector = inspect(engine)
    if not inspector.has_table("perfiles"):
        return

    column_names = {column["name"] for column in inspector.get_columns("perfiles")}
    statements = []
    if "pin_intentos_fallidos" not in column_names:
        statements.append("ALTER TABLE perfiles ADD COLUMN pin_intentos_fallidos INTEGER NOT NULL DEFAULT 0")
    if "pin_bloqueado_hasta" not in column_names:
        statements.append("ALTER TABLE perfiles ADD COLUMN pin_bloqueado_hasta TIMESTAMP")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_storage_media_columns():
    """Agrega columnas de storage si las tablas ya existian."""
    inspector = inspect(engine)
    table_columns = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in ("contenidos", "temporadas", "episodios")
        if inspector.has_table(table_name)
    }

    statements = []
    if "contenidos" in table_columns:
        columns = table_columns["contenidos"]
        if "storage_folder_id" not in columns:
            statements.append("ALTER TABLE contenidos ADD COLUMN storage_folder_id VARCHAR")
        if "video_storage_key" not in columns:
            statements.append("ALTER TABLE contenidos ADD COLUMN video_storage_key VARCHAR")
        if "video_mime" not in columns:
            statements.append("ALTER TABLE contenidos ADD COLUMN video_mime VARCHAR")
        if "video_size" not in columns:
            statements.append("ALTER TABLE contenidos ADD COLUMN video_size BIGINT")

    if "temporadas" in table_columns:
        columns = table_columns["temporadas"]
        if "storage_folder_id" not in columns:
            statements.append("ALTER TABLE temporadas ADD COLUMN storage_folder_id VARCHAR")

    if "episodios" in table_columns:
        columns = table_columns["episodios"]
        if "storage_folder_id" not in columns:
            statements.append("ALTER TABLE episodios ADD COLUMN storage_folder_id VARCHAR")
        if "video_storage_key" not in columns:
            statements.append("ALTER TABLE episodios ADD COLUMN video_storage_key VARCHAR")
        if "video_mime" not in columns:
            statements.append("ALTER TABLE episodios ADD COLUMN video_mime VARCHAR")
        if "video_size" not in columns:
            statements.append("ALTER TABLE episodios ADD COLUMN video_size BIGINT")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_duration_columns_are_float():
    """Permite guardar duraciones autodetectadas con decimales de minuto."""
    if engine.dialect.name != "postgresql":
        return

    inspector = inspect(engine)
    statements = []
    for table_name in ("contenidos", "episodios"):
        if not inspector.has_table(table_name):
            continue

        columns = {
            column["name"]: str(column["type"]).lower()
            for column in inspector.get_columns(table_name)
        }
        column_type = columns.get("duracion_min", "")
        if column_type and "double" not in column_type and "float" not in column_type:
            statements.append(
                f"ALTER TABLE {table_name} "
                "ALTER COLUMN duracion_min TYPE DOUBLE PRECISION "
                "USING duracion_min::double precision"
            )

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_asset_media_columns():
    """Agrega columnas para imagenes de catalogo si la BD ya existia."""
    inspector = inspect(engine)
    statements = []

    if inspector.has_table("contenidos"):
        columns = {column["name"] for column in inspector.get_columns("contenidos")}
        if "portada_url" not in columns:
            statements.append("ALTER TABLE contenidos ADD COLUMN portada_url VARCHAR")

    if inspector.has_table("episodios"):
        columns = {column["name"] for column in inspector.get_columns("episodios")}
        if "thumbnail_url" not in columns:
            statements.append("ALTER TABLE episodios ADD COLUMN thumbnail_url VARCHAR")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_video_variant_quality_values():
    """Alinea las calidades guardadas con las variantes generadas por FFmpeg."""
    inspector = inspect(engine)
    if not inspector.has_table("video_variants"):
        return

    with engine.begin() as connection:
        connection.execute(text("UPDATE video_variants SET quality = 'FHD' WHERE quality = 'HD'"))
        connection.execute(text("UPDATE video_variants SET quality = 'QHD' WHERE quality = '1440p'"))
        if engine.dialect.name != "postgresql":
            return

        connection.execute(text("ALTER TABLE video_variants DROP CONSTRAINT IF EXISTS ck_video_variant_quality"))
        connection.execute(
            text(
                "ALTER TABLE video_variants "
                "ADD CONSTRAINT ck_video_variant_quality "
                "CHECK (quality IN ('FHD', 'QHD', '4K'))"
            )
        )


def ensure_default_admin_account():
    """Crea o actualiza la cuenta admin fija (ID 1) para desarrollo."""
    inspector = inspect(engine)
    if not inspector.has_table("cuentas"):
        return

    password_hash = hash_password(settings.ADMIN_PASSWORD)
    with engine.begin() as connection:
        # Verificar si existe admin con ID 1
        existing = connection.execute(
            text("SELECT id FROM cuentas WHERE id = 1"),
        ).first()

        if existing:
            # Solo actualizar contraseña si cambió
            connection.execute(
                text(
                    "UPDATE cuentas "
                    "SET email = :email, password_hash = :password_hash, plan = :plan, is_admin = TRUE "
                    "WHERE id = 1"
                ),
                {
                    "email": settings.ADMIN_USERNAME,
                    "password_hash": password_hash,
                    "plan": "premium",
                },
            )
            return

        # Si existe con otro ID, eliminarlo
        connection.execute(
            text("DELETE FROM cuentas WHERE email = :email"),
            {"email": settings.ADMIN_USERNAME},
        )

        # Insertar con ID 1 explícitamente
        if engine.dialect.name == "postgresql":
            connection.execute(
                text(
                    "INSERT INTO cuentas (id, email, password_hash, plan, is_admin) "
                    "VALUES (1, :email, :password_hash, :plan, TRUE)"
                ),
                {
                    "email": settings.ADMIN_USERNAME,
                    "password_hash": password_hash,
                    "plan": "premium",
                },
            )
            # Resetear el sequence para que el siguiente insert use ID 2
            connection.execute(
                text("SELECT setval(pg_get_serial_sequence('cuentas', 'id'), 1)")
            )
        else:
            # Para SQLite y otros dialects
            connection.execute(
                text(
                    "INSERT INTO cuentas (id, email, password_hash, plan, is_admin) "
                    "VALUES (1, :email, :password_hash, :plan, TRUE)"
                ),
                {
                    "email": settings.ADMIN_USERNAME,
                    "password_hash": password_hash,
                    "plan": "premium",
                },
            )


def drop_tables():
    """Elimina todas las tablas. Peligroso: borra datos."""
    Base.metadata.drop_all(bind=engine)
    print("Todas las tablas eliminadas")


def reset_database():
    """Reinicia la BD: elimina y recrea todas las tablas."""
    drop_tables()
    create_tables()
