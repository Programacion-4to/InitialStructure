from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from src.config.env import settings


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
    ensure_storage_media_columns()
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


def drop_tables():
    """Elimina todas las tablas. Peligroso: borra datos."""
    Base.metadata.drop_all(bind=engine)
    print("Todas las tablas eliminadas")


def reset_database():
    """Reinicia la BD: elimina y recrea todas las tablas."""
    drop_tables()
    create_tables()
