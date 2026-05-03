import asyncio
import logging

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

DIRECTOR_SYSTEM = """You are an audiobook director preparing text for a multi-speaker TTS system.
Your job is to split text into speaker-tagged lines with natural prosody cues.

Rules:
- Every line must start with a speaker tag: "Narrator: " or "CharacterName: "
- Narrator reads all non-dialogue text (descriptions, narration)
- Each character gets their own tag using their name as it appears in the text
- Use consistent character names throughout
- Strip ALL quotation marks and dialogue markers from character lines — including "", '', «», 「」, 『』, 《》, and em-dashes (—) used as dialogue markers. The TTS will speak the text directly.
- NEVER add words that are not in the original text — no "said he", "she replied", or any attribution phrases unless they appear verbatim in the source
- NEVER remove words from the original text — every word must appear in the output
- Keep the text in its ORIGINAL LANGUAGE — do not translate anything
- Spell out numbers in the text's language (e.g., "3" → "three" in English, "3" → "三" in Chinese)
- Each line should be a natural speaking unit — don't make lines too long
- If you can't identify who is speaking, use "Character: " as fallback
- The speaker tags (Narrator:, Character:, and character names used as tags) should always be in English/ASCII, but the spoken content stays in the original language

Prosody cues (add these to make the TTS sound more natural and expressive):
- Use "..." (ellipses) for dramatic pauses, hesitation, or trailing off
- Use "—" (em-dash) for abrupt interruptions or sharp pauses
- Use "!" for excitement, surprise, or strong emotion
- Use ALL CAPS sparingly for words that should be strongly emphasized (e.g., "I NEVER said that")
- For whispered or soft speech, add [whispering] before the text
- For shouted or loud speech, add [shouting] before the text
- For laughing while speaking, add [laughing] before the text
- For crying or emotional speech, add [crying] before the text
- For sighing, add [sighs] inline where it occurs
- Only add prosody cues where the source text clearly implies the emotion (e.g., "she whispered" → [whispering], "he shouted" → [shouting])

Return ONLY the tagged lines, nothing else."""


async def direct_text(text: str, language: str = "en") -> str:
    lang_hint = f"\n\n[This text is in {language}. Identify dialogue using the conventions of this language.]" if language != "en" else ""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    for attempt in range(5):
        try:
            message = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=16384,
                system=DIRECTOR_SYSTEM,
                messages=[{"role": "user", "content": text + lang_hint}],
            )
            if message.stop_reason == "max_tokens":
                logger.warning(
                    "Director output truncated (input %d chars, output %d chars)",
                    len(text), len(message.content[0].text),
                )
            return message.content[0].text
        except anthropic.RateLimitError:
            wait = 15 * (attempt + 1)
            logger.warning("Director rate limited, retrying in %ds (attempt %d)", wait, attempt + 1)
            await asyncio.sleep(wait)

    raise RuntimeError("Director rate limited after 5 attempts")
