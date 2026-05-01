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

LANGUAGES = [
    {"code": "en", "name": "English"},
    {"code": "zh", "name": "Chinese (Mandarin)"},
    {"code": "de", "name": "German"},
    {"code": "fr", "name": "French"},
    {"code": "hi", "name": "Hindi"},
    {"code": "ja", "name": "Japanese"},
    {"code": "ko", "name": "Korean"},
    {"code": "pt", "name": "Portuguese"},
    {"code": "es", "name": "Spanish"},
    {"code": "ar", "name": "Arabic"},
    {"code": "bn", "name": "Bengali"},
    {"code": "gu", "name": "Gujarati"},
    {"code": "id", "name": "Indonesian"},
    {"code": "it", "name": "Italian"},
    {"code": "kn", "name": "Kannada"},
    {"code": "ml", "name": "Malayalam"},
    {"code": "mr", "name": "Marathi"},
    {"code": "nl", "name": "Dutch"},
    {"code": "pl", "name": "Polish"},
    {"code": "ru", "name": "Russian"},
    {"code": "ta", "name": "Tamil"},
    {"code": "te", "name": "Telugu"},
    {"code": "th", "name": "Thai"},
    {"code": "tr", "name": "Turkish"},
    {"code": "uk", "name": "Ukrainian"},
    {"code": "vi", "name": "Vietnamese"},
]

