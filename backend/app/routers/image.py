from __future__ import annotations

from fastapi import APIRouter, Query
from openai import OpenAI
import os, base64  # base64 kept if you later want to decode/save files
from typing import Optional

from ..db import get_session
from ..models import ImageAsset


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

    # Persist generated image
    with get_session() as s:
        asset = ImageAsset(chat_id=chat_id, title=title or prompt[:64], b64=b64)
        s.add(asset)
        s.commit()
        s.refresh(asset)
        return {"image_b64": b64, "id": asset.id}
