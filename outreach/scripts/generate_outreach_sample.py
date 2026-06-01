#!/usr/bin/env python3
"""Generate a personalized 60-second audio sample for outreach.

Usage:
    python generate_outreach_sample.py \\
        --name "Sarah Author" \\
        --book "The Last Lighthouse" \\
        --text-file excerpt.txt \\
        --voice Kore \\
        --out samples/

Reads the excerpt, sends it through the same Director + TTS pipeline the
production app uses, and writes a WAV file named after the author.
"""
import argparse
import asyncio
import os
import re
import sys
from pathlib import Path

# Make the backend importable when running this script from anywhere.
BACKEND = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND))

# Load env so API keys are picked up.
from dotenv import load_dotenv
load_dotenv(BACKEND / ".env")

from app.services.director import direct_text  # noqa: E402
from app.services.narrator import generate_segment_audio, stitch_audio  # noqa: E402
from app.services.segmenter import segment_text, prepare_segment_text  # noqa: E402


MAX_CHARS = 1200  # ~60 seconds at typical narration speed


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


async def make_sample(name: str, book: str, text: str, voice: str, out_dir: Path) -> Path:
    excerpt = text.strip()[:MAX_CHARS]
    if len(excerpt) < 50:
        raise SystemExit("Excerpt too short — need at least 50 characters.")

    print(f"Directing {len(excerpt)} chars...")
    directed = await direct_text(excerpt, language="en")

    voice_map = {"Character": "Aoede" if voice != "Aoede" else "Puck"}
    segments = segment_text(directed, voice, voice_map)
    if not segments:
        raise SystemExit("Director produced no segments — try a longer excerpt.")

    print(f"Narrating {len(segments)} segments...")
    pcm_chunks = []
    for i, seg in enumerate(segments, 1):
        seg_text = prepare_segment_text(seg)
        pcm = await generate_segment_audio(seg_text, seg.narrator_voice, seg.character_voice)
        pcm_chunks.append(pcm)
        print(f"  segment {i}/{len(segments)} — {len(seg_text)} chars done")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slugify(name)}__{slugify(book)}.wav"
    stitch_audio(pcm_chunks, str(out_path))
    return out_path


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--name", required=True, help="Author name (used in filename)")
    p.add_argument("--book", required=True, help="Book title (used in filename)")
    p.add_argument("--text-file", help="Path to a file containing the excerpt")
    p.add_argument("--text", help="Inline excerpt (alternative to --text-file)")
    p.add_argument("--voice", default="Kore", help="Narrator voice (default: Kore)")
    p.add_argument("--out", default="samples", help="Output directory (default: samples/)")
    args = p.parse_args()

    if args.text_file:
        text = Path(args.text_file).read_text()
    elif args.text:
        text = args.text
    else:
        p.error("Provide --text or --text-file")

    path = asyncio.run(make_sample(args.name, args.book, text, args.voice, Path(args.out)))
    size_kb = os.path.getsize(path) / 1024
    print(f"\nWrote {path}  ({size_kb:.1f} KB)")
    print("Attach this file to your DM/email.")


if __name__ == "__main__":
    main()
