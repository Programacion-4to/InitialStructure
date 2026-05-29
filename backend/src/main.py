from pathlib import Path                                         # Importa utilidades para rutas de archivos
import sys                                                       # Importa utilidades del sistema

import uvicorn                                                   # Importa el servidor ASGI uvicorn

if __package__ is None or __package__ == "":                     # Verifica si el script se ejecuta como módulo
    sys.path.append(str(Path(__file__).resolve().parent.parent)) # Agrega la raíz del proyecto al path de Python

from src.config import settings                                  # Importa la configuración global del sistema

if __name__ == "__main__":                                       # Punto de entrada principal del script
    uvicorn.run(                                                 # Inicia la ejecución del servidor
        "src.app:app",                                           # Indica la ubicación de la instancia FastAPI
        host=settings.HOST,                                      # Define la dirección de host (ej. 0.0.0.0)
        port=settings.PORT,                                      # Define el puerto de escucha (ej. 8000)
        reload=settings.ENVIRONMENT == "development",            # Habilita autoreload solo en desarrollo
    )