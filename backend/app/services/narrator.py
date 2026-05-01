import asyncio
import base64
import json
import logging
import os
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

ALL_LANGS = [l["code"] for l in LANGUAGES]
MAJOR_LANGS = ["en", "zh", "de", "fr", "hi", "ja", "ko", "pt", "es"]

VOICES = [
    # English-only voices
    {"id": "Zephyr", "gender": "Female", "description": "Bright", "languages": MAJOR_LANGS},
    {"id": "Puck", "gender": "Male", "description": "Upbeat", "languages": ALL_LANGS},
    {"id": "Charon", "gender": "Male", "description": "Informative", "languages": ALL_LANGS},
    {"id": "Kore", "gender": "Female", "description": "Firm", "languages": ALL_LANGS},
    {"id": "Fenrir", "gender": "Male", "description": "Excitable", "languages": ALL_LANGS},
    {"id": "Leda", "gender": "Female", "description": "Youthful", "languages": ALL_LANGS},
    {"id": "Orus", "gender": "Male", "description": "Firm", "languages": MAJOR_LANGS},
    {"id": "Aoede", "gender": "Female", "description": "Breezy", "languages": MAJOR_LANGS},
    {"id": "Callirrhoe", "gender": "Female", "description": "Easy-going", "languages": ["en"]},
    {"id": "Autonoe", "gender": "Female", "description": "Bright", "languages": ["en"]},
    {"id": "Enceladus", "gender": "Male", "description": "Breathy", "languages": ["en"]},
    {"id": "Iapetus", "gender": "Male", "description": "Clear", "languages": ["en"]},
    {"id": "Umbriel", "gender": "Male", "description": "Easy-going", "languages": ["en"]},
    {"id": "Algieba", "gender": "Male", "description": "Smooth", "languages": ["en"]},
    {"id": "Despina", "gender": "Female", "description": "Smooth", "languages": ["en"]},
    {"id": "Erinome", "gender": "Female", "description": "Clear", "languages": ["en"]},
    {"id": "Algenib", "gender": "Male", "description": "Gravelly", "languages": ["en"]},
    {"id": "Rasalgethi", "gender": "Male", "description": "Informative", "languages": ["en"]},
    {"id": "Laomedeia", "gender": "Female", "description": "Upbeat", "languages": ["en"]},
    {"id": "Achernar", "gender": "Male", "description": "Soft", "languages": ["en"]},
    {"id": "Alnilam", "gender": "Male", "description": "Firm", "languages": ["en"]},
    {"id": "Schedar", "gender": "Male", "description": "Even", "languages": ["en"]},
    {"id": "Gacrux", "gender": "Male", "description": "Mature", "languages": ["en"]},
    {"id": "Pulcherrima", "gender": "Female", "description": "Forward", "languages": ["en"]},
    {"id": "Achird", "gender": "Male", "description": "Friendly", "languages": ["en"]},
    {"id": "Zubenelgenubi", "gender": "Male", "description": "Casual", "languages": ["en"]},
    {"id": "Vindemiatrix", "gender": "Female", "description": "Gentle", "languages": ["en"]},
    {"id": "Sadachbia", "gender": "Female", "description": "Lively", "languages": ["en"]},
    {"id": "Sadaltager", "gender": "Male", "description": "Knowledgeable", "languages": ["en"]},
    {"id": "Sulafat", "gender": "Male", "description": "Warm", "languages": ["en"]},
]

AVAILABLE_VOICES = [{"id": v["id"], "name": v["id"], "description": f"{v['gender']} — {v['description']}"} for v in VOICES]


def get_voices_for_language(lang_code: str) -> list[dict]:
    return [v for v in VOICES if lang_code in v.get("languages", [])]

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

    blocked_by_all = True

    for model in TTS_MODELS:
        data = await _try_model(model, payload)
        if data is None:
            logger.warning("Model %s exhausted, trying next", model)
            continue

        # Check prompt-level block (PROHIBITED_CONTENT, etc.)
        block_reason = data.get("promptFeedback", {}).get("blockReason", "")
        if block_reason:
            logger.warning("[%s] Content blocked (%s): %s — trying next model", model, block_reason, text[:80])
            continue

        candidate = data.get("candidates", [{}])[0]
        finish_reason = candidate.get("finishReason", "")

        if finish_reason == "OTHER" or "copyrighted" in candidate.get("finishMessage", ""):
            logger.warning("TTS content filtered (copyright): %s — inserting silence", text[:80])
            return _silence(1.0)

        try:
            audio_b64 = candidate["content"]["parts"][0]["inlineData"]["data"]
            logger.info("TTS segment generated via %s", model)
            blocked_by_all = False
            return base64.b64decode(audio_b64)
        except (KeyError, IndexError):
            logger.error("[%s] Unexpected response: %s", model, json.dumps(data)[:500])
            continue

    if blocked_by_all:
        logger.warning("All models blocked content, inserting silence: %s", text[:80])
        return _silence(1.0)

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


PREVIEW_TEXTS = {
    "en": "Once upon a time, in a land far away, there lived a kind and curious young girl.",
    "zh": "从前，在一个遥远的地方，住着一个善良又好奇的小女孩。",
    "de": "Es war einmal, in einem fernen Land, da lebte ein freundliches und neugieriges Mädchen.",
    "fr": "Il était une fois, dans un pays lointain, une jeune fille gentille et curieuse.",
    "hi": "एक समय की बात है, एक दूर देश में, एक दयालु और जिज्ञासु लड़की रहती थी।",
    "ja": "むかしむかし、遠い国に、優しくて好奇心旺盛な女の子が住んでいました。",
    "ko": "옛날 옛적에, 먼 나라에 착하고 호기심 많은 소녀가 살았습니다.",
    "pt": "Era uma vez, em uma terra distante, vivia uma jovem gentil e curiosa.",
    "es": "Había una vez, en una tierra lejana, una joven amable y curiosa.",
    "ar": "في قديم الزمان، في أرض بعيدة، عاشت فتاة طيبة وفضولية.",
    "it": "C'era una volta, in una terra lontana, una ragazza gentile e curiosa.",
    "ru": "Давным-давно, в далёкой стране, жила добрая и любопытная девочка.",
    "nl": "Er was eens, in een ver land, een vriendelijk en nieuwsgierig meisje.",
    "pl": "Dawno, dawno temu, w odległej krainie, żyła miła i ciekawska dziewczynka.",
    "tr": "Bir zamanlar, uzak bir diyarda, nazik ve meraklı genç bir kız yaşarmış.",
}


async def generate_preview(voice_id: str, lang: str, output_dir: str) -> str | None:
    cache_path = f"{output_dir}/preview_{voice_id}_{lang}.wav"
    if os.path.exists(cache_path):
        return cache_path

    text = PREVIEW_TEXTS.get(lang, PREVIEW_TEXTS["en"])

    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice_id}
                }
            },
        },
    }

    for model in TTS_MODELS:
        data = await _try_model(model, payload)
        if data is None:
            continue
        try:
            audio_b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            pcm = base64.b64decode(audio_b64)
            os.makedirs(output_dir, exist_ok=True)
            stitch_audio([pcm], cache_path)
            return cache_path
        except (KeyError, IndexError):
            continue

    return None


def _has_mp3_support() -> bool:
    try:
        from pydub import AudioSegment
        return True
    except ImportError:
        return False
