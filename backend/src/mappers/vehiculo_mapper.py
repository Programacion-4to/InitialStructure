from src.db.models.vehiculo_model import Vehiculo
from src.dtos.vehiculo_dto import VehiculoResponseDTO


def to_vehiculo_response(v: Vehiculo) -> VehiculoResponseDTO:
    return VehiculoResponseDTO.model_validate(v)
