from sqlalchemy.orm import Session

from src.dtos.auth_dto import (
    LoginDTO,
    RegisterAdminDTO,
    RegisterConductorDTO,
    RegisterPasajeroDTO,
    TokenDTO,
)
from src.repositories.conductores_repository import ConductoresRepository
from src.repositories.pasajero_repository import PasajeroRepository
from src.repositories.user_repository import UserRepository
from src.utils.errors import ConflictError, UnauthorizedError
from src.utils.hash import hash_password, verify_password
from src.utils.jwt import create_access_token


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
        self.pasajero_repo = PasajeroRepository(db)
        self.conductor_repo = ConductoresRepository(db)

    def _build_token(self, user) -> TokenDTO:
        token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "pasajero_id": user.pasajero_id,
                "conductor_id": user.conductor_id,
            }
        )
        return TokenDTO(
            access_token=token,
            role=user.role,
            user_id=user.id,
            pasajero_id=user.pasajero_id,
            conductor_id=user.conductor_id,
        )

    def login(self, dto: LoginDTO) -> TokenDTO:
        user = self.repo.find_by_email(dto.email)
        if not user or not verify_password(dto.password, user.password_hash):
            raise UnauthorizedError("Credenciales inválidas")
        return self._build_token(user)

    def register_pasajero(self, dto: RegisterPasajeroDTO) -> TokenDTO:
        if self.repo.find_by_email(dto.email) is not None:
            raise ConflictError("El email ya está registrado")
        if self.pasajero_repo.get_by_email(dto.email) is not None:
            raise ConflictError("El email ya está registrado como pasajero")

        pasajero = self.pasajero_repo.create(nombre=dto.nombre, email=dto.email, telefono=dto.telefono)
        user = self.repo.create(
            email=dto.email,
            password_hash=hash_password(dto.password),
            role="pasajero",
            pasajero_id=pasajero.id,
        )
        return self._build_token(user)

    def register_conductor(self, dto: RegisterConductorDTO) -> TokenDTO:
        if self.repo.find_by_email(dto.email) is not None:
            raise ConflictError("El email ya está registrado")
        if self.conductor_repo.get_by_licencia(dto.licencia) is not None:
            raise ConflictError("La licencia ya está registrada")

        conductor = self.conductor_repo.create(nombre=dto.nombre, licencia=dto.licencia)
        user = self.repo.create(
            email=dto.email,
            password_hash=hash_password(dto.password),
            role="conductor",
            conductor_id=conductor.id,
        )
        return self._build_token(user)

    def register_admin(self, dto: RegisterAdminDTO) -> TokenDTO:
        if self.repo.find_by_email(dto.email) is not None:
            raise ConflictError("El email ya está registrado")
        user = self.repo.create(
            email=dto.email,
            password_hash=hash_password(dto.password),
            role="admin",
        )
        return self._build_token(user)
