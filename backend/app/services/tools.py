import json
import pathlib

DATA_PATH = pathlib.Path(__file__).parents[1] / "data" / "book_summaries.json"
BOOKS = {}

# Load data once
if DATA_PATH.exists():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)
        BOOKS = {b["title"]: b["summary_full"] for b in items}

def get_summary_by_title(title: str) -> str:
    return BOOKS.get(title, "Summary not found. Use the exact title.")
