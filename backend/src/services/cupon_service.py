from sqlalchemy.orm import Session

from src.dtos.cupon_dto import CreateCuponDTO, CuponResponseDTO
from src.repositories.cupon_repository import CuponRepository
from src.utils.errors import ConflictError


class CuponService:
    def __init__(self, db: Session):
        self.repo = CuponRepository(db)

    def create(self, dto: CreateCuponDTO) -> CuponResponseDTO:
        if self.repo.get_by_codigo(dto.codigo) is not None:
            raise ConflictError("El código de cupón ya existe")
        c = self.repo.create(dto.codigo, dto.porcentaje_descuento, dto.fecha_vencimiento)
        return CuponResponseDTO.model_validate(c)
