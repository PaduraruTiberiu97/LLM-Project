# backend/app/routers/tts.py
from fastapi import APIRouter, Query, Response
from openai import OpenAI
import tempfile, pathlib, os

router = APIRouter(prefix="", tags=["tts"])
oai = OpenAI()
TTS_MODEL = os.getenv("TTS_MODEL", "gpt-4o-mini-tts")

@router.get("/tts")
def tts(text: str = Query(..., min_length=1)):
    # Try the streaming API first (most compatible)
    try:
        with oai.audio.speech.with_streaming_response.create(
            model=TTS_MODEL,
            voice="alloy",
            input=text,
        ) as resp:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                resp.stream_to_file(f.name)
                path = f.name
        data = pathlib.Path(path).read_bytes()
        try:
            pathlib.Path(path).unlink(missing_ok=True)
        except Exception:
            pass
        return Response(content=data, media_type="audio/mpeg")
    except TypeError:
        # Fallback for clients that prefer non-streaming create()
        try:
            # Returns a binary response; read its bytes
            bin_resp = oai.audio.speech.create(
                model=TTS_MODEL,
                voice="alloy",
                input=text,
            )
            # Newer clients: .content; older: .read()
            data = getattr(bin_resp, "content", None)
            if data is None and hasattr(bin_resp, "read"):
                data = bin_resp.read()
            if data is None:
                return Response(content=b"TTS failed: empty audio.", status_code=500, media_type="text/plain")
            return Response(content=data, media_type="audio/mpeg")
        except Exception as e2:
            return Response(content=f"TTS failed: {e2}".encode("utf-8"), status_code=500, media_type="text/plain")
