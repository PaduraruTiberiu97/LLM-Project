import os

from sqlalchemy import inspect
from sqlmodel import SQLModel, create_engine, Session

DB_URL = os.getenv("DB_URL", "sqlite:///data/app.db")
# For SQLite, need check_same_thread=False when used in threaded servers
engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {},
)

_initialized = False

def init_db():
    global _initialized
    if _initialized:
        return

    # Ensure the data directory exists for sqlite
    if DB_URL.startswith("sqlite"):
        os.makedirs("data", exist_ok=True)
    SQLModel.metadata.create_all(engine)

    # Simple migration: ensure chat.user_id exists for older databases
    with engine.begin() as conn:
        inspector = inspect(conn)
        if "chat" in inspector.get_table_names():
            cols = {col["name"] for col in inspector.get_columns("chat")}
            if "user_id" not in cols:
                conn.exec_driver_sql(
                    "ALTER TABLE chat ADD COLUMN user_id TEXT DEFAULT ''"
                )

    _initialized = True

def get_session() -> Session:
    init_db()
    return Session(engine)
