from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(default="New Chat")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    messages: list["Message"] = Relationship(back_populates="chat")
    images: list["ImageAsset"] = Relationship(back_populates="chat")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(foreign_key="chat.id")
    role: str  # "user" | "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    chat: Chat = Relationship(back_populates="messages")

class ImageAsset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: Optional[int] = Field(default=None, foreign_key="chat.id")
    title: Optional[str] = Field(default=None)
    user_id: str = Field(index=True)
    b64: str  # base64 png
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    chat: Optional[Chat] = Relationship(back_populates="images")