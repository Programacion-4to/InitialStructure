from sqlalchemy.orm import Session

from src.db.models.user_model import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        email: str,
        password_hash: str,
        role: str,
        pasajero_id: int | None = None,
        conductor_id: int | None = None,
    ) -> User:
        user = User(
            email=email,
            password_hash=password_hash,
            role=role,
            pasajero_id=pasajero_id,
            conductor_id=conductor_id,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def find_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def find_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()
