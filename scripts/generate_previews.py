#!/usr/bin/env python3
"""Generate voice preview audio files for all voice+language combinations.

Usage:
    GEMINI_API_KEY=... python scripts/generate_previews.py

Outputs WAV files to frontend/public/previews/{voice}_{lang}.wav
Skips files that already exist (safe to re-run).
"""

import asyncio
import base64
import json
import os
import sys
import wave

import httpx

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
TTS_MODELS = [
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-pro-preview-tts",
    "gemini-2.5-flash-preview-tts",
]

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
    "bn": "একবার, এক সুদূর দেশে, একটি দয়ালু ও কৌতূহলী মেয়ে বাস করত।",
    "gu": "એક સમયે, એક દૂરના દેશમાં, એક દયાળુ અને જિજ્ઞાસુ છોકરી રહેતી હતી.",
    "id": "Pada suatu hari, di negeri yang jauh, hiduplah seorang gadis yang baik hati dan penuh rasa ingin tahu.",
    "kn": "ಒಮ್ಮೆ, ದೂರದ ದೇಶದಲ್ಲಿ, ಒಬ್ಬ ದಯಾಳು ಮತ್ತು ಕುತೂಹಲ ಹುಡುಗಿ ವಾಸಿಸುತ್ತಿದ್ದಳು.",
    "ml": "ഒരു കാലത്ത്, വിദൂര ദേശത്ത്, ഒരു ദയയുള്ളതും ജിജ്ഞാസുവുമായ പെൺകുട്ടി താമസിച്ചിരുന്നു.",
    "mr": "एकदा, एका दूरच्या देशात, एक दयाळू आणि जिज्ञासू मुलगी राहत होती.",
    "ta": "ஒரு காலத்தில், தொலைதூர நாட்டில், ஒரு கருணையுள்ள மற்றும் ஆர்வமுள்ள சிறுமி வாழ்ந்தாள்.",
    "te": "ఒకప్పుడు, ఒక దూర దేశంలో, ఒక దయగల మరియు ఆసక్తిగల అమ్మాయి నివసించేది.",
    "th": "กาลครั้งหนึ่ง ในดินแดนอันไกลโพ้น มีเด็กหญิงใจดีและอยากรู้อยากเห็นอาศัยอยู่",
    "uk": "Давним-давно, у далекій країні, жила добра і допитлива дівчинка.",
    "vi": "Ngày xửa ngày xưa, ở một vùng đất xa xôi, có một cô gái tốt bụng và ham học hỏi.",
}

ALL_LANGS = list(PREVIEW_TEXTS.keys())
MAJOR_LANGS = ["en", "zh", "de", "fr", "hi", "ja", "ko", "pt", "es"]

VOICES = [
    {"id": "Zephyr", "languages": MAJOR_LANGS},
    {"id": "Puck", "languages": ALL_LANGS},
    {"id": "Charon", "languages": ALL_LANGS},
    {"id": "Kore", "languages": ALL_LANGS},
    {"id": "Fenrir", "languages": ALL_LANGS},
    {"id": "Leda", "languages": ALL_LANGS},
    {"id": "Orus", "languages": MAJOR_LANGS},
    {"id": "Aoede", "languages": MAJOR_LANGS},
    {"id": "Callirrhoe", "languages": ["en"]},
    {"id": "Autonoe", "languages": ["en"]},
    {"id": "Enceladus", "languages": ["en"]},
    {"id": "Iapetus", "languages": ["en"]},
    {"id": "Umbriel", "languages": ["en"]},
    {"id": "Algieba", "languages": ["en"]},
    {"id": "Despina", "languages": ["en"]},
    {"id": "Erinome", "languages": ["en"]},
    {"id": "Algenib", "languages": ["en"]},
    {"id": "Rasalgethi", "languages": ["en"]},
    {"id": "Laomedeia", "languages": ["en"]},
    {"id": "Achernar", "languages": ["en"]},
    {"id": "Alnilam", "languages": ["en"]},
    {"id": "Schedar", "languages": ["en"]},
    {"id": "Gacrux", "languages": ["en"]},
    {"id": "Pulcherrima", "languages": ["en"]},
    {"id": "Achird", "languages": ["en"]},
    {"id": "Zubenelgenubi", "languages": ["en"]},
    {"id": "Vindemiatrix", "languages": ["en"]},
    {"id": "Sadachbia", "languages": ["en"]},
    {"id": "Sadaltager", "languages": ["en"]},
    {"id": "Sulafat", "languages": ["en"]},
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "previews")


async def generate_one(api_key: str, voice: str, lang: str) -> bool:
    out_path = os.path.join(OUTPUT_DIR, f"{voice}_{lang}.wav")
    if os.path.exists(out_path):
        print(f"  SKIP {voice}_{lang} (exists)")
        return True

    text = PREVIEW_TEXTS.get(lang, PREVIEW_TEXTS["en"])
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice}
                }
            },
        },
    }

    for model in TTS_MODELS:
        url = f"{API_BASE}/{model}:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(url, json=payload)
                data = resp.json()
        except Exception as e:
            print(f"  ERR {voice}_{lang} [{model}]: {e}")
            continue

        if "error" in data:
            code = data["error"]["code"]
            if code == 429:
                print(f"  RATE LIMITED — stopping. Re-run later to continue.")
                return False
            print(f"  ERR {voice}_{lang} [{model}]: {code}")
            continue

        try:
            audio_b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            pcm = base64.b64decode(audio_b64)
            with wave.open(out_path, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(pcm)
            print(f"  OK  {voice}_{lang} [{model}]")
            return True
        except (KeyError, IndexError):
            continue

    print(f"  FAIL {voice}_{lang} (all models failed)")
    return True


async def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Set GEMINI_API_KEY environment variable")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    pairs = []
    for v in VOICES:
        for lang in v["languages"]:
            pairs.append((v["id"], lang))

    print(f"Generating {len(pairs)} preview files...")
    generated = 0
    for voice, lang in pairs:
        ok = await generate_one(api_key, voice, lang)
        if not ok:
            print(f"\nStopped at {generated}/{len(pairs)}. Re-run to continue.")
            break
        generated += 1
        await asyncio.sleep(1.5)

    print(f"\nDone: {generated}/{len(pairs)} files in {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
