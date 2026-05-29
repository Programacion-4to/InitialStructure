from .product_mapper import (
    to_calificacion_response,        # Mapper para Calificación individual
    to_calificacion_response_list,   # Mapper para lista de Calificaciones
    to_contenido_response,           # Mapper para Contenido individual
    to_contenido_response_list,      # Mapper para lista de Contenidos
    to_descarga_response,
    to_descarga_response_list,
    to_episodio_response,            # Mapper para Episodio individual
    to_episodio_response_list,       # Mapper para lista de Episodios
    to_genero_response,              # Mapper para Género individual
    to_genero_response_list,         # Mapper para lista de Géneros
    to_product_response,             # Mapper para Producto (alias) individual
    to_product_response_list,        # Mapper para lista de Productos
    to_temporada_response,           # Mapper para Temporada individual
    to_temporada_response_list,      # Mapper para lista de Temporadas
    to_vista_response,               # Mapper para Vista individual
    to_vista_response_list,          # Mapper para lista de Vistas
)
from .user_mapper import (
    to_cuenta_response,              # Mapper para Cuenta individual
    to_cuenta_response_list,         # Mapper para lista de Cuentas
    to_perfil_response,              # Mapper para Perfil individual
    to_perfil_response_list,         # Mapper para lista de Perfiles
)

__all__ = [
    "to_cuenta_response",            # Exporta mapper de Cuenta
    "to_cuenta_response_list",       # Exporta lista de Cuentas
    "to_perfil_response",            # Exporta mapper de Perfil
    "to_perfil_response_list",       # Exporta lista de Perfiles
    "to_genero_response",            # Exporta mapper de Género
    "to_genero_response_list",       # Exporta lista de Géneros
    "to_contenido_response",         # Exporta mapper de Contenido
    "to_contenido_response_list",    # Exporta lista de Contenidos
    "to_descarga_response",
    "to_descarga_response_list",
    "to_product_response",           # Exporta mapper de Producto
    "to_product_response_list",      # Exporta lista de Productos
    "to_temporada_response",         # Exporta mapper de Temporada
    "to_temporada_response_list",    # Exporta lista de Temporadas
    "to_episodio_response",          # Exporta mapper de Episodio
    "to_episodio_response_list",     # Exporta lista de Episodios
    "to_vista_response",             # Exporta mapper de Vista
    "to_vista_response_list",        # Exporta lista de Vistas
    "to_calificacion_response",      # Exporta mapper de Calificación
    "to_calificacion_response_list", # Exporta lista de Calificaciones
]
