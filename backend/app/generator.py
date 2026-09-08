"""Server-side profile factory + in-memory cache.

Profiles are generated once into a fixed pack at import time and served from
memory — so browsers fetch instead of regenerating, the deck is consistent for
everyone, and each profile carries an `image` slot for future pre-generated
photorealistic AI images (see docs/VISION.md).
"""

from __future__ import annotations

import hashlib
import random
from typing import Any

from . import content

PACK_SIZE = 500  # size of the cached, canonical deck


def _rng(seed: str) -> random.Random:
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    return random.Random(h)


def _compat(r: random.Random) -> str:
    if r.random() < 0.1:
        return r.choice(["404%", "∞%", "-7%", "0.7%", "NaN%", "yes%"])
    return f"{r.randint(72, 99)}%"


def make_profile(i: int) -> dict[str, Any]:
    seed = f"unhinged:{i}"
    r = _rng(seed)
    prompts = [{"q": q, "a": r.choice(answers)} for q, answers in r.sample(content.PROMPTS, 3)]
    n_interests = r.randint(3, 5)
    return {
        "id": str(i),
        "seed": seed,  # client renders the avatar deterministically from this
        "image": None,  # future: pre-generated photorealistic AI image URL
        "name": r.choice(content.NAMES),
        "age": r.choice(content.AGES),
        "job": r.choice(content.JOBS),
        "distance": r.choice(content.DISTANCE),
        "tagline": r.choice(content.TAGLINES),
        "bio": r.choice(content.BIOS),
        "interests": r.sample(content.INTERESTS, n_interests),
        "prompts": prompts,
        "greenflag": r.choice(content.RED_AS_GREEN),
        "compat": _compat(r),
        "legendary": r.random() < 1 / 11,
        "artifact": r.choice(content.AI_ARTIFACTS) if r.random() < 0.7 else None,
        "matchLine": r.choice(content.MATCH_LINES),
    }


# Generated once, cached for the process lifetime.
_PACK: list[dict[str, Any]] = [make_profile(i) for i in range(PACK_SIZE)]


def page(cursor: int, limit: int) -> dict[str, Any]:
    """Return `limit` profiles starting at `cursor`, wrapping for an endless deck."""
    limit = max(1, min(limit, 50))
    cursor = max(0, cursor)
    profiles = [_PACK[(cursor + k) % PACK_SIZE] for k in range(limit)]
    return {"profiles": profiles, "next_cursor": cursor + limit, "pack_size": PACK_SIZE}


def by_id(pid: str) -> dict[str, Any] | None:
    try:
        return _PACK[int(pid) % PACK_SIZE]
    except (ValueError, IndexError):
        return None
