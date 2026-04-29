# Echoic

**AI-powered audiobook generation** — [echoic.studio](https://echoic.studio)

Upload a manuscript, and Echoic's AI reads it, identifies characters, casts voices to match their personality, and narrates it with emotion and pacing.

## How It Works

```
Upload (.txt/.pdf/.epub/.docx)
  → Parser (extract text, detect chapters)
  → Director (Claude Haiku — splits text into Narrator/Character lines)
  → Casting Director (Claude Haiku — assigns voices by character personality)
  → Narrator (Gemini TTS — multi-speaker audio per segment)
  → Stitcher (combines segments into chapters, chapters into full audiobook)
```

## Features

### Core Pipeline
- **AI Director** — Claude Haiku reads the text and splits it into speaker-tagged lines (Narrator vs. each character), adding natural prosody cues (ellipses, em-dashes, pacing)
- **Auto Character Casting** — Claude identifies every character by name and assigns each a unique voice that matches their personality (e.g., Aunt Petunia → Leda, Harry → Puck)
- **Multi-Speaker TTS** — Gemini 2.5 Flash TTS renders audio with separate voices for narrator and characters, stitched together seamlessly
- **Chapter Splitting** — Auto-detects chapter boundaries (Chapter X, Part X, Prologue, Epilogue) and generates per-chapter audio files

### File Support
- **TXT** — direct text extraction
- **PDF** — pypdf with zero-dependency fallback parser
- **EPUB** — ebooklib with zipfile/HTML fallback parser
- **DOCX** — python-docx with zipfile/XML fallback parser

### Voices
6 Gemini TTS voices available:
| Voice | Description |
|-------|-------------|
| Kore | Warm, clear female voice |
| Charon | Deep, authoritative male voice |
| Fenrir | Calm, steady male voice |
| Aoede | Bright, expressive female voice |
| Puck | Energetic, youthful voice |
| Leda | Soft, gentle female voice |

### Authentication
- **Clerk** integration with Google, Email, and Facebook sign-in
- Dark-themed sign-in modal matching the app design
- Public landing page (`/`) with protected studio (`/studio`)

### Payments (Stripe)
| Tier | Price | What you get |
|------|-------|-------------|
| Free | $0 | 1 conversion up to 5,000 words |
| Single Book | $9.99 | 1 book, unlimited words |
| Pro | $29.99/mo | Unlimited conversions |

- Stripe Checkout for one-time and subscription payments
- Credit system tracks usage per user
- Upload gated behind credit check

### Frontend
- Next.js 15 + Tailwind CSS (dark theme)
- Drag-and-drop file upload
- Narrator voice selector (character voices auto-assigned)
- Real-time progress bar with status updates
- Cast display showing character → voice assignments
- Chapter-by-chapter playback with individual Play/Download buttons
- "Download Full Audiobook" for the stitched output
- Pricing page with 3-tier cards

## Architecture

```
frontend/                    → Next.js 15 + Tailwind
  src/app/
    page.tsx                 → Public landing page
    studio/page.tsx          → Protected upload + conversion UI
    pricing/page.tsx         → Pricing cards + Stripe checkout
    sign-in/                 → Clerk sign-in page
    sign-up/                 → Clerk sign-up page
    layout.tsx               → ClerkProvider + dark theme
  middleware.ts              → Route protection

backend/                     → FastAPI
  app/
    api/
      upload.py              → File upload + credit check
      jobs.py                → Job status + audio download (full + per-chapter)
      payments.py            → Stripe checkout + webhooks + pricing
    services/
      director.py            → Claude Haiku — speaker tagging
      narrator.py            → Gemini TTS — multi-speaker audio generation
      segmenter.py           → Character extraction, voice assignment, text segmentation
      parser.py              → File parsing (txt/pdf/epub/docx) + chapter detection
      pipeline.py            → Orchestrates director → cast → narrate → stitch
      credits.py             → User credit tracking (free/single/pro)
    models/
      schemas.py             → Pydantic models (Job, Chapter, Voice)
    config.py                → Environment settings
    main.py                  → FastAPI app + CORS + routers
```

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in API keys
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # fill in Clerk keys
npm run dev
```

### Environment Variables

**Backend** (`backend/.env`):
```
ANTHROPIC_API_KEY=sk-ant-...        # Claude API (Director + Casting)
GEMINI_API_KEY=AI...                # Gemini TTS (Narrator)
STRIPE_SECRET_KEY=sk_test_...       # Stripe payments
STRIPE_WEBHOOK_SECRET=whsec_...     # Stripe webhook verification
FRONTEND_URL=http://localhost:3001  # For Stripe redirect URLs
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

- **Frontend**: Vercel (auto-deploys from GitHub)
- **Backend**: Render (configured via `render.yaml`)
- **Domain**: echoic.studio (Cloudflare DNS)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.12 |
| AI Director | Claude Haiku 4.5 (Anthropic) |
| AI Narrator | Gemini 2.5 Flash TTS (Google) |
| Auth | Clerk |
| Payments | Stripe |
| Hosting | Vercel + Render |
| Domain | Cloudflare |
