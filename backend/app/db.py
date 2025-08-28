import os

from sqlalchemy import inspect
from sqlmodel import SQLModel, create_engine, Session

DB_URL = os.getenv("DB_URL", "sqlite:///data/app.db")
# For SQLite, need check_same_thread=False when used in threaded servers
engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {},
)

def init_db():
    """Create tables and backfill missing columns on older databases."""
    if DB_URL.startswith("sqlite"):
        os.makedirs("data", exist_ok=True)

    SQLModel.metadata.create_all(engine)

    with engine.begin() as conn:
        inspector = inspect(conn)
        tables = set(inspector.get_table_names())

        def ensure(table: str, column: str):
            if table not in tables:
                return
            cols = {c["name"] for c in inspector.get_columns(table)}
            if column not in cols:
                conn.exec_driver_sql(
                    f"ALTER TABLE {table} ADD COLUMN {column} TEXT DEFAULT ''"
                )

        ensure("chat", "user_id")
        ensure("imageasset", "user_id")

def get_session() -> Session:
    init_db()
    return Session(engine)
