from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict  # Herramientas para manejar variables de entorno


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    APP_NAME: str = "Titoflix API"              # Nombre de la aplicación
    ENVIRONMENT: str = "development"            # Entorno (development, production, etc.)

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/titoflix"  # URL de conexión

    HOST: str = "127.0.0.1"                  # Host local donde escucha Uvicorn
    PORT: int = 8000                         # Puerto donde corre la app

    JWT_SECRET: str = "cambiame-en-produccion"   # Clave secreta para firmar tokens JWT
    JWT_ALGORITHM: str = "HS256"                # Algoritmo de encriptación para JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60       # Tiempo de expiración del token (en minutos)
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_PUBLIC_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "titoflix"
    S3_SECRET_KEY: str = "titoflix-secret"
    S3_BUCKET_NAME: str = "titoflix-media"
    S3_REGION: str = "us-east-1"
    S3_MEDIA_PREFIX: str = "media"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",                         # Ignora variables extra no definidas en la clase
    )

#JWT significa JSON Web Token. Es una forma de identificar usuarios de manera segura en aplicaciones

settings = Settings()                           # Crea una instancia con todas las configuraciones cargadas
