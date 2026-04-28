# Echoic

Turn manuscripts into audiobooks using AI-powered narration.

Echoic uses a two-stage pipeline:
1. **Director** — An LLM analyzes your text and adds prosody tags (pacing, emotion, emphasis)
2. **Narrator** — A TTS model converts the directed text into natural-sounding audio

## Architecture

```
frontend/          → Next.js web app
backend/           → FastAPI server
  app/
    api/           → Route handlers
    services/      → Business logic (director, narrator, file parsing)
    models/        → Data models
  tests/           → Backend tests
```

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
GEMINI_API_KEY=your_key_here
```
