"""Quick smoke test for the director + narrator pipeline."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

SAMPLE_TEXT = """The old man sat alone in the corner of the café, stirring his coffee
with slow, deliberate movements. "I've been waiting for you," he said, his voice barely
above a whisper. The door creaked open, letting in a gust of cold wind. She stepped
inside, shaking the rain from her umbrella. "You shouldn't have come," she replied."""


async def main():
    print("=== Testing Director (Claude Haiku) ===")
    from app.services.director import direct_text

    directed = await direct_text(SAMPLE_TEXT)
    print(directed)
    print()

    print("=== Testing Narrator (Gemini TTS) ===")
    from app.services.narrator import narrate_text

    os.makedirs("output", exist_ok=True)
    output_path = await narrate_text(directed, "output/test.wav")
    size = os.path.getsize(output_path)
    print(f"Audio saved to {output_path} ({size / 1024:.1f} KB)")


if __name__ == "__main__":
    asyncio.run(main())
