"""
Antigravity — OneEye Backend
FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.api import router as api_router

# ---------- Logging ---------- #

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-24s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("antigravity")


# ---------- Lifespan ---------- #

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Antigravity backend starting up...")
    yield
    logger.info("🛑 Antigravity backend shutting down.")


# ---------- App ---------- #

app = FastAPI(
    title="OneEye — Antigravity Backend",
    description="Real-time road hazard detection & agentic safety monitor powered by Gemini 2.0 Flash.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router)


# ---------- Health ---------- #

@app.get("/")
async def root():
    return {
        "service": "OneEye Antigravity",
        "status": "operational",
        "version": "0.1.0",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
