"""Create or upgrade an administrator explicitly; never at application startup."""
import argparse

from src.db.connection import SessionLocal
from src.db.models import Cuenta
from src.utils.hash import hash_password


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    if len(args.password) < 12:
        parser.error("La contraseña de admin debe tener al menos 12 caracteres")

    with SessionLocal() as db:
        account = db.query(Cuenta).filter(Cuenta.email == args.email.lower()).first()
        if account is None:
            account = Cuenta(email=args.email.lower(), password_hash=hash_password(args.password), plan="premium")
            db.add(account)
        else:
            account.password_hash = hash_password(args.password)
        account.is_admin = True
        account.role = "admin"
        account.email_verified = True
        db.commit()
        print(f"Administrador listo: {account.email}")


if __name__ == "__main__":
    main()
