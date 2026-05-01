# Echoic

**AI-powered audiobook generation** — [echoic.studio](https://echoic.studio)

Upload a manuscript in any language, and Echoic's AI reads it, identifies characters, casts voices to match their personality, and narrates it with emotion and pacing.

## How It Works

```
Upload (.txt/.pdf/.epub/.docx/.mobi/.azw3)
  → Parser (extract text, detect chapters)
  → Director (Claude Haiku — splits text into Narrator/Character lines, language-aware)
  → Casting Director (Claude Haiku — assigns voices by character personality)
  → Narrator (Gemini TTS — multi-speaker audio per segment, with model fallback)
  → Stitcher (combines segments into chapters, chapters into full audiobook)
```

## Features

### Core Pipeline
- **AI Director** — Claude Haiku reads each chapter and splits it into speaker-tagged lines (Narrator vs. each character), preserving the original text faithfully. Language-aware: handles dialogue conventions for all supported languages (quotation marks, em-dashes,「」, «», etc.)
- **Auto Character Casting** — Claude identifies every character by name and assigns each a unique voice that matches their personality
- **Multi-Speaker TTS** — Gemini TTS renders audio with separate voices for narrator and characters, stitched together seamlessly
- **Model Fallback Chain** — TTS tries Gemini 3.1 Flash → 2.5 Pro → 2.5 Flash, auto-falling back on errors or rate limits. Effectively triples daily API quota.
- **Parallel Chapter Processing** — Chapters are directed and narrated concurrently (up to 3 simultaneous) for faster results. Users can play/download completed chapters while others are still processing.
- **Chapter Splitting** — Auto-detects chapter boundaries (Chapter X, Part X, Prologue, Epilogue) and generates per-chapter audio files with title narration
- **Audio Preview** — Generate a ~30-second sample from the first page before committing to a full conversion. Try different voices instantly.
- **Content Filter Handling** — If Gemini's copyright or safety filter blocks a segment, tries the next model in the fallback chain (different models have different thresholds). If all models block, inserts silence and continues instead of failing the entire job.
- **Format Conversion** — Download audiobooks in multiple formats, converted on-the-fly via ffmpeg

### Multi-Language Support (26 languages)
| Tier | Languages | Voices |
|------|-----------|--------|
| Full (30 voices) | English | 15 male, 15 female |
| Major (8 voices) | Chinese, German, French, Hindi, Japanese, Korean, Portuguese, Spanish | 4 male, 4 female |
| Core (5 voices) | Arabic, Bengali, Dutch, Gujarati, Indonesian, Italian, Kannada, Malayalam, Marathi, Polish, Russian, Tamil, Telugu, Thai, Turkish, Ukrainian, Vietnamese | 3 male, 2 female |

- Language selector in the studio UI
- Voice grid dynamically updates per language
- Director uses language-specific dialogue conventions
- Speaker tags stay in English (required by Gemini TTS), content stays in original language

### Voice Previews
- Pre-generated audio samples for each voice in each language
- Instant playback from Vercel CDN (no API calls)
- Preview button on each voice card in the studio
- Generate additional previews via `scripts/generate_previews.py`

### Output Formats
| Format | Description |
|--------|-------------|
| MP3 | Compressed, universal compatibility (default) |
| WAV | Uncompressed, highest quality |
| M4A | AAC audio, great for Apple devices |
| FLAC | Lossless compression |
| OGG | Open format, good quality |

### File Support
- **TXT** — direct text extraction
- **PDF** — pypdf with zero-dependency fallback parser
- **EPUB** — ebooklib with zipfile/HTML fallback parser
- **DOCX** — python-docx with zipfile/XML fallback parser
- **MOBI/AZW/AZW3** — Kindle format (DRM-free only) with binary fallback parser

### Authentication
- **Clerk** integration with Google, Email, and Facebook sign-in
- Dark-themed sign-in modal matching the app design
- Anonymous access — users can try the studio without signing up
- Sign-in prompted for credits/payment features

### Payments (Stripe)
| Tier | Price | What you get |
|------|-------|-------------|
| Free | $0 | 1 conversion up to 5,000 words |
| Single Book | $9.99 | 1 book, unlimited words |
| Pro | $29.99/mo | Unlimited conversions |

- Stripe Checkout for one-time and subscription payments
- Credits persisted to disk (JSON file) with Stripe sync on startup
- Admin user support via `ADMIN_USER_IDS` env var
- Upload gated behind credit check
- "Contact us" refund link on failure screen

### Privacy & Compliance
- **Cookie consent banner** — gates Meta Pixel loading (GDPR/CCPA compliant)
- **Privacy policy** at `/privacy` — covers all third-party services
- Vercel Analytics (cookie-free) loads without consent

### Frontend
- Next.js 15 + Tailwind CSS (dark theme)
- Drag-and-drop file upload
- Language selector with 26 languages
- Narrator voice selector with gender labels and instant audio previews
- Audio preview from uploaded manuscript before full conversion
- Per-chapter progress with live play/download as chapters complete
- Cast display showing character → voice assignments
- "Download Full Audiobook" for the stitched output
- Pricing page with 3-tier cards
- FAQ section with publishing guidance and legal disclaimer

## Architecture

```
frontend/                    → Next.js 15 + Tailwind
  src/app/
    page.tsx                 → Public landing page (features, FAQ, disclaimer)
    studio/page.tsx          → Upload + conversion UI (anonymous + auth)
    pricing/page.tsx         → Pricing cards + Stripe checkout
    privacy/page.tsx         → Privacy policy
    sign-in/                 → Clerk sign-in page
    sign-up/                 → Clerk sign-up page
    layout.tsx               → ClerkProvider + Analytics + CookieConsent
  src/components/
    CookieConsent.tsx        → Cookie banner + conditional Meta Pixel
  src/lib/
    tracking.ts              → Meta Pixel event helpers
  public/previews/           → Pre-generated voice preview WAV files
  middleware.ts              → Route protection

backend/                     → FastAPI
  app/
    api/
      upload.py              → File upload + credit check + language param + audio preview
      jobs.py                → Job status + audio download + voice preview + languages
      payments.py            → Stripe checkout + webhooks + pricing
    services/
      director.py            → Claude Haiku — language-aware speaker tagging
      narrator.py            → Gemini TTS — multi-speaker + model fallback + preview gen
      segmenter.py           → Character extraction, voice assignment, text segmentation
      parser.py              → File parsing (txt/pdf/epub/docx/mobi) + chapter detection
      pipeline.py            → Parallel chapter processing: direct → cast → narrate → stitch
      credits.py             → Persistent credit tracking + Stripe sync + admin access
    models/
      schemas.py             → Pydantic models (Job, Chapter, Voice)
    config.py                → Environment settings
    main.py                  → FastAPI app + CORS + startup hooks

scripts/
  generate_previews.py       → Batch generate voice preview audio files
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

### Voice Previews

```bash
# Generate preview audio files for all voice+language combinations
GEMINI_API_KEY=your_key python scripts/generate_previews.py

# Safe to re-run — skips existing files, stops on rate limit
# Commit generated files: git add frontend/public/previews/ && git commit
```

### Environment Variables

**Backend** (`backend/.env`):
```
ANTHROPIC_API_KEY=sk-ant-...        # Claude API (Director + Casting)
GEMINI_API_KEY=AI...                # Gemini TTS (Narrator)
STRIPE_SECRET_KEY=sk_live_...       # Stripe payments (use sk_test_ for local dev)
STRIPE_WEBHOOK_SECRET=whsec_...     # Stripe webhook verification
FRONTEND_URL=http://localhost:3001  # For Stripe redirect URLs
ADMIN_USER_IDS=user_abc,user_xyz   # Comma-separated Clerk user IDs for unlimited access
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FB_PIXEL_ID=...         # Meta Pixel for ad conversion tracking
```

## Deployment

- **Frontend**: Vercel (auto-deploys from GitHub) → https://echoic.studio
- **Backend**: Render (configured via `render.yaml`) → https://echoic-api.onrender.com
- **Domain**: echoic.studio (Cloudflare DNS → Vercel CNAME)
- **Payments**: Stripe live mode with webhook at `/api/webhook/stripe`
- **Auth**: Clerk with Google, Email, and Facebook sign-in

## Marketing

- **Facebook Page**: [Echoic](https://www.facebook.com/profile.php?id=61560376811560)
- **Meta Pixel**: Full-funnel tracking with cookie consent (PageView, CompleteRegistration, InitiateCheckout, Purchase, ViewContent, Lead)
- **Vercel Analytics**: Custom engagement events (file_selected, generate_clicked, conversion_completed, audio_played, audio_downloaded)
- **Ad Creatives**: 3 static (1080x1080) + 1 animated video in `ads/`
- **Targeting**: Self-published authors, KDP users, audiobook enthusiasts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.12 |
| AI Director | Claude Haiku 4.5 (Anthropic) |
| AI Narrator | Gemini TTS (3.1 Flash → 2.5 Pro → 2.5 Flash fallback) |
| Languages | 26 languages, 30 voices |
| Auth | Clerk (Google, Email, Facebook) |
| Payments | Stripe (live) |
| Analytics | Meta Pixel (with consent), Vercel Analytics |
| Hosting | Vercel + Render (Docker) |
| Domain | Cloudflare |
