"""
PostgreSQL database models and connection management using SQLAlchemy.
"""

import logging
import os
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Engine & session factory
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_db",
)

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Base model
# ---------------------------------------------------------------------------


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# ORM models
# ---------------------------------------------------------------------------


class Document(Base):
    """Represents an uploaded document stored in the system."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(512), nullable=False)
    original_filename = Column(String(512), nullable=False)
    file_size = Column(BigInteger, nullable=False, default=0)
    mime_type = Column(String(128), nullable=False, default="application/pdf")
    total_pages = Column(Integer, nullable=False, default=0)
    total_chunks = Column(Integer, nullable=False, default=0)
    chroma_collection = Column(String(256), nullable=False)
    status = Column(String(64), nullable=False, default="processing")  # processing | ready | error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "total_pages": self.total_pages,
            "total_chunks": self.total_chunks,
            "chroma_collection": self.chroma_collection,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """Create all tables (idempotent)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialised.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
