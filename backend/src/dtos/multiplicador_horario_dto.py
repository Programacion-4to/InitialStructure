from datetime import time

from pydantic import BaseModel


class CreateMultiplicadorDTO(BaseModel):
    dia_semana: int
    hora_desde: time
    hora_hasta: time
    factor: float


class MultiplicadorResponseDTO(BaseModel):
    id: int
    dia_semana: int
    hora_desde: time
    hora_hasta: time
    factor: float

    model_config = {"from_attributes": True}
