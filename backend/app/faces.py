"""Photorealistic AI faces — fetched once, resized, cached on the volume.

Source is thispersondoesnotexist.com (StyleGAN): every face is a person who
does not exist — exactly Unhinged's "100% certified fake" pitch. We fetch one
face per profile id lazily on first request, downscale + recompress it, and
cache it under /data (the persistent volume) so it's fetched once and served to
everyone thereafter. Swap FACE_SOURCE for any other generator later.

Everything degrades gracefully: if disabled or a fetch fails, callers get None
and the frontend falls back to its procedural SVG avatar.
"""

from __future__ import annotations

import io
import os
import threading
import time
import urllib.request
from typing import Any

from PIL import Image

FACES_DIR = os.environ.get("FACES_DIR", "/data/faces")
SOURCE = os.environ.get("FACE_SOURCE", "https://thispersondoesnotexist.com/random-person.jpeg")
ENABLED = os.environ.get("FACES_ENABLED", "1") == "1"
SIZE = 640  # TPDNE images are 1024x1024 square; downscale for fast loads

_UA = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://thispersondoesnotexist.com/",
}
_locks: dict[str, threading.Lock] = {}
_guard = threading.Lock()


def _lock_for(fid: str) -> threading.Lock:
    with _guard:
        return _locks.setdefault(fid, threading.Lock())


def _safe(fid: str) -> str:
    return "".join(c for c in fid if c.isalnum() or c in "-_")  # no path traversal


def path_for(fid: str) -> str:
    return os.path.join(FACES_DIR, f"{_safe(fid)}.jpg")


def get(fid: str) -> str | None:
    """Return a local path to the cached face for `fid`, fetching+caching on
    first use. Returns None if disabled or the fetch/encode fails."""
    if not ENABLED or not _safe(fid):
        return None
    p = path_for(fid)
    if os.path.exists(p):
        return p
    with _lock_for(fid):
        if os.path.exists(p):  # double-check after acquiring the lock
            return p
        try:
            req = urllib.request.Request(SOURCE, headers=_UA)
            with urllib.request.urlopen(req, timeout=20) as r:  # noqa: S310 (fixed https source)
                raw = r.read()
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            if img.width != SIZE or img.height != SIZE:
                img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
            os.makedirs(FACES_DIR, exist_ok=True)
            tmp = p + ".tmp"
            img.save(tmp, "JPEG", quality=82, optimize=True)
            os.replace(tmp, p)  # atomic; concurrent readers never see a partial file
            return p
        except Exception:
            return None


# ── The growing corpus ────────────────────────────────────────────────────
# A scheduled job (see .github/workflows/warm.yml) calls warm() periodically to
# bank the next chunk of faces onto the volume, so the ready corpus keeps
# growing over time toward "always fresh, effectively infinite".

_FRONTIER = os.path.join(FACES_DIR, ".frontier")


def _read_frontier() -> int:
    try:
        with open(_FRONTIER) as f:
            return int(f.read().strip() or "0")
    except (OSError, ValueError):
        return 0


def _write_frontier(n: int) -> None:
    try:
        os.makedirs(FACES_DIR, exist_ok=True)
        with open(_FRONTIER, "w") as f:
            f.write(str(n))
    except OSError:
        pass


def count_cached() -> int:
    try:
        return sum(1 for f in os.listdir(FACES_DIR) if f.endswith(".jpg"))
    except OSError:
        return 0


def corpus_stats() -> dict[str, Any]:
    return {"cached_faces": count_cached(), "frontier": _read_frontier(), "faces_enabled": ENABLED}


def warm(chunk: int = 40) -> dict[str, Any]:
    """Pre-fetch the next `chunk` faces onto the volume. Gentle on the source."""
    if not ENABLED:
        return {"enabled": False}
    start = _read_frontier()
    warmed = 0
    for i in range(start, start + chunk):
        if get(str(i)):
            warmed += 1
        time.sleep(0.3)  # be polite to the face source
    _write_frontier(start + chunk)
    return {"warmed": warmed, "frontier": start + chunk, "cached_faces": count_cached()}
