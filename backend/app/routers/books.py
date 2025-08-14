from fastapi import APIRouter
import json, pathlib

router = APIRouter(prefix="", tags=["books"])
PATH = pathlib.Path(__file__).parents[1] / "data" / "book_summaries.json"

@router.get("/books")
def books():
    return json.loads(PATH.read_text(encoding="utf-8"))
