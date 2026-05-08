from sqlalchemy.orm import Session

from src.dtos.pasajero_dto import CreatePasajeroDTO, PasajeroResponseDTO
from src.mappers.pasajero_mapper import to_pasajero_response
from src.repositories.pasajero_repository import PasajeroRepository
from src.utils.errors import ConflictError


class PasajeroService:
    def __init__(self, db: Session):
        self.repo = PasajeroRepository(db)

    def create(self, dto: CreatePasajeroDTO) -> PasajeroResponseDTO:
        if self.repo.get_by_email(dto.email) is not None:
            raise ConflictError("El email ya está registrado")

        pasajero = self.repo.create(
            nombre=dto.nombre,
            email=dto.email,
            telefono=dto.telefono,
        )
        return to_pasajero_response(pasajero)

    def get_by_id(self, pasajero_id: int) -> PasajeroResponseDTO | None:
        pasajero = self.repo.get_by_id(pasajero_id)
        if pasajero is None:
            return None
        return to_pasajero_response(pasajero)

    def update(self, pasajero_id: int, dto: CreatePasajeroDTO) -> PasajeroResponseDTO | None:
        pasajero = self.repo.get_by_id(pasajero_id)
        if pasajero is None:
            return None

        if dto.email and dto.email != pasajero.email:
            if self.repo.get_by_email(dto.email) is not None:
                raise ConflictError("El email ya está registrado")
            pasajero.email = dto.email

        pasajero.nombre = dto.nombre or pasajero.nombre
        pasajero.telefono = dto.telefono or pasajero.telefono

        updated = self.repo.update(pasajero)
        return to_pasajero_response(updated)

    def delete(self, pasajero_id: int) -> bool:
        pasajero = self.repo.get_by_id(pasajero_id)
        if pasajero is None:
            return False

        self.repo.delete(pasajero)
        return True
