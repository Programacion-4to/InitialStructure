from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from src.config import settings
from src.dtos import AdminLoginDTO, AuthAccountDTO, LoginDTO, PerfilAuthDTO, PerfilAuthResponseDTO, TokenDTO
from src.repositories import CuentaRepository, PerfilRepository
from src.utils import LockedError, UnauthorizedError, create_access_token, verify_password


MAX_PIN_ATTEMPTS = 3
PIN_LOCK_MINUTES = 15


class AuthService:
    def __init__(self, db: Session):
        self.cuenta_repo = CuentaRepository(db)
        self.perfil_repo = PerfilRepository(db)

    def login(self, dto: LoginDTO) -> TokenDTO:
        cuenta = self.cuenta_repo.find_by_email(dto.email)

        if not cuenta or not verify_password(dto.password, cuenta.password_hash):
            raise UnauthorizedError("Credenciales invalidas")

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

        token = create_access_token(
            {
                "sub": str(cuenta.id),
                "email": cuenta.email,
                "admin": True,
            }
        )
        return TokenDTO(
            access_token=token,
            token_type="bearer",
            id=cuenta.id,
            is_admin=True,
            email=cuenta.email,
        )

    def get_current_account(self, cuenta_id: int) -> AuthAccountDTO:
        cuenta = self.cuenta_repo.find_by_id(cuenta_id)
        if not cuenta:
            raise UnauthorizedError("Cuenta no encontrada")

        return AuthAccountDTO(
            id=cuenta.id,
            email=cuenta.email,
            plan=cuenta.plan,
            is_admin=bool(cuenta.is_admin),
        )

    def auth_perfil(self, cuenta_id: int, perfil_id: int, dto: PerfilAuthDTO) -> PerfilAuthResponseDTO:
        perfil = self.perfil_repo.find_by_id(perfil_id)

        if not perfil or perfil.cuenta_id != cuenta_id:
            raise UnauthorizedError("Perfil no autorizado")

        if perfil.pin:
            now = datetime.utcnow()
            if perfil.pin_bloqueado_hasta and perfil.pin_bloqueado_hasta > now:
                raise LockedError(
                    "Perfil bloqueado por demasiados intentos fallidos",
                    bloqueado_hasta=perfil.pin_bloqueado_hasta.isoformat() + "Z",
                )
            if perfil.pin_bloqueado_hasta and perfil.pin_bloqueado_hasta <= now:
                perfil = self.perfil_repo.update(
                    perfil.id,
                    pin_intentos_fallidos=0,
                    pin_bloqueado_hasta=None,
                ) or perfil

            if dto.pin is None or not verify_password(dto.pin, perfil.pin):
                failed_attempts = int(perfil.pin_intentos_fallidos or 0) + 1
                fields: dict[str, object] = {"pin_intentos_fallidos": failed_attempts}

                if failed_attempts >= MAX_PIN_ATTEMPTS:
                    blocked_until = now + timedelta(minutes=PIN_LOCK_MINUTES)
                    fields["pin_bloqueado_hasta"] = blocked_until
                    self.perfil_repo.update(perfil.id, **fields)
                    raise LockedError(
                        "Perfil bloqueado por demasiados intentos fallidos",
                        bloqueado_hasta=blocked_until.isoformat() + "Z",
                    )

                self.perfil_repo.update(perfil.id, **fields)
                remaining = MAX_PIN_ATTEMPTS - failed_attempts
                raise UnauthorizedError(f"PIN invalido. Intentos restantes: {remaining}")

            if perfil.pin_intentos_fallidos or perfil.pin_bloqueado_hasta:
                self.perfil_repo.update(
                    perfil.id,
                    pin_intentos_fallidos=0,
                    pin_bloqueado_hasta=None,
                )

        return PerfilAuthResponseDTO(
            message="Perfil autorizado",
            perfil_id=perfil.id,
            cuenta_id=perfil.cuenta_id,
        )
