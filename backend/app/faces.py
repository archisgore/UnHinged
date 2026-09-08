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
import urllib.request

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
