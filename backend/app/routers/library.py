from fastapi import APIRouter, Query
from sqlmodel import select
from ..db import get_session
from ..models import ImageAsset

router = APIRouter(prefix="", tags=["library"]) 

@router.get("/images")
def list_images(user_id: str, limit: int = Query(100, ge=1, le=500)):
    with get_session() as s:
        imgs = s.exec(
            select(ImageAsset)
            .where(ImageAsset.user_id == user_id)
            .order_by(ImageAsset.created_at.desc())
            .limit(limit)
        ).all()
        return [
            {"id": im.id, "chat_id": im.chat_id, "title": im.title, "b64": im.b64, "created_at": im.created_at.isoformat()}
            for im in imgs
        ]