from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

<<<<<<< Updated upstream
from src.db.connection import get_db
from src.dtos.auth_dto import LoginDTO, TokenDTO
from src.schemas.auth_schema import LoginSchema, TokenSchema
from src.services.auth_service import AuthService
=======
from src.config import settings
from src.db import get_db
from src.db.models import Cuenta
from src.middlewares import get_current_user_from_swagger
from src.schemas.auth_schema import (
    AuthAccountSchema, ForgotPasswordSchema, LoginSchema, RegisterSchema,
    ResetPasswordSchema, SessionSchema, TokenSchema, TokenValueSchema,
)
from src.schemas.auth_schema import AdminLoginSchema
from src.services import AuthService
>>>>>>> Stashed changes

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


def _token_response(account: Cuenta, access: str) -> TokenSchema:
    return TokenSchema(access_token=access, id=account.id, is_admin=account.is_admin, email=account.email, plan=account.plan)


@router.post("/register", status_code=202)
def register(payload: RegisterSchema, db: Session = Depends(get_db)):
    account = AuthService(db).register(payload.email, payload.password, payload.plan)
    return {"id": account.id, "message": "Revisa tu email para verificar la cuenta"}


@router.post("/login", response_model=TokenSchema)
<<<<<<< Updated upstream
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    dto = LoginDTO(**payload.model_dump())
    token: TokenDTO = AuthService(db).login(dto)
    return TokenSchema(**token.model_dump())
=======
def login(payload: LoginSchema, response: Response, request: Request, db: Session = Depends(get_db)):
    account, access, refresh = AuthService(db).login(payload.email, payload.password, request.headers.get("user-agent", "Unknown device"))
    _set_refresh_cookie(response, refresh)
    return _token_response(account, access)


@router.post("/admin-login", response_model=TokenSchema)
def admin_login(payload: AdminLoginSchema, response: Response, request: Request, db: Session = Depends(get_db)):
    account, access, refresh = AuthService(db).admin_login(payload.password, request.headers.get("user-agent", "Unknown device"), payload.username)
    _set_refresh_cookie(response, refresh)
    return _token_response(account, access)


@router.post("/refresh", response_model=TokenSchema)
def refresh(response: Response, request: Request, db: Session = Depends(get_db)):
    account, access, refresh_token = AuthService(db).refresh(request.cookies.get(settings.REFRESH_COOKIE_NAME, ""))
    _set_refresh_cookie(response, refresh_token)
    return _token_response(account, access)


@router.post("/logout", status_code=204)
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    AuthService(db).logout(request.cookies.get(settings.REFRESH_COOKIE_NAME))
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")


@router.post("/logout-all", status_code=204)
def logout_all(response: Response, current_user: Cuenta = Depends(get_current_user_from_swagger), db: Session = Depends(get_db)):
    AuthService(db).revoke_all(current_user.id)
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")


@router.get("/sessions", response_model=list[SessionSchema])
def sessions(request: Request, current_user: Cuenta = Depends(get_current_user_from_swagger), db: Session = Depends(get_db)):
    return AuthService(db).sessions(current_user.id, request.cookies.get(settings.REFRESH_COOKIE_NAME))


@router.post("/verify-email", status_code=204)
def verify_email(payload: TokenValueSchema, db: Session = Depends(get_db)):
    AuthService(db).verify_email(payload.token)


@router.post("/resend-verification", status_code=202)
def resend_verification(payload: ForgotPasswordSchema, db: Session = Depends(get_db)):
    AuthService(db).send_verification(payload.email)


@router.post("/forgot-password", status_code=202)
def forgot_password(payload: ForgotPasswordSchema, db: Session = Depends(get_db)):
    AuthService(db).forgot_password(payload.email)


@router.post("/reset-password", status_code=204)
def reset_password(payload: ResetPasswordSchema, db: Session = Depends(get_db)):
    AuthService(db).reset_password(payload.token, payload.password)


@router.get("/me", response_model=AuthAccountSchema)
def me(current_user: Cuenta = Depends(get_current_user_from_swagger)):
    return AuthAccountSchema(id=current_user.id, email=current_user.email, plan=current_user.plan, is_admin=current_user.is_admin, email_verified=current_user.email_verified)
>>>>>>> Stashed changes
