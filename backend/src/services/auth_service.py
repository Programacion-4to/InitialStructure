from sqlalchemy.orm import Session                               # Importa la sesión de SQLAlchemy

from src.dtos import LoginDTO, PerfilAuthDTO, PerfilAuthResponseDTO, TokenDTO # Importa DTOs de autenticación
from src.repositories import CuentaRepository, PerfilRepository # Importa repositorios necesarios
from src.utils import UnauthorizedError, verify_password, create_access_token # Utilidades de seguridad


class AuthService:                                               # Servicio para lógica de autenticación
    def __init__(self, db: Session):                             # Inicializa repositorios requeridos
        self.cuenta_repo = CuentaRepository(db)                  # Repositorio de Cuentas
        self.perfil_repo = PerfilRepository(db)                  # Repositorio de Perfiles

    def login(self, dto: LoginDTO) -> TokenDTO:                  # Gestiona el inicio de sesión de la cuenta
        cuenta = self.cuenta_repo.find_by_email(dto.email)       # Busca la cuenta por email

        if not cuenta or not verify_password(dto.password, cuenta.password_hash): # Valida credenciales
            raise UnauthorizedError("Credenciales invalidas")    # Error si no coincide email o password

        token = create_access_token(
            {
                "sub": str(cuenta.id),
                "email": cuenta.email,
                "admin": bool(cuenta.is_admin),
            }
        )
        return TokenDTO(
            access_token=token,
            token_type="bearer",
            id=cuenta.id,
            is_admin=bool(cuenta.is_admin),
            email=cuenta.email,
        )

    def admin_login(self, dto: AdminLoginDTO) -> TokenDTO:
        cuenta = None

        if dto.username:
            cuenta = self.cuenta_repo.find_by_email(dto.username)
            if not cuenta or not cuenta.is_admin:
                raise UnauthorizedError("Credenciales admin invalidas")

            if not verify_password(dto.password, cuenta.password_hash):
                raise UnauthorizedError("Credenciales admin invalidas")
        else:
            admins = self.cuenta_repo.list_admins()
            for admin in admins:
                if verify_password(dto.password, admin.password_hash):
                    cuenta = admin
                    break

            if not cuenta:
                raise UnauthorizedError("Credenciales admin invalidas")

        if not perfil or perfil.cuenta_id != cuenta_id:          # Valida pertenencia del perfil a la cuenta
            raise UnauthorizedError("Perfil no autorizado")      # Error de propiedad o existencia

        if perfil.pin and (dto.pin is None or not verify_password(dto.pin, perfil.pin)): # Valida PIN si existe
            raise UnauthorizedError("PIN invalido")              # Error de PIN incorrecto o ausente

        return PerfilAuthResponseDTO(
            message="Perfil autorizado",
            perfil_id=perfil.id,
            cuenta_id=cuenta_id,
        )
