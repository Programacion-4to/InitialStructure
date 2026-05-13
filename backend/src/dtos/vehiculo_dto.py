from pydantic import BaseModel


class CreateVehiculoDTO(BaseModel):
    conductor_id: int
    patente: str
    modelo: str
    anio: int
    categoria: str


class UpdateVehiculoDTO(BaseModel):
    patente: str | None = None
    modelo: str | None = None
    anio: int | None = None
    categoria: str | None = None


class VehiculoResponseDTO(BaseModel):
    id: int
    conductor_id: int
    patente: str
    modelo: str
    anio: int
    categoria: str

    model_config = {"from_attributes": True}
