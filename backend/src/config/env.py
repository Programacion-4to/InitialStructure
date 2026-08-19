from pydantic_settings import BaseSettings


class Settings(BaseSettings):
<<<<<<< Updated upstream
    DATABASE_URL: str
    PORT: int = 8000
    JWT_SECRET: str
=======
    APP_NAME: str = "Titoflix API"              # Nombre de la aplicación
    ENVIRONMENT: str = "development"
>>>>>>> Stashed changes

    class Config:
        env_file = ".env"


<<<<<<< Updated upstream
settings = Settings()
=======
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"                # Algoritmo de encriptación para JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REFRESH_COOKIE_NAME: str = "titoflix_refresh"
    COOKIE_SECURE: bool = False
    REDIS_URL: str = "redis://redis:6379/0"
    MAX_UPLOAD_SIZE_BYTES: int = 20 * 1024 * 1024 * 1024
    MEDIA_TOKEN_TTL_MINUTES: int = 20
    MAIL_FROM: str = "Titoflix <noreply@localhost>"
    SMTP_HOST: str = "mailpit"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = False
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_PUBLIC_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "titoflix"
    S3_SECRET_KEY: str = "titoflix-secret"
    S3_BUCKET_NAME: str = "titoflix-media"
    S3_REGION: str = "us-east-1"
    S3_MEDIA_PREFIX: str = "media"
    S3_ASSETS_PREFIX: str = "assets"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",                         # Ignora variables extra no definidas en la clase
    )

#JWT significa JSON Web Token. Es una forma de identificar usuarios de manera segura en aplicaciones

settings = Settings()                           # Crea una instancia con todas las configuraciones cargadas


def validate_runtime_settings() -> None:
    """Fail closed outside local development when required secrets are missing."""
    insecure = {"", "cambiame-en-produccion", "change-me", "admin1234"}
    if settings.ENVIRONMENT != "development" and settings.JWT_SECRET in insecure:
        raise RuntimeError("JWT_SECRET debe configurarse fuera de development")
    if settings.ENVIRONMENT != "development" and settings.COOKIE_SECURE is False:
        raise RuntimeError("COOKIE_SECURE debe ser true fuera de development")
>>>>>>> Stashed changes
