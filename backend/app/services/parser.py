from pathlib import Path


def extract_text(filepath: str) -> str:
    path = Path(filepath)
    if path.suffix == ".txt":
        return path.read_text(encoding="utf-8")
    # TODO: add PDF, EPUB, DOCX parsers
    raise ValueError(f"Unsupported file type: {path.suffix}")


def chunk_text(text: str, max_chars: int = 4000) -> list[str]:
    """Split text into chunks at paragraph boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 > max_chars and current:
            chunks.append(current.strip())
            current = para
        else:
            current = f"{current}\n\n{para}" if current else para

    if current.strip():
        chunks.append(current.strip())

    return chunks
