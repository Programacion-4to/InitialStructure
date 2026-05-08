from sqlalchemy.orm import Session

from src.dtos.conductores_dto import CreateConductoresDTO, ConductoresResponseDTO, UpdateConductoresDTO
from src.mappers.conductores_mapper import to_conductores_response
from src.repositories.conductores_repository import ConductoresRepository
from src.utils.errors import ConflictError, NotFoundError


class ConductoresService:
    def __init__(self, db: Session):
        self.repo = ConductoresRepository(db)

    def create(self, dto: CreateConductoresDTO) -> ConductoresResponseDTO:
        if self.repo.get_by_licencia(dto.licencia) is not None:
            raise ConflictError("La licencia ya está registrada")

        conductor = self.repo.create(nombre=dto.nombre, licencia=dto.licencia)
        return to_conductores_response(conductor)

    def get_by_id(self, conductor_id: int) -> ConductoresResponseDTO | None:
        conductor = self.repo.get_by_id(conductor_id)
        if conductor is None:
            return None
        return to_conductores_response(conductor)

    def update(self, conductor_id: int, dto: UpdateConductoresDTO) -> ConductoresResponseDTO | None:
        conductor = self.repo.get_by_id(conductor_id)
        if conductor is None:
            return None

        if dto.licencia and dto.licencia != conductor.licencia:
            if self.repo.get_by_licencia(dto.licencia) is not None:
                raise ConflictError("La licencia ya está registrada")
            conductor.licencia = dto.licencia

        conductor.nombre = dto.nombre or conductor.nombre
        if dto.calificacion_promedio is not None:
            conductor.calificacion_promedio = dto.calificacion_promedio
        if dto.disponible is not None:
            conductor.disponible = dto.disponible

        updated = self.repo.update(conductor)
        return to_conductores_response(updated)

    def delete(self, conductor_id: int) -> bool:
        conductor = self.repo.get_by_id(conductor_id)
        if conductor is None:
            return False

        self.repo.delete(conductor)
        return True
