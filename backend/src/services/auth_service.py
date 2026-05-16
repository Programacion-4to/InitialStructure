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

        token = create_access_token({"sub": str(cuenta.id), "email": cuenta.email}) # Genera JWT de cuenta

        return TokenDTO(access_token=token, token_type="bearer") # Retorna DTO con el token generado

    def auth_perfil(self, cuenta_id: int, perfil_id: int, dto: PerfilAuthDTO) -> PerfilAuthResponseDTO: # Valida acceso a perfil
        perfil = self.perfil_repo.find_by_id(perfil_id)          # Busca el perfil solicitado

        if not perfil or perfil.cuenta_id != cuenta_id:          # Valida pertenencia del perfil a la cuenta
            raise UnauthorizedError("Perfil no autorizado")      # Error de propiedad o existencia

        if perfil.pin and (dto.pin is None or not verify_password(dto.pin, perfil.pin)): # Valida PIN si existe
            raise UnauthorizedError("PIN invalido")              # Error de PIN incorrecto o ausente

        return PerfilAuthResponseDTO(
            message="Perfil autorizado",
            perfil_id=perfil.id,
            cuenta_id=cuenta_id,
        )
