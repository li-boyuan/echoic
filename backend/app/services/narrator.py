import base64
import re
import wave

import httpx

from app.config import settings

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

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent"


def _clean_for_tts(text: str) -> str:
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _is_multi_speaker(text: str) -> bool:
    return bool(re.search(r"^(Narrator|Character):", text, re.MULTILINE))


async def narrate_text(
    directed_text: str,
    output_path: str,
    voice: str = "Kore",
    character_voice: str = "Aoede",
) -> str:
    clean_text = _clean_for_tts(directed_text)
    if not clean_text:
        raise ValueError("No text to narrate after cleaning")

    if _is_multi_speaker(clean_text):
        pcm_data = await _generate_multi_speaker(clean_text, voice, character_voice)
    else:
        pcm_data = await _generate_single_speaker(clean_text, voice)

    wav_path = output_path.rsplit(".", 1)[0] + ".wav"
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_data)

    if output_path.endswith(".mp3") and _has_mp3_support():
        from pydub import AudioSegment
        import os

        audio = AudioSegment.from_wav(wav_path)
        audio.export(output_path, format="mp3", bitrate="192k")
        os.remove(wav_path)
        return output_path

    return wav_path


async def _generate_multi_speaker(
    text: str, narrator_voice: str, character_voice: str
) -> bytes:
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

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, json=payload)
        data = resp.json()

    if "error" in data:
        raise RuntimeError(f"{data['error']['code']} {data['error']['message']}")

    audio_b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    return base64.b64decode(audio_b64)


async def _generate_single_speaker(text: str, voice: str) -> bytes:
    from google import genai
    from google.genai import types

    narration_prompt = (
        "Read the following text as a professional audiobook narrator. "
        "Perform dialogue expressively: match the emotion described. "
        "Narration should be calm; dialogue should be dramatic.\n\n"
        + text
    )

    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=narration_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                )
            ),
        ),
    )

    return response.candidates[0].content.parts[0].inline_data.data


def _has_mp3_support() -> bool:
    try:
        from pydub import AudioSegment
        return True
    except ImportError:
        return False
