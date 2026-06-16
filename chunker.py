"""
Text chunking logic with page number tracking.

Uses LangChain's RecursiveCharacterTextSplitter under the hood and returns
enriched chunk objects that carry the source page number alongside the text.
"""

import logging
import os
from dataclasses import dataclass
from typing import List

from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))


@dataclass
class TextChunk:
    text: str
    page_number: int   # 1-indexed page the chunk originates from
    chunk_index: int   # global chunk index across the whole document


def chunk_pages(pages: List[dict]) -> List[TextChunk]:
    """
    Split a list of page dicts into overlapping text chunks.

    Args:
        pages: List of dicts with keys ``page_number`` (int, 1-indexed)
               and ``text`` (str).

    Returns:
        Ordered list of TextChunk objects.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    chunks: List[TextChunk] = []
    global_index = 0

    for page in pages:
        page_number: int = page["page_number"]
        text: str = page["text"].strip()

        if not text:
            logger.debug("Page %d is empty — skipping.", page_number)
            continue

        page_chunks: List[str] = splitter.split_text(text)
        for raw_chunk in page_chunks:
            clean = raw_chunk.strip()
            if not clean:
                continue
            chunks.append(
                TextChunk(
                    text=clean,
                    page_number=page_number,
                    chunk_index=global_index,
                )
            )
            global_index += 1

    logger.info(
        "Chunked %d page(s) into %d chunk(s) "
        "(chunk_size=%d, overlap=%d).",
        len(pages),
        len(chunks),
        CHUNK_SIZE,
        CHUNK_OVERLAP,
    )
    return chunks