VOICES = [
    {"id": "Zephyr", "description": "Bright", "languages": ["en"]},
    {"id": "Puck", "description": "Upbeat", "languages": ["en"]},
    {"id": "Charon", "description": "Informative", "languages": ["en"]},
    {"id": "Kore", "description": "Firm", "languages": ["en"]},
    {"id": "Fenrir", "description": "Excitable", "languages": ["en"]},
    {"id": "Leda", "description": "Youthful", "languages": ["en"]},
    {"id": "Orus", "description": "Firm", "languages": ["en"]},
    {"id": "Aoede", "description": "Breezy", "languages": ["en"]},
    {"id": "Callirrhoe", "description": "Easy-going", "languages": ["en"]},
    {"id": "Autonoe", "description": "Bright", "languages": ["en"]},
    {"id": "Enceladus", "description": "Breathy", "languages": ["en"]},
    {"id": "Iapetus", "description": "Clear", "languages": ["en"]},
    {"id": "Umbriel", "description": "Easy-going", "languages": ["en"]},
    {"id": "Algieba", "description": "Smooth", "languages": ["en"]},
    {"id": "Despina", "description": "Smooth", "languages": ["en"]},
    {"id": "Erinome", "description": "Clear", "languages": ["en"]},
    {"id": "Algenib", "description": "Gravelly", "languages": ["en"]},
    {"id": "Rasalgethi", "description": "Informative", "languages": ["en"]},
    {"id": "Laomedeia", "description": "Upbeat", "languages": ["en"]},
    {"id": "Achernar", "description": "Soft", "languages": ["en"]},
    {"id": "Alnilam", "description": "Firm", "languages": ["en"]},
    {"id": "Schedar", "description": "Even", "languages": ["en"]},
    {"id": "Gacrux", "description": "Mature", "languages": ["en"]},
    {"id": "Pulcherrima", "description": "Forward", "languages": ["en"]},
    {"id": "Achird", "description": "Friendly", "languages": ["en"]},
    {"id": "Zubenelgenubi", "description": "Casual", "languages": ["en"]},
    {"id": "Vindemiatrix", "description": "Gentle", "languages": ["en"]},
    {"id": "Sadachbia", "description": "Lively", "languages": ["en"]},
    {"id": "Sadaltager", "description": "Knowledgeable", "languages": ["en"]},
    {"id": "Sulafat", "description": "Warm", "languages": ["en"]},
    {"id": "Leda", "description": "Youthful", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es", "ar", "bn", "gu", "id", "it", "kn", "ml", "mr", "nl", "pl", "ru", "ta", "te", "th", "tr", "uk", "vi"]},
    {"id": "Kore", "description": "Firm", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es", "ar", "bn", "gu", "id", "it", "kn", "ml", "mr", "nl", "pl", "ru", "ta", "te", "th", "tr", "uk", "vi"]},
    {"id": "Charon", "description": "Informative", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es", "ar", "bn", "gu", "id", "it", "kn", "ml", "mr", "nl", "pl", "ru", "ta", "te", "th", "tr", "uk", "vi"]},
    {"id": "Fenrir", "description": "Excitable", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es", "ar", "bn", "gu", "id", "it", "kn", "ml", "mr", "nl", "pl", "ru", "ta", "te", "th", "tr", "uk", "vi"]},
    {"id": "Puck", "description": "Upbeat", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es", "ar", "bn", "gu", "id", "it", "kn", "ml", "mr", "nl", "pl", "ru", "ta", "te", "th", "tr", "uk", "vi"]},
    {"id": "Aoede", "description": "Breezy", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es"]},
    {"id": "Orus", "description": "Firm", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es"]},
    {"id": "Zephyr", "description": "Bright", "languages": ["zh", "de", "fr", "hi", "ja", "ko", "pt", "es"]},
]

# Deduplicate: a voice appears once per unique id, collect all its languages
_voice_map: dict[str, dict] = {}
for v in VOICES:
    if v["id"] in _voice_map:
        _voice_map[v["id"]]["languages"] = list(set(_voice_map[v["id"]]["languages"] + v["languages"]))
    else:
        _voice_map[v["id"]] = {"id": v["id"], "description": v["description"], "languages": list(v["languages"])}
VOICES = list(_voice_map.values())

# Legacy compat
AVAILABLE_VOICES = [{"id": v["id"], "name": v["id"], "description": v["description"]} for v in VOICES]


def get_voices_for_language(lang_code: str) -> list[dict]:
    return [v for v in VOICES if lang_code in v["languages"]]

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

TTS_MODELS = [
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-pro-preview-tts",
    "gemini-2.5-flash-preview-tts",
]


def _silence(seconds: float) -> bytes:
    return b"\x00" * int(SAMPLE_RATE * SAMPLE_WIDTH * CHANNELS * seconds)


def _clean_for_tts(text: str) -> str:
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def _try_model(model: str, payload: dict) -> dict | None:
    """Try a single model with retries. Returns response data or None on exhaustion."""
    url = f"{API_BASE}/{model}:generateContent?key={settings.gemini_api_key}"

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=300) as client:
                resp = await client.post(url, json=payload)
                data = resp.json()
        except httpx.TimeoutException:
            logger.warning("[%s] Timeout (attempt %d)", model, attempt + 1)
            if attempt < 2:
                await asyncio.sleep(10 * (attempt + 1))
                continue
            return None

        if "error" in data:
            code = data["error"]["code"]
            if code in (429, 500, 503) and attempt < 2:
                wait = 10 * (attempt + 1)
                logger.warning("[%s] Error %d, retrying in %ds (attempt %d)", model, code, wait, attempt + 1)
                await asyncio.sleep(wait)
                continue
            logger.warning("[%s] Failed with %d: %s", model, code, data["error"]["message"][:100])
            return None

        return data

    return None


async def generate_segment_audio(
    text: str, narrator_voice: str, character_voice: str
) -> bytes:
    """Generate audio with model fallback chain."""
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

    for model in TTS_MODELS:
        data = await _try_model(model, payload)
        if data is None:
            logger.warning("Model %s exhausted, trying next", model)
            continue

        candidate = data.get("candidates", [{}])[0]
        finish_reason = candidate.get("finishReason", "")

        if finish_reason == "OTHER" or "copyrighted" in candidate.get("finishMessage", ""):
            logger.warning("TTS content filtered (copyright): %s — inserting silence", text[:80])
            return _silence(1.0)

        try:
            audio_b64 = candidate["content"]["parts"][0]["inlineData"]["data"]
            logger.info("TTS segment generated via %s", model)
            return base64.b64decode(audio_b64)
        except (KeyError, IndexError):
            logger.error("[%s] Unexpected response: %s", model, json.dumps(data)[:500])
            continue

    raise RuntimeError("All TTS models failed")


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
