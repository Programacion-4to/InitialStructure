from typing import Literal

from pydantic import BaseModel, Field, model_validator

TipoMetodoPago = Literal["tarjeta_credito", "tarjeta_debito", "efectivo", "billetera_virtual"]


class CreateMetodoPagoSchema(BaseModel):
    pasajero_id: int
    tipo: TipoMetodoPago
    ultimos_digitos: str | None = Field(default=None, min_length=4, max_length=4, pattern=r"^\d{4}$")

    @model_validator(mode="after")
    def validar_digitos(self):
        if self.tipo in ("tarjeta_credito", "tarjeta_debito") and not self.ultimos_digitos:
            raise ValueError("ultimos_digitos requerido para tarjeta")
        if self.tipo not in ("tarjeta_credito", "tarjeta_debito") and self.ultimos_digitos:
            raise ValueError("ultimos_digitos solo aplica a tarjeta")
        return self
