from datetime import datetime

from pydantic import BaseModel


class UserResponseDTO(BaseModel):
    id: int
    email: str
    role: str
    pasajero_id: int | None
    conductor_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
