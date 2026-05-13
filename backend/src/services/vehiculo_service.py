from sqlalchemy.orm import Session

from src.dtos.vehiculo_dto import CreateVehiculoDTO, UpdateVehiculoDTO, VehiculoResponseDTO
from src.mappers.vehiculo_mapper import to_vehiculo_response
from src.repositories.conductores_repository import ConductoresRepository
from src.repositories.vehiculo_repository import VehiculoRepository
from src.utils.errors import ConflictError, NotFoundError


class VehiculoService:
    def __init__(self, db: Session):
        self.repo = VehiculoRepository(db)
        self.conductor_repo = ConductoresRepository(db)

    def create(self, dto: CreateVehiculoDTO) -> VehiculoResponseDTO:
        if self.conductor_repo.get_by_id(dto.conductor_id) is None:
            raise NotFoundError("Conductor no encontrado")
        if self.repo.get_by_patente(dto.patente) is not None:
            raise ConflictError("La patente ya está registrada")
        v = self.repo.create(
            conductor_id=dto.conductor_id,
            patente=dto.patente,
            modelo=dto.modelo,
            anio=dto.anio,
            categoria=dto.categoria,
        )
        return to_vehiculo_response(v)

    def get_by_id(self, vehiculo_id: int) -> VehiculoResponseDTO | None:
        v = self.repo.get_by_id(vehiculo_id)
        return to_vehiculo_response(v) if v else None

    def list_by_conductor(self, conductor_id: int) -> list[VehiculoResponseDTO]:
        if self.conductor_repo.get_by_id(conductor_id) is None:
            raise NotFoundError("Conductor no encontrado")
        return [to_vehiculo_response(v) for v in self.repo.list_by_conductor(conductor_id)]

    def update(self, vehiculo_id: int, dto: UpdateVehiculoDTO) -> VehiculoResponseDTO | None:
        v = self.repo.get_by_id(vehiculo_id)
        if v is None:
            return None
        if dto.patente and dto.patente != v.patente:
            if self.repo.get_by_patente(dto.patente) is not None:
                raise ConflictError("La patente ya está registrada")
            v.patente = dto.patente
        if dto.modelo:
            v.modelo = dto.modelo
        if dto.anio is not None:
            v.anio = dto.anio
        if dto.categoria:
            v.categoria = dto.categoria
        return to_vehiculo_response(self.repo.update(v))

    def delete(self, vehiculo_id: int) -> bool:
        v = self.repo.get_by_id(vehiculo_id)
        if v is None:
            return False
        self.repo.delete(v)
        return True
