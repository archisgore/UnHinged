"""Unhinged API.

Why it exists (see docs/VISION.md):
  1. Serve & cache pregenerated unhinged profiles so browsers don't regenerate
     them (and so pre-generated photorealistic images can be attached later).
  2. Keep a single anonymous aggregate counter (no PII, no per-user data).

Deliberately account-free: /auth/* endpoints refuse, mirroring the client's
"Don't Login" / "Don't Signup" bit. No personal data is collected or stored.
"""

from __future__ import annotations

import random
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import content, generator, store

ALLOWED_ORIGINS = [
    "https://unhinged.love",
    "https://www.unhinged.love",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8080",
]


@asynccontextmanager
async def lifespan(_app: FastAPI):  # type: ignore[no-untyped-def]
    store.init()
    yield


app = FastAPI(title="Unhinged API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "unhinged-api", "pack_size": generator.PACK_SIZE}


@app.get("/api/profiles")
def profiles(cursor: int = 0, limit: int = 10) -> dict[str, Any]:
    """A page of cached profiles; wraps around for an endless deck."""
    return generator.page(cursor, limit)


@app.get("/api/profiles/{pid}")
def profile(pid: str) -> dict[str, Any]:
    p = generator.by_id(pid)
    return p if p else {"error": "not found"}


@app.get("/api/copy")
def copy() -> dict[str, Any]:
    """Rotating marketing copy so the client can pull fresh lines (optional)."""
    return {"tagline": content.TAGLINE, "pitches": content.PITCHES}


@app.get("/api/stats")
def stats() -> dict[str, Any]:
    return {"swipes": store.get()}


@app.post("/api/tally")
def tally() -> dict[str, Any]:
    """Anonymous 'a swipe happened' ping. No identity, no body, no PII."""
    return {"swipes": store.bump(1)}


class Creds(BaseModel):
    email: str | None = None
    password: str | None = None


@app.post("/api/auth/login")
def login(_creds: Creds) -> dict[str, Any]:
    return {"ok": False, "refused": True, "reason": random.choice([
        "There is nothing to log into. That's the feature, not a bug.",
        "Login failed successfully. You have no account and never will.",
    ])}


@app.post("/api/auth/signup")
def signup(_creds: Creds) -> dict[str, Any]:
    return {"ok": False, "refused": True, "reason": random.choice([
        "You cannot sign up. We refuse to know you. You're welcome.",
        "Account NOT created. We collected nothing. Sleep well.",
    ])}
