"""Baseline existing schema and add V2 identity tables safely."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260818_01"
down_revision = None
branch_labels = None
depends_on = None


def _columns(table: str) -> set[str]:
    return {column["name"] for column in inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    # Existing installations predate Alembic.  create_all is checkfirst and
    # establishes their baseline without dropping or replacing user data.
    from src.db.connection import Base
    import src.db.models  # noqa: F401
    Base.metadata.create_all(bind=op.get_bind())

    columns = _columns("cuentas")
    if "role" not in columns:
        op.add_column("cuentas", sa.Column("role", sa.String(), nullable=False, server_default="user"))
    if "email_verified" not in columns:
        op.add_column("cuentas", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.true()))
    if "updated_at" not in columns:
        op.add_column("cuentas", sa.Column("updated_at", sa.DateTime(), nullable=True))
        op.execute("UPDATE cuentas SET updated_at = COALESCE(fecha_alta, CURRENT_TIMESTAMP)")
        op.alter_column("cuentas", "updated_at", nullable=False)

    op.execute("UPDATE cuentas SET role = CASE WHEN is_admin THEN 'admin' ELSE 'user' END WHERE role IS NULL OR role = 'user'")


def downgrade() -> None:
    # This is a non-destructive baseline revision; roll forward with a new migration.
    pass
