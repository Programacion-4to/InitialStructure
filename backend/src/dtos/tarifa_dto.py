from pydantic import BaseModel


class CreateTarifaDTO(BaseModel):
    categoria: str
    precio_base: float
    precio_por_km: float


class UpdateTarifaDTO(BaseModel):
    precio_base: float | None = None
    precio_por_km: float | None = None


class TarifaResponseDTO(BaseModel):
    id: int
    categoria: str
    precio_base: float
    precio_por_km: float

    model_config = {"from_attributes": True}
