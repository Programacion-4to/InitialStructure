from sqlalchemy.orm import Session

from src.dtos.metodo_pago_dto import CreateMetodoPagoDTO, MetodoPagoResponseDTO
from src.mappers.metodo_pago_mapper import to_metodo_pago_response
from src.repositories.metodo_pago_repository import MetodoPagoRepository
from src.repositories.pasajero_repository import PasajeroRepository
from src.utils.errors import NotFoundError


class MetodoPagoService:
    def __init__(self, db: Session):
        self.repo = MetodoPagoRepository(db)
        self.pasajero_repo = PasajeroRepository(db)

    def create(self, dto: CreateMetodoPagoDTO) -> MetodoPagoResponseDTO:
        if self.pasajero_repo.get_by_id(dto.pasajero_id) is None:
            raise NotFoundError("Pasajero no encontrado")
        m = self.repo.create(dto.pasajero_id, dto.tipo, dto.ultimos_digitos)
        return to_metodo_pago_response(m)

    def list_by_pasajero(self, pasajero_id: int) -> list[MetodoPagoResponseDTO]:
        if self.pasajero_repo.get_by_id(pasajero_id) is None:
            raise NotFoundError("Pasajero no encontrado")
        return [to_metodo_pago_response(m) for m in self.repo.list_by_pasajero(pasajero_id)]
