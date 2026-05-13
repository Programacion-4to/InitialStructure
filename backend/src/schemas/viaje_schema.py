from typing import Literal

from pydantic import BaseModel, Field

CategoriaViaje = Literal["economico", "confort", "premium"]


class CreateViajeSchema(BaseModel):
    pasajero_id: int
    metodo_pago_id: int
    categoria: CategoriaViaje
    origen: str = Field(min_length=1)
    destino: str = Field(min_length=1)
    distancia_km: float = Field(gt=0)
    cupon_codigo: str | None = None


class CalificacionSchema(BaseModel):
    puntaje_pasajero: int | None = Field(default=None, ge=1, le=5)
    puntaje_conductor: int | None = Field(default=None, ge=1, le=5)
    comentario: str | None = None
