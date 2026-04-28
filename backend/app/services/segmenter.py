import re
from dataclasses import dataclass

import anthropic

from app.config import settings
from app.services.narrator import AVAILABLE_VOICES

NARRATOR_TAG = "Narrator"

VOICE_DESCRIPTIONS = "\n".join(
    f"- {v['id']}: {v['description']}" for v in AVAILABLE_VOICES
)

CASTING_SYSTEM = f"""You are a casting director for an audiobook. Given a list of character names,
assign each one an appropriate voice from the available options.

Available voices:
{VOICE_DESCRIPTIONS}

Rules:
- Match voice personality to character (e.g., a young boy gets a youthful voice, an older woman gets a warm voice)
- Try not to reuse the same voice for different characters unless necessary
- Do NOT assign the narrator's voice to any character
- Return ONLY lines in the format: CharacterName=VoiceId
- One character per line, nothing else"""


@dataclass
class Segment:
    text: str
    narrator_voice: str
    character_voice: str
    character_name: str


def extract_characters(directed_text: str) -> list[str]:
    chars = []
    seen = set()
    for line in directed_text.strip().splitlines():
        match = re.match(r"^([^:]+):\s", line)
        if match:
            name = match.group(1).strip()
            if name != NARRATOR_TAG and name not in seen:
                chars.append(name)
                seen.add(name)
    return chars


async def assign_voices(
    characters: list[str], narrator_voice: str
) -> dict[str, str]:
    """Use Claude to intelligently assign voices based on character names."""
    if not characters:
        return {}

    available = [v["id"] for v in AVAILABLE_VOICES if v["id"] != narrator_voice]

    if len(characters) == 1:
        return {characters[0]: available[0]}

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    prompt = f"Narrator voice (do NOT assign this to characters): {narrator_voice}\n\nCharacters:\n"
    prompt += "\n".join(f"- {c}" for c in characters)

    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=CASTING_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    mapping = {}
    for line in message.content[0].text.strip().splitlines():
        if "=" in line:
            name, voice = line.split("=", 1)
            name = name.strip()
            voice = voice.strip()
            if voice in [v["id"] for v in AVAILABLE_VOICES] and voice != narrator_voice:
                mapping[name] = voice

    for char in characters:
        if char not in mapping:
            mapping[char] = available[0]

    return mapping


def segment_text(
    directed_text: str, narrator_voice: str, voice_map: dict[str, str]
) -> list[Segment]:
    lines = [l for l in directed_text.strip().splitlines() if l.strip()]
    segments: list[Segment] = []
    current_lines: list[str] = []
    current_char: str | None = None

    def flush():
        nonlocal current_lines, current_char
        if not current_lines:
            return
        char = current_char or "Character"
        char_voice = voice_map.get(char, voice_map.get("Character", "Aoede"))
        text = "\n".join(current_lines)
        segments.append(Segment(
            text=text,
            narrator_voice=narrator_voice,
            character_voice=char_voice,
            character_name=char,
        ))
        current_lines = []
        current_char = None

    for line in lines:
        match = re.match(r"^([^:]+):\s*(.*)$", line)
        if not match:
            current_lines.append(f"{NARRATOR_TAG}: {line}")
            continue

        speaker = match.group(1).strip()

        if speaker == NARRATOR_TAG:
            current_lines.append(line)
        else:
            if current_char is not None and speaker != current_char:
                flush()
            current_char = speaker
            current_lines.append(f"Character: {match.group(2)}")

    flush()
    return segments


def prepare_segment_text(segment: Segment) -> str:
    result_lines = []
    for line in segment.text.splitlines():
        match = re.match(r"^([^:]+):\s*(.*)$", line)
        if match:
            speaker = match.group(1).strip()
            content = match.group(2).strip()
            if speaker == NARRATOR_TAG:
                result_lines.append(f"Narrator: {content}")
            else:
                result_lines.append(f"Character: {content}")
        else:
            result_lines.append(f"Narrator: {line}")
    return "\n".join(result_lines)
