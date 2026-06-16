"""
FastAPI application entry-point.

Wires together:
  • CORS middleware
  • Lifespan (DB init on start-up)
  • API routers  (/api/upload, /api/query, /api/documents)
  • Global exception handler
  • Health-check endpoint
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import documents, query, upload
from app.db.postgres import init_db

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup / shutdown tasks."""
    logger.info("Starting RAG backend…")
    await init_db()
    logger.info("Database ready.")
    yield
    logger.info("Shutting down RAG backend.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title=os.getenv("APP_TITLE", "RAG Document Q&A API"),
    description=(
        "Production-grade Retrieval-Augmented Generation API. "
        "Upload PDFs/DOCX, query them with GPT-4o, and receive cited answers."
    ),
    version=os.getenv("APP_VERSION", "1.0.0"),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

API_PREFIX = "/api"

app.include_router(upload.router, prefix=API_PREFIX, tags=["Upload"])
app.include_router(query.router, prefix=API_PREFIX, tags=["Query"])
app.include_router(documents.router, prefix=API_PREFIX, tags=["Documents"])


# ---------------------------------------------------------------------------
# Health-check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok", "version": os.getenv("APP_VERSION", "1.0.0")}


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred."},
    )
