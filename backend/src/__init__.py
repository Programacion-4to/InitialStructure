from .app import API_PREFIX, app                                 # Exporta el prefijo de la API y la instancia FastAPI
from .config import settings                                     # Exporta la configuración global cargada

__all__ = [
    "API_PREFIX",                                                # Hace disponible el prefijo de versión
    "app",                                                       # Hace disponible la aplicación principal
    "settings",                                                  # Hace disponible el objeto de configuración
]
