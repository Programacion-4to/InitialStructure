from src.db.models.user_model import Cuenta, Perfil          # Modelos de usuario
from src.db.models.product_model import (                    # Modelos de producto
    Calificacion,                                            # Modelo de calificación
    Contenido,                                               # Modelo de contenido
    Episodio,                                                # Modelo de episodio
    Genero,                                                  # Modelo de género
    Temporada,                                               # Modelo de temporada
    Vista,                                                   # Modelo de vista
    contenido_generos,                                       # Tabla relacional contenido-género
    mi_lista,                                                # Tabla relacional perfil-contenido
)

__all__ = [
    "Cuenta",                                                # Exporta modelo Cuenta
    "Perfil",                                                # Exporta modelo Perfil
    "Genero",                                                # Exporta modelo Género
    "Contenido",                                             # Exporta modelo Contenido
    "Temporada",                                             # Exporta modelo Temporada
    "Episodio",                                              # Exporta modelo Episodio
    "Vista",                                                 # Exporta modelo Vista
    "Calificacion",                                          # Exporta modelo Calificación
    "contenido_generos",                                     # Exporta tabla relacional
    "mi_lista",                                              # Exporta tabla relacional
]
