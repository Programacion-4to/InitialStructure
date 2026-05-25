from src.db import Calificacion, Contenido, Descarga, Episodio, Genero, Temporada, Vista  # Importa modelos ORM
from src.dtos import (                                                  # Importa esquemas de respuesta
    CalificacionResponseDTO,
    ContenidoResponseDTO,
    DescargaResponseDTO,
    EpisodioResponseDTO,
    GeneroResponseDTO,
    ProductResponseDTO,
    TemporadaResponseDTO,
    VistaResponseDTO,
)


def to_genero_response(genero: Genero) -> GeneroResponseDTO:                         # Convierte Genero a DTO
    return GeneroResponseDTO.model_validate(genero)                                 # Valida y transforma al esquema


def to_contenido_response(contenido: Contenido) -> ContenidoResponseDTO:            # Convierte Contenido a DTO
    dto = ContenidoResponseDTO.model_validate(contenido)                            # Valida y transforma al esquema
    if contenido.calificaciones:
        dto.promedio_calificaciones = round(
            sum(calificacion.puntaje for calificacion in contenido.calificaciones)
            / len(contenido.calificaciones),
            2,
        )
    return dto


def to_product_response(product: Contenido) -> ProductResponseDTO:                  # Convierte Producto a DTO
    return to_contenido_response(product)


def to_temporada_response(temporada: Temporada) -> TemporadaResponseDTO:  # Convierte Temporada a DTO
    return TemporadaResponseDTO.model_validate(temporada)               # Valida y transforma al esquema


def to_episodio_response(episodio: Episodio) -> EpisodioResponseDTO:    # Convierte Episodio a DTO
    return EpisodioResponseDTO.model_validate(episodio)                 # Valida y transforma al esquema


def to_vista_response(vista: Vista) -> VistaResponseDTO:                # Convierte Vista a DTO
    return VistaResponseDTO.model_validate(vista)                       # Valida y transforma al esquema


def to_descarga_response(descarga: Descarga) -> DescargaResponseDTO:
    return DescargaResponseDTO.model_validate(descarga)

def to_calificacion_response(calificacion: Calificacion) -> CalificacionResponseDTO:  # Convierte Calificación a DTO
    return CalificacionResponseDTO.model_validate(calificacion)                        # Valida y transforma al esquema


def to_genero_response_list(generos: list[Genero]) -> list[GeneroResponseDTO]:        # Convierte lista de Géneros a DTOs
    return [to_genero_response(genero) for genero in generos]                         # Itera y aplica el mapper individual


def to_contenido_response_list(contenidos: list[Contenido]) -> list[ContenidoResponseDTO]: # Convierte lista de Contenidos a DTOs
    return [to_contenido_response(contenido) for contenido in contenidos]


def to_product_response_list(products: list[Contenido]) -> list[ProductResponseDTO]:  # Convierte lista de Productos a DTOs
    return [to_product_response(product) for product in products]                  # Itera y aplica el mapper individual


def to_temporada_response_list(temporadas: list[Temporada]) -> list[TemporadaResponseDTO]: # Convierte lista de Temporadas a DTOs
    return [to_temporada_response(temporada) for temporada in temporadas]            # Itera y aplica el mapper individual


def to_episodio_response_list(episodios: list[Episodio]) -> list[EpisodioResponseDTO]:    # Convierte lista de Episodios a DTOs
    return [to_episodio_response(episodio) for episodio in episodios]

def to_vista_response_list(vistas: list[Vista]) -> list[VistaResponseDTO]:  # Convierte lista de Vistas a DTOs
    return [to_vista_response(vista) for vista in vistas]                   # Itera y aplica el mapper individual


def to_descarga_response_list(descargas: list[Descarga]) -> list[DescargaResponseDTO]:
    return [to_descarga_response(descarga) for descarga in descargas]


def to_calificacion_response_list(                                          # Convierte lista de Calificaciones a DTOs
    calificaciones: list[Calificacion],
) -> list[CalificacionResponseDTO]:
    return [
        to_calificacion_response(calificacion)                              # Itera y aplica el mapper individual
        for calificacion in calificaciones
    ]
