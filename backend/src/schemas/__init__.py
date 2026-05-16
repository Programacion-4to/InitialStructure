from .auth_schema import LoginSchema, PerfilAuthResponseSchema, PerfilAuthSchema, PinSchema, TokenSchema # Esquemas de autenticación
from .product_schema import (                                    # Esquemas de catálogo y productos
    CalificacionSchema,                                          # Esquema de respuesta calificación
    ContenidoSchema,                                             # Esquema de respuesta contenido
    CreateCalificacionSchema,                                    # Esquema para crear calificación
    CreateContenidoSchema,                                       # Esquema para crear contenido
    CreateEpisodioSchema,                                        # Esquema para crear episodio
    CreateTemporadaSchema,                                       # Esquema para crear temporada
    CreateVistaSchema,                                           # Esquema para crear vista
    GeneroSchema,                                                # Esquema de género
    MiListaSchema,                                               # Esquema de favoritos
    UpdateContenidoSchema,                                       # Esquema para actualizar contenido
    VistaSchema,                                                 # Esquema de historial de vista
)
from .user_schema import (                                       # Esquemas de gestión de usuarios
    CreateCuentaSchema,                                          # Esquema para registro de cuenta
    CreatePerfilSchema,                                          # Esquema para crear perfil
    CuentaSchema,                                                # Esquema de datos de cuenta
    PerfilSchema,                                                # Esquema de datos de perfil
    UpdateCuentaSchema,                                          # Esquema para editar cuenta
    UpdatePerfilSchema,                                          # Esquema para editar perfil
)

__all__ = [                                                      # Define la interfaz pública del paquete
    "LoginSchema",                                               # Exporta esquema login
    "PinSchema",                                                 # Exporta esquema de validación PIN
    "PerfilAuthSchema",                                          # Exporta esquema auth de perfil
    "PerfilAuthResponseSchema",                                  # Exporta respuesta auth de perfil
    "TokenSchema",                                               # Exporta esquema de respuesta JWT
    "CreateCuentaSchema",                                        # Exporta esquema registro
    "UpdateCuentaSchema",                                        # Exporta esquema edición cuenta
    "CuentaSchema",                                              # Exporta esquema visualización cuenta
    "CreatePerfilSchema",                                        # Exporta esquema creación perfil
    "UpdatePerfilSchema",                                        # Exporta esquema edición perfil
    "PerfilSchema",                                              # Exporta esquema visualización perfil
    "GeneroSchema",                                              # Exporta esquema de géneros
    "CreateContenidoSchema",                                     # Exporta esquema creación contenido
    "UpdateContenidoSchema",                                     # Exporta esquema edición contenido
    "ContenidoSchema",                                           # Exporta esquema visualización contenido
    "CreateTemporadaSchema",                                     # Exporta esquema creación temporada
    "CreateEpisodioSchema",                                      # Exporta esquema creación episodio
    "CreateVistaSchema",                                         # Exporta esquema registro visualización
    "VistaSchema",                                               # Exporta esquema estado visualización
    "CreateCalificacionSchema",                                  # Exporta esquema creación calificación
    "CalificacionSchema",                                        # Exporta esquema visualización calificación
    "MiListaSchema",                                             # Exporta esquema gestión favoritos
]
