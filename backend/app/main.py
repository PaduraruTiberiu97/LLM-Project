from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import chat, tts, stt, image, books, history, library
from .db import init_db
import os

app = FastAPI()

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

@app.on_event("startup")
def on_startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(tts.router)
app.include_router(stt.router)
app.include_router(image.router)
app.include_router(books.router)
app.include_router(history.router)
app.include_router(library.router)

@app.get("/health")
def health():
    return {"status": "ok"}
