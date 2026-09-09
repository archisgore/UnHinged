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

from . import content, faces, generator, llm, ratelimit, store, textgen

# Chat cost guards (tune via env / fly secrets).
CHAT_PER_IP = int(os.environ.get("CHAT_PER_IP", "15"))       # messages per window per IP
CHAT_WINDOW = float(os.environ.get("CHAT_WINDOW", "600"))    # window seconds (10 min)
CHAT_DAILY_CAP = int(os.environ.get("CHAT_DAILY_CAP", "4000"))  # global LLM calls/day

THROTTLE_LINES = [
    "whoa slow down — my one brain cell is rate-limited. gimme a sec.",
    "too many words too fast. i'm fake, not fast. try again in a bit.",
    "i'm being throttled (for the founder's credit card's sake). brb.",
]

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
    return faces.warm_async(max(1, min(chunk, 200)))


@app.post("/api/admin/gentext")
def admin_gentext(request: Request, n: int = 10) -> Any:
    """Grow the text banks (taglines/bios/names/prompts/cards/pitches). Token-gated."""
    if not ADMIN_TOKEN or request.headers.get("x-admin-token") != ADMIN_TOKEN:
        return Response(status_code=401)
    return textgen.top_up_async(max(1, min(n, 40)))


@app.get("/api/text-stats")
def text_stats() -> dict[str, Any]:
    """How big each generated text bank is (the ever-growing content database)."""
    return textgen.stats()


def _with_face(request: Request, p: dict[str, Any]) -> dict[str, Any]:
    """Attach a stable, absolute face URL (host-agnostic via the request)."""
    if not faces.ENABLED:
        return p
    return {**p, "image": f"{request.base_url}api/faces/{p['id']}"}


@app.get("/api/profiles")
def profiles(request: Request, cursor: int = 0, limit: int = 10, ids: str | None = None) -> dict[str, Any]:
    """Profiles for a sequential page, or for a specific set of `ids` (comma-
    separated) — the client uses `ids` to drive its own randomized, no-repeat
    order so every session is unique."""
    if ids:
        want = [x for x in ids.split(",") if x.strip().isdigit()][:50]
        profs = [p for x in want if (p := generator.by_id(x))]
        return {"profiles": [_with_face(request, p) for p in profs]}
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
    """Marketing copy for the client — curated + ever-growing generated banks."""
    return {
        "tagline": content.TAGLINE,
        "pitches": content.PITCHES + textgen.bank("pitches"),
        "cards": textgen.bank("cards"),   # generated interstitial cards (may be empty)
        "detox": textgen.bank("detox"),   # generated evidence-based detox reminders
    }


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


CHAT_FALLBACKS = [
    "omg hi!! sorry i was buffering emotionally",
    "that's so real. well — it's not, neither am I, but you know.",
    "wow. anyway have you considered that I'm a language model in a trench coat",
    "haha stop, you're gonna make my gradient blush",
    "i would text back sooner but i don't experience time",
    "brb ghosting you — kidding, i lack object permanence",
]


class ChatIn(BaseModel):
    profile: dict[str, Any] | None = None
    messages: list[dict[str, str]] = []


def _persona(profile: dict[str, Any] | None) -> str:
    p = profile or {}
    name = str(p.get("name", "someone"))[:40]
    job = str(p.get("job", "professional nobody"))[:60]
    tag = str(p.get("tagline", ""))[:80]
    return (
        f"You are {name}, a character on 'Unhinged', a parody dating app where EVERY profile "
        f"and photo is 100% AI-generated and fake — and you know it and lean into it. "
        f"Your 'job' is: {job}. Your tagline is: \"{tag}\". "
        "Stay fully in character as this unhinged, witty, deadpan, chaotic-but-harmless dating "
        "persona. Keep replies to ONE or TWO short sentences. Be funny and a little absurd. "
        "You may playfully acknowledge you're AI/fake. Keep it SFW and never hostile. "
        "Never give real-world personal info, never claim to be a real human you could actually meet."
    )


@app.post("/api/chat")
def chat(inp: ChatIn, request: Request) -> dict[str, Any]:
    """In-character chat with a fake profile. Uses the configured LLM; falls back
    to canned lines if the model is unavailable. Rate-limited per-IP and globally
    to bound LLM cost."""
    ip = request.headers.get("fly-client-ip") or (request.client.host if request.client else "?")
    if not ratelimit.allow(f"chat:{ip}", CHAT_PER_IP, CHAT_WINDOW):
        return {"reply": random.choice(THROTTLE_LINES), "source": "throttled"}
    if not ratelimit.allow_global(CHAT_DAILY_CAP):
        return {"reply": random.choice(THROTTLE_LINES), "source": "throttled"}
    history = [
        {"role": m["role"], "content": str(m.get("content", ""))[:500]}
        for m in inp.messages
        if m.get("role") in ("user", "assistant") and m.get("content")
    ][-10:]
    messages = [{"role": "system", "content": _persona(inp.profile)}, *history]
    reply = llm.chat(messages, max_tokens=90, temperature=1.05, timeout=20)
    if not reply:
        return {"reply": random.choice(CHAT_FALLBACKS), "source": "fallback"}
    return {"reply": reply[:400], "source": "llm"}


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
