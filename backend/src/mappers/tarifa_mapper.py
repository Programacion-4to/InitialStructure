from src.db.models.tarifa_model import Tarifa
from src.dtos.tarifa_dto import TarifaResponseDTO


def to_tarifa_response(t: Tarifa) -> TarifaResponseDTO:
    return TarifaResponseDTO(
        id=t.id,
        categoria=t.categoria,
        precio_base=float(t.precio_base),
        precio_por_km=float(t.precio_por_km),
    )
