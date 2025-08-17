from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query
from openai import OpenAI

from ..db import get_session
from ..models import ImageAsset, Chat, Message


router = APIRouter(prefix="", tags=["image"])


@router.get("/image")
def gen_image(
    prompt: str = Query(..., min_length=4),
    chat_id: Optional[int] = None,
    title: Optional[str] = None,
):
    client = OpenAI()
    model = os.getenv("IMAGE_MODEL", "gpt-image-1")

    res = client.images.generate(model=model, prompt=prompt, size="1024x1024")
    b64 = res.data[0].b64_json

    # Persist chat, user prompt and generated image
    with get_session() as s:
        chat = s.get(Chat, chat_id) if chat_id else None
        if chat is None:
            title_text = title or prompt[:48] + ("…" if len(prompt) > 48 else "")
            chat = Chat(title=title_text)
            s.add(chat)
            s.commit()
            s.refresh(chat)
        else:
            if (chat.title or "") == "New Chat":
                chat.title = prompt[:48] + ("…" if len(prompt) > 48 else "")

        s.add(Message(chat_id=chat.id, role="user", content=prompt))

        asset = ImageAsset(chat_id=chat.id, title=title or prompt[:64], b64=b64)
        s.add(asset)

        chat.updated_at = datetime.utcnow()
        s.add(chat)

        s.commit()
        s.refresh(asset)

        return {"image_b64": b64, "id": asset.id, "chat_id": chat.id}
