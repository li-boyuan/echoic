import asyncio
import base64
import json
import logging
import re
import wave

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SAMPLE_RATE = 24000
SAMPLE_WIDTH = 2
CHANNELS = 1

AVAILABLE_VOICES = [
    {"id": "Kore", "name": "Kore", "description": "Warm, clear female voice"},
    {"id": "Charon", "name": "Charon", "description": "Deep, authoritative male voice"},
    {"id": "Fenrir", "name": "Fenrir", "description": "Calm, steady male voice"},
    {"id": "Aoede", "name": "Aoede", "description": "Bright, expressive female voice"},
    {"id": "Puck", "name": "Puck", "description": "Energetic, youthful voice"},
    {"id": "Leda", "name": "Leda", "description": "Soft, gentle female voice"},
]

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent"


def _silence(seconds: float) -> bytes:
    return b"\x00" * int(SAMPLE_RATE * SAMPLE_WIDTH * CHANNELS * seconds)


def _clean_for_tts(text: str) -> str:
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def generate_segment_audio(
    text: str, narrator_voice: str, character_voice: str
) -> bytes:
    """Generate audio for a single segment with Narrator + Character voices."""
    url = f"{API_URL}?key={settings.gemini_api_key}"

    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "multiSpeakerVoiceConfig": {
                    "speakerVoiceConfigs": [
                        {
                            "speaker": "Narrator",
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {"voiceName": narrator_voice}
                            },
                        },
                        {
                            "speaker": "Character",
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {"voiceName": character_voice}
                            },
                        },
                    ]
                }
            },
        },
    }

    for attempt in range(5):
        try:
            async with httpx.AsyncClient(timeout=300) as client:
                resp = await client.post(url, json=payload)
                data = resp.json()
        except httpx.TimeoutException:
            if attempt < 4:
                wait = 10 * (attempt + 1)
                logger.warning("TTS request timed out, retrying in %ds (attempt %d)", wait, attempt + 1)
                await asyncio.sleep(wait)
                continue
            raise RuntimeError("TTS request timed out after 5 attempts")

        if "error" in data:
            code = data["error"]["code"]
            if code == 429 and attempt < 4:
                wait = 15 * (attempt + 1)
                logger.warning("Rate limited, retrying in %ds (attempt %d)", wait, attempt + 1)
                await asyncio.sleep(wait)
                continue
            raise RuntimeError(f"{code} {data['error']['message']}")

        candidate = data.get("candidates", [{}])[0]
        finish_reason = candidate.get("finishReason", "")

        if finish_reason == "OTHER" or "copyrighted" in candidate.get("finishMessage", ""):
            logger.warning(
                "TTS content filtered (copyright): %s — inserting silence",
                text[:80],
            )
            return _silence(1.0)

        try:
            audio_b64 = candidate["content"]["parts"][0]["inlineData"]["data"]
            return base64.b64decode(audio_b64)
        except (KeyError, IndexError) as e:
            logger.error("Unexpected TTS response: %s", json.dumps(data)[:500])
            if attempt < 4:
                await asyncio.sleep(10)
                continue
            raise RuntimeError(f"TTS returned unexpected response: {e}")

    raise RuntimeError("Max retries exceeded for TTS generation")


def stitch_audio(pcm_chunks: list[bytes], output_path: str) -> str:
    """Combine multiple PCM audio chunks into a single WAV file."""
    wav_path = output_path.rsplit(".", 1)[0] + ".wav"
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        for chunk in pcm_chunks:
            wf.writeframes(chunk)

    if output_path.endswith(".mp3") and _has_mp3_support():
        from pydub import AudioSegment
        import os

        audio = AudioSegment.from_wav(wav_path)
        audio.export(output_path, format="mp3", bitrate="192k")
        os.remove(wav_path)
        return output_path

    return wav_path


async def narrate_text(
    directed_text: str,
    output_path: str,
    voice: str = "Kore",
    character_voice: str = "Aoede",
) -> str:
    """Simple single-segment narration (backward compatible)."""
    clean_text = _clean_for_tts(directed_text)
    if not clean_text:
        raise ValueError("No text to narrate after cleaning")

    pcm_data = await generate_segment_audio(clean_text, voice, character_voice)
    return stitch_audio([pcm_data], output_path)


def _has_mp3_support() -> bool:
    try:
        from pydub import AudioSegment
        return True
    except ImportError:
        return False
