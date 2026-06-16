"""
ChromaDB vector store wrapper.

Exposes store(), search(), and delete() helpers used throughout the app.
Each document gets its own named Chroma collection so deletions are O(1)
(drop the whole collection) and cross-document searches are done by querying
multiple collections.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

CHROMA_HOST: str = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", "8001"))
CHROMA_MODE: str = os.getenv("CHROMA_MODE", "http")          # "http" | "local"
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
TOP_K: int = int(os.getenv("VECTOR_SEARCH_TOP_K", "5"))

_client: Optional[chromadb.ClientAPI] = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is not None:
        return _client

    if CHROMA_MODE == "http":
        logger.info("Connecting to ChromaDB HTTP server at %s:%d.", CHROMA_HOST, CHROMA_PORT)
        _client = chromadb.HttpClient(
            host=CHROMA_HOST,
            port=CHROMA_PORT,
            settings=Settings(anonymized_telemetry=False),
        )
    else:
        logger.info("Using local persistent ChromaDB at %s.", CHROMA_PERSIST_DIR)
        _client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )

    return _client


def _collection_name(document_id: int) -> str:
    """Derive a deterministic Chroma collection name from a document ID."""
    return f"doc_{document_id}"


def store(
    document_id: int,
    chunk_texts: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
) -> None:
    """
    Store a batch of chunk embeddings in a per-document Chroma collection.

    Args:
        document_id:  PostgreSQL PK of the document.
        chunk_texts:  Raw text of each chunk.
        embeddings:   Pre-computed embedding vectors (same length as chunk_texts).
        metadatas:    List of metadata dicts (filename, page_number, chunk_index…).
    """
    client = get_chroma_client()
    collection_name = _collection_name(document_id)

    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"{document_id}_{i}" for i in range(len(chunk_texts))]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunk_texts,
        metadatas=metadatas,
    )
    logger.info(
        "Stored %d chunks in Chroma collection '%s'.",
        len(chunk_texts),
        collection_name,
    )


def search(
    query_embedding: List[float],
    document_ids: List[int],
    top_k: int = TOP_K,
) -> List[Dict[str, Any]]:
    """
    Search across multiple per-document Chroma collections.

    Args:
        query_embedding: Embedded query vector.
        document_ids:    Which document collections to search.
        top_k:           Total results to return (spread across collections).

    Returns:
        List of result dicts sorted by distance (ascending = most similar first).
        Each dict has: text, metadata, distance.
    """
    client = get_chroma_client()
    results: List[Dict[str, Any]] = []

    per_collection_k = max(top_k, 3)  # fetch a few extras to re-rank globally

    for doc_id in document_ids:
        collection_name = _collection_name(doc_id)
        try:
            collection = client.get_collection(name=collection_name)
        except Exception:
            logger.warning("Collection '%s' not found — skipping.", collection_name)
            continue

        try:
            res = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(per_collection_k, collection.count()),
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:
            logger.error("Chroma query failed for collection '%s': %s", collection_name, exc)
            continue

        docs = res["documents"][0]
        metas = res["metadatas"][0]
        distances = res["distances"][0]

        for text, meta, dist in zip(docs, metas, distances):
            results.append({"text": text, "metadata": meta, "distance": dist})

    # Global re-rank: lower cosine distance = more similar
    results.sort(key=lambda r: r["distance"])
    return results[:top_k]


def delete(document_id: int) -> None:
    """
    Delete the entire Chroma collection for a document.

    Args:
        document_id: PostgreSQL PK of the document to remove.
    """
    client = get_chroma_client()
    collection_name = _collection_name(document_id)
    try:
        client.delete_collection(name=collection_name)
        logger.info("Deleted Chroma collection '%s'.", collection_name)
    except Exception as exc:
        logger.warning(
            "Could not delete collection '%s' (may not exist): %s",
            collection_name,
            exc,
        )
