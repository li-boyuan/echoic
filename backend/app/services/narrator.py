from google import genai
from google.genai import types

from app.config import settings


async def narrate_text(directed_text: str, output_path: str) -> str:
    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=directed_text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                )
            ),
        ),
    )

    audio_data = response.candidates[0].content.parts[0].inline_data.data

    with open(output_path, "wb") as f:
        f.write(audio_data)

    return output_path
