from src.routers import auth_router, product_router, user_router  # Importa los módulos de rutas específicos


__all__ = [                                                      # Define la interfaz pública del paquete
    "auth_router",                                               # Exporta el router de autenticación
    "product_router",                                            # Exporta el router de productos y catálogo
    "user_router",                                               # Exporta el router de usuarios y perfiles
]