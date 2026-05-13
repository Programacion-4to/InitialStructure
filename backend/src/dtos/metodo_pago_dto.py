from pydantic import BaseModel


class CreateMetodoPagoDTO(BaseModel):
    pasajero_id: int
    tipo: str
    ultimos_digitos: str | None = None


class MetodoPagoResponseDTO(BaseModel):
    id: int
    pasajero_id: int
    tipo: str
    ultimos_digitos: str | None = None

    model_config = {"from_attributes": True}
