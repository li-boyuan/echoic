import io
import wave

from google import genai
from google.genai import types

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


async def narrate_text(directed_text: str, output_path: str, voice: str = "Kore") -> str:
    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=directed_text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                )
            ),
        ),
    )

    pcm_data = response.candidates[0].content.parts[0].inline_data.data

    wav_path = output_path.rsplit(".", 1)[0] + ".wav"
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_data)

    if output_path.endswith(".mp3"):
        _convert_wav_to_mp3(wav_path, output_path)
        import os
        os.remove(wav_path)
    else:
        output_path = wav_path

    return output_path


def _convert_wav_to_mp3(wav_path: str, mp3_path: str):
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_wav(wav_path)
        audio.export(mp3_path, format="mp3", bitrate="192k")
    except Exception:
        import shutil
        shutil.copy(wav_path, mp3_path.rsplit(".", 1)[0] + ".wav")
