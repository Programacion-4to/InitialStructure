from typing import Literal

from pydantic import BaseModel, Field

CategoriaVehiculo = Literal["economico", "confort", "premium"]


class CreateVehiculoSchema(BaseModel):
    conductor_id: int
    patente: str = Field(min_length=4, max_length=20)
    modelo: str = Field(min_length=1, max_length=50)
    anio: int = Field(ge=1950, le=2100)
    categoria: CategoriaVehiculo


class UpdateVehiculoSchema(BaseModel):
    patente: str | None = Field(default=None, min_length=4, max_length=20)
    modelo: str | None = Field(default=None, min_length=1, max_length=50)
    anio: int | None = Field(default=None, ge=1950, le=2100)
    categoria: CategoriaVehiculo | None = None
