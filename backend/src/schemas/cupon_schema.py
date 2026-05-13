from datetime import date

from pydantic import BaseModel, Field


class CreateCuponSchema(BaseModel):
    codigo: str = Field(min_length=3, max_length=20)
    porcentaje_descuento: int = Field(ge=1, le=100)
    fecha_vencimiento: date
