from datetime import date

from pydantic import BaseModel


class CreateCuponDTO(BaseModel):
    codigo: str
    porcentaje_descuento: int
    fecha_vencimiento: date


class CuponResponseDTO(BaseModel):
    id: int
    codigo: str
    porcentaje_descuento: int
    fecha_vencimiento: date

    model_config = {"from_attributes": True}
