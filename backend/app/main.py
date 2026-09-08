"""Unhinged API.

Why it exists (see docs/VISION.md):
  1. Serve & cache pregenerated unhinged profiles so browsers don't regenerate
     them (and so pre-generated photorealistic images can be attached later).
  2. Keep a single anonymous aggregate counter (no PII, no per-user data).

Deliberately account-free: /auth/* endpoints refuse, mirroring the client's
"Don't Login" / "Don't Signup" bit. No personal data is collected or stored.
"""

from __future__ import annotations

import os
import random
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import content, faces, generator, store

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

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
    return {"status": "ok", "service": "unhinged-api", "profiles": "unbounded", **faces.corpus_stats()}


@app.get("/api/corpus")
def corpus() -> dict[str, Any]:
    """Public stats on the growing face corpus."""
    return faces.corpus_stats()


@app.post("/api/admin/warm")
def admin_warm(request: Request, chunk: int = 40) -> Any:
    """Bank the next chunk of faces (scheduled). Token-gated."""
    if not ADMIN_TOKEN or request.headers.get("x-admin-token") != ADMIN_TOKEN:
        return Response(status_code=401)
    return faces.warm(max(1, min(chunk, 200)))


def _with_face(request: Request, p: dict[str, Any]) -> dict[str, Any]:
    """Attach a stable, absolute face URL (host-agnostic via the request)."""
    if not faces.ENABLED:
        return p
    return {**p, "image": f"{request.base_url}api/faces/{p['id']}"}


@app.get("/api/profiles")
def profiles(request: Request, cursor: int = 0, limit: int = 10) -> dict[str, Any]:
    """A page of cached profiles; wraps around for an endless deck."""
    data = generator.page(cursor, limit)
    return {**data, "profiles": [_with_face(request, p) for p in data["profiles"]]}


@app.get("/api/profiles/{pid}")
def profile(request: Request, pid: str) -> dict[str, Any]:
    p = generator.by_id(pid)
    return _with_face(request, p) if p else {"error": "not found"}


@app.get("/api/faces/{fid}")
def face(fid: str) -> Response:
    """Serve the cached photorealistic face for a profile (fetched on first use).
    404 → the frontend falls back to its procedural SVG avatar."""
    path = faces.get(fid)
    if not path:
        return Response(status_code=404)
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


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
