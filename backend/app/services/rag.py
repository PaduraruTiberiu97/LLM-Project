from .chroma_client import get_or_create_collection
from .embeddings import embed_query

def retrieve(user_query: str, k: int = 3) -> str:
    coll = get_or_create_collection("book_summaries")
    q_emb = embed_query(user_query)
    res = coll.query(query_embeddings=[q_emb], n_results=k)
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    ctx = []
    for d, m in zip(docs, metas):
        themes_val = m.get("themes")
        if isinstance(themes_val, list):
            themes = ", ".join(themes_val)
        elif isinstance(themes_val, str):
            themes = themes_val
        else:
            themes = ""
        ctx.append(f"Title: {m.get('title')}\nThemes: {themes}\nBlurb: {d}")
    return "\n\n".join(ctx)
