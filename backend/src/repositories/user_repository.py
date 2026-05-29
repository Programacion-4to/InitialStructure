from sqlalchemy.orm import Session

from src.db.models import Contenido, Cuenta, Perfil


class CuentaRepository:
    def __init__(self, db: Session):                                     # Inicializa el repositorio con la sesión de DB
        self.db = db

    def create(self, email: str, password_hash: str, plan: str, is_admin: bool = False) -> Cuenta: # Crea y persiste una nueva cuenta
        cuenta = Cuenta(
            email=email,
            password_hash=password_hash,
            plan=plan,
            is_admin=is_admin,
        )
        self.db.add(cuenta)
        self.db.commit()                                                 # Guarda cambios en la base de datos
        self.db.refresh(cuenta)                                          # Actualiza la instancia con datos de DB
        return cuenta

    def find_by_id(self, cuenta_id: int) -> Cuenta | None:               # Busca cuenta por ID
        return self.db.query(Cuenta).filter(Cuenta.id == cuenta_id).first()

    def find_by_email(self, email: str) -> Cuenta | None:                # Busca cuenta por email
        return self.db.query(Cuenta).filter(Cuenta.email == email).first()

    def list_admins(self) -> list[Cuenta]:                                 # Lista todas las cuentas admin
        return self.db.query(Cuenta).filter(Cuenta.is_admin.is_(True)).all()

    def list_all(self) -> list[Cuenta]:                                  # Obtiene todos los registros de cuentas
        return self.db.query(Cuenta).all()

    def update(self, cuenta_id: int, **fields) -> Cuenta | None:         # Actualiza campos dinámicamente
        cuenta = self.find_by_id(cuenta_id)                              # Verifica existencia
        if not cuenta:
            return None

        for key, value in fields.items():                                # Aplica cambios
            setattr(cuenta, key, value)

        self.db.commit()                                                 # Persiste cambios
        self.db.refresh(cuenta)
        return cuenta

    def delete(self, cuenta_id: int) -> bool:                            # Elimina una cuenta por ID
        cuenta = self.find_by_id(cuenta_id)
        if not cuenta:
            return False

        self.db.delete(cuenta)                                           # Elimina registro
        self.db.commit()                                                 # Confirma eliminación
        return True


class PerfilRepository:
    def __init__(self, db: Session):                                     # Inicializa el repositorio con la sesión de DB
        self.db = db

    def create(self, cuenta_id: int, nombre: str, pin: str | None = None, es_infantil: bool = False, avatar: str | None = None) -> Perfil:
        perfil = Perfil(
            cuenta_id=cuenta_id,
            nombre=nombre,
            pin=pin,
            es_infantil=es_infantil,
            avatar=avatar,
        )
        self.db.add(perfil)
        self.db.commit()                                                # Guarda cambios en la base de datos
        self.db.refresh(perfil)                                         # Actualiza la instancia con datos de DB
        return perfil

    def find_by_id(self, perfil_id: int) -> Perfil | None:              # Busca perfil por ID
        return self.db.query(Perfil).filter(Perfil.id == perfil_id).first()

    def list_by_cuenta(self, cuenta_id: int) -> list[Perfil]:           # Lista todos los perfiles de una cuenta
        return self.db.query(Perfil).filter(Perfil.cuenta_id == cuenta_id).all()

    def update(self, perfil_id: int, **fields) -> Perfil | None:        # Actualiza campos dinámicamente
        perfil = self.find_by_id(perfil_id)                             # Verifica existencia
        if not perfil:
            return None

        for key, value in fields.items():                               # Aplica cambios
            setattr(perfil, key, value)

        self.db.commit()                                                # Persiste cambios
        self.db.refresh(perfil)
        return perfil

    def delete(self, perfil_id: int) -> bool:                           # Elimina un perfil por ID
        perfil = self.find_by_id(perfil_id)
        if not perfil:
            return False

        self.db.delete(perfil)                                          # Elimina registro
        self.db.commit()                                                # Confirma eliminación
        return True

    def add_to_mi_lista(self, perfil_id: int, contenido_id: int) -> Perfil | None: # Agrega contenido a "Mi lista"
        perfil = self.find_by_id(perfil_id)
        contenido = self.db.query(Contenido).filter(Contenido.id == contenido_id).first()

        if not perfil or not contenido:
            return None

        if contenido not in perfil.mi_lista:                            # Evita duplicados
            perfil.mi_lista.append(contenido)
            self.db.commit()                                            # Persiste relación
            self.db.refresh(perfil)

        return perfil

    def remove_from_mi_lista(self, perfil_id: int, contenido_id: int) -> Perfil | None: # Elimina contenido de "Mi lista"
        perfil = self.find_by_id(perfil_id)
        if not perfil:
            return None

        perfil.mi_lista = [                                             # Filtra para quitar el contenido
            contenido for contenido in perfil.mi_lista
            if contenido.id != contenido_id
        ]

        self.db.commit()                                                # Persiste cambios
        self.db.refresh(perfil)
        return perfil

    def get_mi_lista(self, perfil_id: int) -> list[Contenido]:           # Obtiene la lista de contenidos
        perfil = self.find_by_id(perfil_id)
        if not perfil:
            return []

        return perfil.mi_lista
