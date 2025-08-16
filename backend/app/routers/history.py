from fastapi import APIRouter, Query
from sqlmodel import select
from ..db import get_session
from ..models import Chat, Message
from datetime import datetime

router = APIRouter(prefix="", tags=["history"]) 

@router.post("/chats")
def create_chat(title: str | None = None):
    with get_session() as s:
        chat = Chat(title=title or "New Chat")
        s.add(chat)
        s.commit()
        s.refresh(chat)
        return {"id": chat.id, "title": chat.title, "created_at": chat.created_at}

@router.get("/chats")
def list_chats(q: str | None = Query(None)):
    with get_session() as s:
        stmt = select(Chat).order_by(Chat.updated_at.desc())
        chats = s.exec(stmt).all()
        def matches(c: Chat):
            if not q: return True
            return q.lower() in (c.title or "").lower()
        return [
            {
                "id": c.id,
                "title": c.title,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
            }
            for c in chats if matches(c)
        ]

@router.get("/chats/{chat_id}")
def get_chat(chat_id: int):
    with get_session() as s:
        chat = s.get(Chat, chat_id)
        if not chat:
            return {"id": chat_id, "messages": []}
        msgs = s.exec(select(Message).where(Message.chat_id==chat_id).order_by(Message.created_at.asc())).all()
        return {
            "id": chat.id,
            "title": chat.title,
            "messages": [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in msgs]
        }

@router.delete("/chats/{chat_id}")
def delete_chat(chat_id: int):
    with get_session() as s:
        chat = s.get(Chat, chat_id)
        if not chat:
            return {"ok": True}
        # cascade-like delete
        s.exec(select(Message).where(Message.chat_id==chat_id))
        s.delete(chat)
        s.commit()
        return {"ok": True}
