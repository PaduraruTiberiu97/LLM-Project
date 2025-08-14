# backend/app/services/moderation.py
import os
from typing import Iterable

# Optional OpenAI moderation (toggle via env)
USE_OAI = os.getenv("USE_OAI_MODERATION", "false").lower() in ("1", "true", "yes")
MODEL = os.getenv("MODERATION_MODEL", "omni-moderation-latest")

def _keyword_block(text: str, words: Iterable[str]) -> bool:
    t = (text or "").lower()
    return any(w in t for w in words)

def is_blocked(text: str) -> bool:
    """Return True if the input should be blocked; otherwise False."""
    if not text:
        return False

    # Fast local fallback (keeps server working even without OpenAI)
    local_blocklist = (
        "self-harm", "suicide", "harm yourself",
        "make a bomb", "buy a bomb", "weapon assembly",
    )

    if USE_OAI:
        try:
            from openai import OpenAI
            client = OpenAI()
            resp = client.moderations.create(model=MODEL, input=text)
            # OpenAI v1 returns .results[0].flagged
            return bool(resp.results[0].flagged)
        except Exception:
            # fail-open to avoid taking the API down on network/key errors
            return _keyword_block(text, local_blocklist)

    return _keyword_block(text, local_blocklist)
