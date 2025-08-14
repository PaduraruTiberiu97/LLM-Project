import json, os
from app.services.chroma_client import get_or_create_collection
from app.services.embeddings import embed_texts

def load_books(path="app/data/book_summaries.json"):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def run():
    books = load_books()
    ids = [b["id"] for b in books]
    # Include title + blurb to slightly improve retrieval
    documents = [f"{b['title']} — {b['summary_short']} Themes: {', '.join(b['themes'])}" for b in books]
    metadatas = [{"title": b["title"], "themes": ", ".join(b["themes"])} for b in books]
    embeddings = embed_texts(documents)

    coll = get_or_create_collection("book_summaries")

    # Be idempotent: delete existing IDs, then add
    try:
        coll.delete(ids=ids)
    except Exception:
        pass
    coll.add(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
    print(f"Ingested {len(ids)} items into collection 'book_summaries'.")

if __name__ == "__main__":
    run()
