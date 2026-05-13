from sqlalchemy.orm import Session

from src.dtos.tarifa_dto import CreateTarifaDTO, TarifaResponseDTO, UpdateTarifaDTO
from src.mappers.tarifa_mapper import to_tarifa_response
from src.repositories.tarifa_repository import TarifaRepository
from src.utils.errors import ConflictError, NotFoundError


class TarifaService:
    def __init__(self, db: Session):
        self.repo = TarifaRepository(db)

    def create(self, dto: CreateTarifaDTO) -> TarifaResponseDTO:
        if self.repo.get_by_categoria(dto.categoria) is not None:
            raise ConflictError("Ya existe una tarifa para esa categoría")
        t = self.repo.create(dto.categoria, dto.precio_base, dto.precio_por_km)
        return to_tarifa_response(t)

    def list_all(self) -> list[TarifaResponseDTO]:
        return [to_tarifa_response(t) for t in self.repo.list_all()]

    def get_by_categoria(self, categoria: str) -> TarifaResponseDTO:
        t = self.repo.get_by_categoria(categoria)
        if t is None:
            raise NotFoundError("Tarifa no encontrada")
        return to_tarifa_response(t)

    def update(self, categoria: str, dto: UpdateTarifaDTO) -> TarifaResponseDTO:
        t = self.repo.get_by_categoria(categoria)
        if t is None:
            raise NotFoundError("Tarifa no encontrada")
        if dto.precio_base is not None:
            t.precio_base = dto.precio_base
        if dto.precio_por_km is not None:
            t.precio_por_km = dto.precio_por_km
        return to_tarifa_response(self.repo.update(t))
