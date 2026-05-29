from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.db.models import Cuenta
from src.dtos import AdminLoginDTO, AuthAccountDTO, LoginDTO, TokenDTO
from src.middlewares import get_current_user_from_swagger
from src.schemas import AuthAccountSchema, LoginSchema, TokenSchema
from src.schemas.auth_schema import AdminLoginSchema
from src.services import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenSchema)
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    dto = LoginDTO(**payload.model_dump())
    token: TokenDTO = AuthService(db).login(dto)
    return TokenSchema(**token.model_dump())


@router.post("/admin-login", response_model=TokenSchema)
def admin_login(payload: AdminLoginSchema, db: Session = Depends(get_db)):
    dto = AdminLoginDTO(**payload.model_dump())
    token: TokenDTO = AuthService(db).admin_login(dto)
    return TokenSchema(**token.model_dump())


@router.get("/me", response_model=AuthAccountSchema)
def me(
    current_user: Cuenta = Depends(get_current_user_from_swagger),
    db: Session = Depends(get_db),
):
    account: AuthAccountDTO = AuthService(db).get_current_account(current_user.id)
    return AuthAccountSchema(**account.model_dump())

