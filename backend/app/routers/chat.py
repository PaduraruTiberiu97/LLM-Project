from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from openai import OpenAI
import os, json

from ..services.rag import retrieve
from ..services.tools import get_summary_by_title
from ..services.moderation import is_blocked
from ..db import get_session
from ..models import Chat, Message


router = APIRouter(prefix="", tags=["chat"])
oai = OpenAI()
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")


class ChatIn(BaseModel):
    message: str
    chat_id: Optional[int] = None


@router.post("/chat")
def chat(body: ChatIn):
    user_input = (body.message or "").strip()
    if not user_input:
        return {"reply": "Please enter a message.", "blocked": False}

    # Moderation gate
    if is_blocked(user_input):
        return {"reply": "Sorry, I can't help with that.", "blocked": True}

    # Retrieve context via RAG
    context = retrieve(user_input)

    # System prompt and tool schema
    system_prompt = (
        "You are Smart Librarian. Use the provided context from a vector search over book blurbs "
        "to recommend exactly one book. Respond with: Title + 2–3 sentences why it fits. "
        "If you can infer the exact title, call the tool get_summary_by_title(title) to append the full summary at the end."
    )
    tools = [{
        "type": "function",
        "function": {
            "name": "get_summary_by_title",
            "description": "Return full book summary for an exact title.",
            "parameters": {
                "type": "object",
                "properties": {"title": {"type": "string"}},
                "required": ["title"]
            }
        }
    }]

    user_input_with_context = f"User question: {user_input}\n\nContext:\n{context}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input_with_context},
    ]

    # First model call (may decide to call tool)
    first = oai.chat.completions.create(model=CHAT_MODEL, messages=messages, tools=tools)
    msg = first.choices[0].message

    final_reply: str

    # If the model decided to call a tool
    if getattr(msg, "tool_calls", None):
        # Add the assistant turn with tool calls
        assistant_msg = {
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in msg.tool_calls
            ],
        }
        messages.append(assistant_msg)

        # Execute tools and add tool results
        for call in msg.tool_calls:
            try:
                args = json.loads(call.function.arguments or "{}")
            except Exception:
                args = {}
            title = (args or {}).get("title", "") or ""
            summary = get_summary_by_title(title) if title else "Summary not found."
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "name": "get_summary_by_title",
                "content": summary,
            })

        # Second model call with tool results included
        final = oai.chat.completions.create(model=CHAT_MODEL, messages=messages)
        final_reply = final.choices[0].message.content or ""
    else:
        # No tool calls → reply directly
        final_reply = msg.content or ""

    # Persist conversation: create chat if needed, then store messages
    chat_id = body.chat_id
    with get_session() as s:
        chat: Optional[Chat] = s.get(Chat, chat_id) if chat_id else None
        if chat is None:
            # Create a new chat with a short title from the user's input
            title = user_input[:48] + ("…" if len(user_input) > 48 else "")
            chat = Chat(title=title)
            s.add(chat)
            s.commit()
            s.refresh(chat)
        else:
            # Update default title on first user message
            if (chat.title or "") == "New Chat":
                chat.title = user_input[:48] + ("…" if len(user_input) > 48 else "")

        # Store user and assistant messages
        s.add(Message(chat_id=chat.id, role="user", content=user_input))
        s.add(Message(chat_id=chat.id, role="assistant", content=final_reply))
        chat.updated_at = datetime.utcnow()
        s.add(chat)
        s.commit()
        chat_id = chat.id

    return {"reply": final_reply, "blocked": False, "chat_id": chat_id}
