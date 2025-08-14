import os
from openai import OpenAI

EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")

def embed_query(text: str):
    client = OpenAI()
    res = client.embeddings.create(model=EMBED_MODEL, input=[text])
    return res.data[0].embedding

def embed_texts(texts: list[str]):
    client = OpenAI()
    res = client.embeddings.create(model=EMBED_MODEL, input=texts)
    return [d.embedding for d in res.data]
