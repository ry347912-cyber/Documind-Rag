"""
OpenAI text-embedding-ada-002 wrapper.

Provides both single-text and batch embedding helpers with retry logic
and structured logging.
"""

import asyncio
import logging
import os
from typing import List

import openai
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "100"))
MAX_RETRIES: int = int(os.getenv("EMBEDDING_MAX_RETRIES", "3"))
RETRY_DELAY: float = float(os.getenv("EMBEDDING_RETRY_DELAY", "1.0"))

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable is not set.")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


async def embed_text(text: str) -> List[float]:
    """Embed a single string and return its embedding vector."""
    vectors = await embed_batch([text])
    return vectors[0]


async def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Embed a list of strings in batches and return all embedding vectors
    in the same order as the input list.

    Args:
        texts: List of strings to embed.

    Returns:
        List of embedding vectors (List[float]).
    """
    if not texts:
        return []

    client = get_client()
    all_embeddings: List[List[float]] = []

    for batch_start in range(0, len(texts), EMBEDDING_BATCH_SIZE):
        batch = texts[batch_start : batch_start + EMBEDDING_BATCH_SIZE]

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=batch,
                )
                # Sort by index to preserve order (OpenAI returns them in order,
                # but we guard against edge cases.)
                sorted_data = sorted(response.data, key=lambda d: d.index)
                all_embeddings.extend([d.embedding for d in sorted_data])
                logger.debug(
                    "Embedded batch %d–%d (%d texts) successfully.",
                    batch_start,
                    batch_start + len(batch) - 1,
                    len(batch),
                )
                break
            except openai.RateLimitError:
                wait = RETRY_DELAY * attempt
                logger.warning(
                    "Rate limit hit on attempt %d/%d. Retrying in %.1fs…",
                    attempt,
                    MAX_RETRIES,
                    wait,
                )
                await asyncio.sleep(wait)
                if attempt == MAX_RETRIES:
                    raise
            except openai.OpenAIError as exc:
                logger.error("OpenAI embedding error: %s", exc)
                raise

    return all_embeddings
