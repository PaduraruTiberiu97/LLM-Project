from fastapi import APIRouter, UploadFile, File
from openai import OpenAI
import tempfile, pathlib, os

router = APIRouter(prefix="", tags=["stt"])
oai = OpenAI()
STT_MODEL = os.getenv("STT_MODEL", "whisper-1")

@router.post("/stt")
async def stt(file: UploadFile = File(...)):
    # Save to a temporary file, then pass a file handle to the API
    suffix = ".webm"
    if file.filename and "." in file.filename:
        suffix = "." + file.filename.rsplit(".", 1)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    with open(tmp_path, "rb") as fh:
        transcript = oai.audio.transcriptions.create(model=STT_MODEL, file=fh)
    try:
        pathlib.Path(tmp_path).unlink(missing_ok=True)
    except Exception:
        pass
    return {"text": transcript.text}
