# Smart Librarian (Python + Next.js + Chroma Cloud)

A complete RAG demo using **FastAPI**, **ChromaDB Cloud**, and **Next.js** with optional **moderation**, **TTS**, **STT**, and **image generation**.

## 1) Prerequisites
- Python 3.11+
- Node 20+ (pnpm recommended)
- Docker (optional but recommended)
- FFmpeg (install automatically in backend Docker image)

## 2) Configure secrets
1. Create **Chroma Cloud** API key; note your **tenant** and **database**.
2. Create **OpenAI** API key.
3. `cp backend/.env.example backend/.env` and fill values.
4. (Optional) `cp frontend/.env.local.example frontend/.env.local` to customize API URL.

## 3) Local dev (no Docker)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export $(cat .env | xargs)  # or use direnv
python ingest.py           # -> pushes 10+ books to Chroma Cloud
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
corepack enable
pnpm install
pnpm dev --port 3000
```

Open http://localhost:3000

## 4) Docker
```bash
docker compose up --build
```
Then open http://localhost:3000

## 5) Endpoints (FastAPI)
- `POST /chat` → RAG + tool calling (`get_summary_by_title`) + moderation gate
- `GET  /tts?text=...` → TTS MP3
- `POST /stt` (multipart/form-data, field: `file`) → Whisper transcription
- `GET  /image?prompt=...` → base64 PNG
- `GET  /books` → full books JSON (for UI/testing)
- `GET  /health` → health check

## 6) Notes
- **Security:** Never commit `.env` with real keys. Rotate any exposed key.
- **Chroma:** uses `CloudClient` + `get_or_create_collection("book_summaries")`.
- **Embeddings:** OpenAI `text-embedding-3-small`.
- **Models:** configurable via `.env` (chat/tts/stt).

## 7) Test ideas
- Ask: “Vreau o carte despre prietenie și magie.” → expect *The Hobbit*.
- Try offensive text → should be politely blocked by moderation.
- Use the mic (🎙) → speaks to Whisper → text in the input box.
- Click **Generate cover** → image appears below the chat.
