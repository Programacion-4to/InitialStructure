<<<<<<< Updated upstream
from sqlalchemy.orm import Session

from src.dtos.auth_dto import LoginDTO, TokenDTO
from src.repositories.user_repository import UserRepository
from src.utils.errors import UnauthorizedError
from src.utils.hash import verify_password
from src.utils.jwt import create_access_token
=======
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from uuid import uuid4

from sqlalchemy.orm import Session

from src.config import settings
from src.db.models import Cuenta, EmailToken, UserSession
from src.dtos import PerfilAuthDTO, PerfilAuthResponseDTO
from src.repositories import CuentaRepository, PerfilRepository
from src.services.email_service import EmailService
from src.utils import ConflictError, UnauthorizedError, create_access_token, hash_password, verify_password


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()
>>>>>>> Stashed changes


class AuthService:
    def __init__(self, db: Session):
<<<<<<< Updated upstream
        self.repo = UserRepository(db)

    def login(self, dto: LoginDTO) -> TokenDTO:
        user = self.repo.find_by_email(dto.email)
        if not user or not verify_password(dto.password, user.password_hash):
            raise UnauthorizedError("Invalid credentials")

        token = create_access_token({"sub": str(user.id), "email": user.email})
        return TokenDTO(access_token=token)
=======
        self.db = db
        self.cuenta_repo = CuentaRepository(db)
        self.perfil_repo = PerfilRepository(db)

    def register(self, email: str, password: str, plan: str = "basico") -> Cuenta:
        email = email.lower().strip()
        if self.cuenta_repo.find_by_email(email):
            raise ConflictError("Ya existe una cuenta con ese email")
        account = Cuenta(email=email, password_hash=hash_password(password), plan=plan, role="user", email_verified=False)
        self.db.add(account)
        self.db.flush()
        token = self._create_email_token(account.id, "verify", timedelta(hours=24))
        self.db.commit()
        EmailService().send(email, "Verifica tu cuenta Titoflix", f"Tu token de verificación es: {token}")
        return account

    def login(self, email: str, password: str, device_name: str) -> tuple[Cuenta, str, str]:
        account = self.cuenta_repo.find_by_email(email.lower().strip())
        if not account or not verify_password(password, account.password_hash):
            raise UnauthorizedError("Credenciales invalidas")
        if not account.email_verified:
            raise UnauthorizedError("Verifica tu email antes de iniciar sesión")
        access = self._access_token(account)
        refresh = self._create_session(account, device_name)
        self.db.commit()
        return account, access, refresh

    def admin_login(self, password: str, device_name: str, email: str | None = None) -> tuple[Cuenta, str, str]:
        query = self.db.query(Cuenta).filter(Cuenta.is_admin.is_(True))
        if email:
            query = query.filter(Cuenta.email == email.lower().strip())
        for account in query.all():
            if account.email_verified and verify_password(password, account.password_hash):
                access = self._access_token(account)
                refresh = self._create_session(account, device_name)
                self.db.commit()
                return account, access, refresh
        raise UnauthorizedError("Credenciales admin invalidas")

    def refresh(self, raw_token: str) -> tuple[Cuenta, str, str]:
        session = self.db.query(UserSession).filter(UserSession.refresh_token_hash == _hash(raw_token)).first()
        now = _utcnow()
        if not session or session.revoked_at or session.expires_at <= now or not session.cuenta.email_verified:
            raise UnauthorizedError("Sesión inválida o expirada")
        session.revoked_at = now
        account = session.cuenta
        access = self._access_token(account)
        refresh = self._create_session(account, session.device_name)
        self.db.commit()
        return account, access, refresh

    def logout(self, raw_token: str | None) -> None:
        if raw_token:
            session = self.db.query(UserSession).filter(UserSession.refresh_token_hash == _hash(raw_token)).first()
            if session:
                session.revoked_at = _utcnow()
                self.db.commit()

    def revoke_all(self, account_id: int) -> None:
        self.db.query(UserSession).filter(UserSession.cuenta_id == account_id, UserSession.revoked_at.is_(None)).update({"revoked_at": _utcnow()})
        self.db.commit()

    def sessions(self, account_id: int, current_raw_token: str | None) -> list[UserSession]:
        current_hash = _hash(current_raw_token) if current_raw_token else None
        items = self.db.query(UserSession).filter(UserSession.cuenta_id == account_id, UserSession.revoked_at.is_(None)).order_by(UserSession.last_used_at.desc()).all()
        for item in items:
            item.current = item.refresh_token_hash == current_hash
        return items

    def verify_email(self, raw_token: str) -> None:
        token = self._consume_email_token(raw_token, "verify")
        token.cuenta.email_verified = True
        self.db.commit()

    def send_verification(self, email: str) -> None:
        account = self.cuenta_repo.find_by_email(email.lower().strip())
        if account and not account.email_verified:
            token = self._create_email_token(account.id, "verify", timedelta(hours=24))
            self.db.commit()
            EmailService().send(account.email, "Verifica tu cuenta Titoflix", f"Tu token de verificación es: {token}")

    def forgot_password(self, email: str) -> None:
        account = self.cuenta_repo.find_by_email(email.lower().strip())
        if account:
            token = self._create_email_token(account.id, "reset", timedelta(hours=1))
            self.db.commit()
            EmailService().send(account.email, "Restablece tu contraseña Titoflix", f"Tu token de restablecimiento es: {token}")

    def reset_password(self, raw_token: str, password: str) -> None:
        token = self._consume_email_token(raw_token, "reset")
        token.cuenta.password_hash = hash_password(password)
        self.db.query(UserSession).filter(UserSession.cuenta_id == token.cuenta_id).update({"revoked_at": _utcnow()})
        self.db.commit()

    def _access_token(self, account: Cuenta) -> str:
        return create_access_token({"sub": str(account.id), "email": account.email, "role": account.role, "typ": "access"})

    def _create_session(self, account: Cuenta, device_name: str) -> str:
        raw = token_urlsafe(48)
        now = _utcnow()
        self.db.add(UserSession(id=str(uuid4()), cuenta_id=account.id, refresh_token_hash=_hash(raw), device_name=(device_name or "Unknown device")[:160], created_at=now, last_used_at=now, expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)))
        return raw

    def _create_email_token(self, account_id: int, purpose: str, ttl: timedelta) -> str:
        raw = token_urlsafe(32)
        self.db.add(EmailToken(id=str(uuid4()), cuenta_id=account_id, token_hash=_hash(raw), purpose=purpose, expires_at=_utcnow() + ttl))
        return raw

    def _consume_email_token(self, raw: str, purpose: str) -> EmailToken:
        token = self.db.query(EmailToken).filter(EmailToken.token_hash == _hash(raw), EmailToken.purpose == purpose).first()
        if not token or token.used_at or token.expires_at <= _utcnow():
            raise UnauthorizedError("Token inválido o expirado")
        token.used_at = _utcnow()
        return token

    def auth_perfil(self, cuenta_id: int, perfil_id: int, dto: PerfilAuthDTO) -> PerfilAuthResponseDTO:
        perfil = self.perfil_repo.find_by_id(perfil_id)
        if not perfil or perfil.cuenta_id != cuenta_id:
            raise UnauthorizedError("Perfil no autorizado")
        if perfil.pin and (dto.pin is None or not verify_password(dto.pin, perfil.pin)):
            raise UnauthorizedError("PIN invalido")
        return PerfilAuthResponseDTO(message="Perfil autorizado", perfil_id=perfil.id, cuenta_id=perfil.cuenta_id)
>>>>>>> Stashed changes
