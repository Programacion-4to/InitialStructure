from sqlalchemy.orm import Session

from src.dtos.user_dto import UserResponseDTO
from src.mappers.user_mapper import to_user_response
from src.repositories.user_repository import UserRepository
from src.utils.errors import NotFoundError


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def get_by_id(self, user_id: int) -> UserResponseDTO:
        user = self.repo.find_by_id(user_id)
        if user is None:
            raise NotFoundError("Usuario no encontrado")
        return to_user_response(user)
