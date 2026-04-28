from pathlib import Path


def extract_text(filepath: str) -> str:
    path = Path(filepath)
    extractors = {
        ".txt": _extract_txt,
        ".pdf": _extract_pdf,
        ".epub": _extract_epub,
        ".docx": _extract_docx,
    }
    extractor = extractors.get(path.suffix.lower())
    if not extractor:
        raise ValueError(f"Unsupported file type: {path.suffix}")
    return extractor(path)


def _extract_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _extract_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def _extract_epub(path: Path) -> str:
    import ebooklib
    from ebooklib import epub
    from lxml import etree

    book = epub.read_epub(str(path))
    texts = []
    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        tree = etree.fromstring(item.get_content())
        text = " ".join(tree.itertext())
        if text.strip():
            texts.append(text.strip())
    return "\n\n".join(texts)


def _extract_docx(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())


def chunk_text(text: str, max_chars: int = 4000) -> list[str]:
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
