from datetime import time

from pydantic import BaseModel, Field, model_validator


class CreateMultiplicadorSchema(BaseModel):
    dia_semana: int = Field(ge=0, le=6)
    hora_desde: time
    hora_hasta: time
    factor: float = Field(gt=1)

    @model_validator(mode="after")
    def validar_horas(self):
        if self.hora_desde >= self.hora_hasta:
            raise ValueError("hora_desde debe ser menor a hora_hasta")
        return self
