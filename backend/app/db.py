from sqlmodel import SQLModel, create_engine, Session
import os

DB_URL = os.getenv("DB_URL", "sqlite:///data/app.db")
# For SQLite, need check_same_thread=False when used in threaded servers
engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})

def init_db():
    # Ensure the data directory exists for sqlite
    if DB_URL.startswith("sqlite"):
        os.makedirs("data", exist_ok=True)
    SQLModel.metadata.create_all(engine)

def get_session() -> Session:
    return Session(engine)