import os
import chromadb
from functools import lru_cache

@lru_cache
def get_chroma():
    # Prefer environment variables; this avoids hardcoding secrets
    api_key = os.getenv("CHROMA_API_KEY")
    tenant = os.getenv("CHROMA_TENANT")
    database = os.getenv("CHROMA_DATABASE")
    if api_key and tenant and database:
        return chromadb.CloudClient(api_key=api_key, tenant=tenant, database=database)
    # If env is pre-configured for CloudClient, you can also call without args:
    return chromadb.CloudClient()

def get_or_create_collection(name: str):
    client = get_chroma()
    return client.get_or_create_collection(name=name)
