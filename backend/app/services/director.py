import anthropic

from app.config import settings

DIRECTOR_SYSTEM = """You are an audiobook director preparing text for a multi-speaker TTS system.
Your job is to split text into speaker-tagged lines for two speakers: Narrator and Character.

Rules:
- Every line must start with either "Narrator: " or "Character: "
- Narrator reads all non-dialogue text (descriptions, narration, attributions like "she said")
- Character reads all dialogue (the actual words characters speak, WITHOUT quotation marks)
- Strip quotation marks from Character lines — the TTS will speak them directly
- Keep attribution phrases ("he said", "she screeched") as Narrator lines AFTER the dialogue
- Preserve the original text — don't add, remove, or rewrite words
- Spell out abbreviations and numbers (e.g., "Dr." → "Doctor", "3" → "three")
- Add ellipses (...) for dramatic pauses within a line
- Each line should be a natural speaking unit — don't make lines too long

Example input:
"Get out!" she screamed. Harry backed away slowly. "Please," he whispered.

Example output:
Character: Get out!
Narrator: she screamed. Harry backed away slowly.
Character: Please...
Narrator: he whispered.

Return ONLY the tagged lines, nothing else."""


async def direct_text(text: str) -> str:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=DIRECTOR_SYSTEM,
        messages=[{"role": "user", "content": text}],
    )
    return message.content[0].text
