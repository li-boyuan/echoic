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
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)
    except ImportError:
        return _extract_pdf_fallback(path)


def _extract_pdf_fallback(path: Path) -> str:
    """Extract text from PDF using basic binary parsing (no dependencies)."""
    import re
    import zlib

    data = path.read_bytes()
    texts = []

    for match in re.finditer(rb"stream\r?\n(.+?)\r?\nendstream", data, re.DOTALL):
        chunk = match.group(1)
        try:
            decoded = zlib.decompress(chunk)
        except Exception:
            decoded = chunk

        text_parts = re.findall(rb"\(([^)]*)\)", decoded)
        if text_parts:
            line = b" ".join(text_parts)
            try:
                texts.append(line.decode("utf-8", errors="ignore"))
            except Exception:
                pass

        tj_parts = re.findall(rb"\[([^\]]*)\]TJ", decoded)
        for tj in tj_parts:
            parts = re.findall(rb"\(([^)]*)\)", tj)
            if parts:
                line = b"".join(parts)
                try:
                    texts.append(line.decode("utf-8", errors="ignore"))
                except Exception:
                    pass

    result = "\n".join(t.strip() for t in texts if t.strip())
    if not result:
        raise ValueError(
            "Could not extract text from PDF. Install 'pypdf' for better extraction: "
            "pip install pypdf"
        )
    return result


def _extract_epub(path: Path) -> str:
    try:
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
    except ImportError:
        return _extract_epub_fallback(path)


def _extract_epub_fallback(path: Path) -> str:
    """Extract text from EPUB using zipfile + stdlib xml (no dependencies)."""
    import re
    import xml.etree.ElementTree as ET
    import zipfile

    texts = []
    with zipfile.ZipFile(path) as zf:
        for name in zf.namelist():
            if name.endswith((".xhtml", ".html", ".htm", ".xml")):
                try:
                    content = zf.read(name).decode("utf-8", errors="ignore")
                    content = re.sub(r"<[^>]+>", " ", content)
                    content = re.sub(r"\s+", " ", content).strip()
                    if content and len(content) > 20:
                        texts.append(content)
                except Exception:
                    pass

    if not texts:
        raise ValueError(
            "Could not extract text from EPUB. Install 'ebooklib' for better extraction: "
            "pip install EbookLib lxml"
        )
    return "\n\n".join(texts)


def _extract_docx(path: Path) -> str:
    try:
        from docx import Document
        doc = Document(str(path))
        return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except ImportError:
        return _extract_docx_fallback(path)


def _extract_docx_fallback(path: Path) -> str:
    """Extract text from DOCX using zipfile + stdlib xml (no dependencies)."""
    import xml.etree.ElementTree as ET
    import zipfile

    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    with zipfile.ZipFile(path) as zf:
        xml_content = zf.read("word/document.xml")

    tree = ET.fromstring(xml_content)
    paragraphs = []
    for para in tree.iter(f"{ns}p"):
        texts = [node.text for node in para.iter(f"{ns}t") if node.text]
        if texts:
            paragraphs.append("".join(texts))

    if not paragraphs:
        raise ValueError(
            "Could not extract text from DOCX. Install 'python-docx' for better extraction: "
            "pip install python-docx"
        )
    return "\n\n".join(paragraphs)


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
