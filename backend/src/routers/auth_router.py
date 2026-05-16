from fastapi import APIRouter, Depends                              # Importa utilidades de rutas y dependencias
from sqlalchemy.orm import Session                                  # Importa el tipado para la sesión de BD

from src.db import get_db                                           # Importa la función para obtener la sesión
from src.db.models import Cuenta                                    # Importa el modelo de cuenta autenticada
from src.dtos import LoginDTO, PerfilAuthDTO, PerfilAuthResponseDTO, TokenDTO # Importa objetos de transferencia de datos
from src.middlewares import get_current_user_from_swagger           # Dependencia para validar el JWT de cuenta
from src.schemas import LoginSchema, PerfilAuthResponseSchema, PerfilAuthSchema, TokenSchema # Importa esquemas de validación Pydantic
from src.services import AuthService                                # Importa el servicio de autenticación

router = APIRouter(prefix="/auth", tags=["auth"])                   # Define el router con prefijo y etiquetas


@router.post("/login", response_model=TokenSchema)                  # Endpoint para inicio de sesión de cuenta
def login(payload: LoginSchema, db: Session = Depends(get_db)):     # Recibe credenciales y la sesión de BD
    dto = LoginDTO(**payload.model_dump())                          # Convierte el esquema validado en DTO
    token: TokenDTO = AuthService(db).login(dto)                    # Ejecuta la lógica de login en el servicio
    return TokenSchema(**token.model_dump())                        # Retorna el token mapeado al esquema


@router.post("/perfiles/{perfil_id}", response_model=PerfilAuthResponseSchema) # Endpoint para acceso a un perfil específico
def auth_perfil(
    perfil_id: int,                                                 # ID del perfil enviado en la URL
    payload: PerfilAuthSchema,                                      # Esquema que puede contener el PIN
    current_user: Cuenta = Depends(get_current_user_from_swagger),  # Valida que la cuenta esté autenticada
    db: Session = Depends(get_db),                                  # Inyecta la sesión de la base de datos
):
    dto = PerfilAuthDTO(**payload.model_dump())                     # Mapea los datos de entrada a DTO
    response: PerfilAuthResponseDTO = AuthService(db).auth_perfil(current_user.id, perfil_id, dto) # Valida acceso al perfil
    return PerfilAuthResponseSchema(**response.model_dump())         # Retorna confirmación sin token
