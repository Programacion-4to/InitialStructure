from src.services.auth_service import AuthService             # Servicio de autenticación
from src.services.product_service import (                    # Servicios de productos
    CalificacionService,                                      # Servicio de calificaciones
    ContenidoService,                                         # Servicio de contenidos
    DescargaService,
    EpisodioService,                                          # Servicio de episodios
    GeneroService,                                            # Servicio de géneros
    MiListaService,                                           # Servicio de "Mi lista"
    ReporteService,
    TemporadaService,                                         # Servicio de temporadas
    VistaService,                                             # Servicio de historial de vistas
)
from src.services.user_service import (                       # Servicios de usuario
    CuentaService,                                            # Servicio de cuentas
    PerfilService,                                            # Servicio de perfiles
)

__all__ = [
    "AuthService",                                            # Exporta servicio de autenticación
    "CuentaService",                                          # Exporta servicio de cuentas
    "PerfilService",                                          # Exporta servicio de perfiles
    "GeneroService",                                          # Exporta servicio de géneros
    "ContenidoService",                                       # Exporta servicio de contenidos
    "DescargaService",
    "TemporadaService",                                       # Exporta servicio de temporadas
    "EpisodioService",                                        # Exporta servicio de episodios
    "VistaService",                                           # Exporta servicio de vistas
    "MiListaService",                                         # Exporta servicio de mi lista
    "ReporteService",
    "CalificacionService",                                    # Exporta servicio de calificaciones
]
