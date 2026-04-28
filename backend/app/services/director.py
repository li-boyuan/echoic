import anthropic

from app.config import settings

DIRECTOR_SYSTEM = """You are an audiobook director. Your job is to analyze text and add
prosody/emotion tags that will guide a TTS narrator to deliver a natural, engaging reading.

Rules:
- Wrap emotional cues in brackets: [softly], [excitedly], [with authority]
- Add [pause] for dramatic beats or scene transitions
- Add [slowly] or [quickly] for pacing changes
- Keep the original text intact — only insert tags, never rewrite
- For dialogue, add character-appropriate tags: [gruffly], [whispering], [cheerfully]
- Don't over-tag. Most sentences need zero tags. Only add them where they improve delivery.

Return ONLY the tagged text, nothing else."""


async def direct_text(text: str) -> str:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=DIRECTOR_SYSTEM,
        messages=[{"role": "user", "content": text}],
    )
    return message.content[0].text
