from typing import Literal

from pydantic import BaseModel, Field

CategoriaTarifa = Literal["economico", "confort", "premium"]


class CreateTarifaSchema(BaseModel):
    categoria: CategoriaTarifa
    precio_base: float = Field(gt=0)
    precio_por_km: float = Field(gt=0)


class UpdateTarifaSchema(BaseModel):
    precio_base: float | None = Field(default=None, gt=0)
    precio_por_km: float | None = Field(default=None, gt=0)
