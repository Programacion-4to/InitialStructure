from src.db.models.metodo_pago_model import MetodoPago
from src.dtos.metodo_pago_dto import MetodoPagoResponseDTO


def to_metodo_pago_response(m: MetodoPago) -> MetodoPagoResponseDTO:
    return MetodoPagoResponseDTO.model_validate(m)
