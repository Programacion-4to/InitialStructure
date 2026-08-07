from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.user_model import User
from src.dtos.auth_dto import (
    CurrentUserDTO,
    LoginDTO,
    RegisterAdminDTO,
    RegisterConductorDTO,
    RegisterPasajeroDTO,
    TokenDTO,
)
from src.middlewares.auth_middleware import get_current_user
from src.schemas.auth_schema import (
    LoginSchema,
    RegisterAdminSchema,
    RegisterConductorSchema,
    RegisterPasajeroSchema,
    TokenSchema,
)
from src.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenSchema)
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    dto = LoginDTO(**payload.model_dump())
    token: TokenDTO = AuthService(db).login(dto)
    return TokenSchema(**token.model_dump())


@router.post("/register/pasajero", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
def register_pasajero(payload: RegisterPasajeroSchema, db: Session = Depends(get_db)):
    dto = RegisterPasajeroDTO(**payload.model_dump())
    token = AuthService(db).register_pasajero(dto)
    return TokenSchema(**token.model_dump())


@router.post("/register/conductor", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
def register_conductor(payload: RegisterConductorSchema, db: Session = Depends(get_db)):
    dto = RegisterConductorDTO(**payload.model_dump())
    token = AuthService(db).register_conductor(dto)
    return TokenSchema(**token.model_dump())


@router.post("/register/admin", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
def register_admin(payload: RegisterAdminSchema, db: Session = Depends(get_db)):
    dto = RegisterAdminDTO(**payload.model_dump())
    token = AuthService(db).register_admin(dto)
    return TokenSchema(**token.model_dump())


@router.get("/me", response_model=CurrentUserDTO)
def me(user: User = Depends(get_current_user)):
    return CurrentUserDTO.model_validate(user)
