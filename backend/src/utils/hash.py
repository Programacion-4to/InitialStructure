from passlib.context import CryptContext                         # Importa el contexto de criptografía

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Configura bcrypt como algoritmo de hashing


def hash_password(plain: str) -> str:                            # Genera un hash a partir de texto plano
    return pwd_context.hash(plain)                               # Retorna la contraseña cifrada


def verify_password(plain: str, hashed: str) -> bool:            # Verifica si la contraseña coincide con el hash
    return pwd_context.verify(plain, hashed)                     # Retorna True si la validación es exitosa
