"""Server-side profile factory.

Profiles are unbounded: any integer id maps to a deterministic profile, so the
deck is genuinely infinite. Generation is memoized (pure perf), and each profile
carries a photorealistic `image` URL (see faces.py / docs/VISION.md).
"""

from __future__ import annotations

import functools
import hashlib
import random
from typing import Any

from . import content, textgen


def _rng(seed: str) -> random.Random:
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    return random.Random(h)


def _compat(r: random.Random) -> str:
    if r.random() < 0.1:
        return r.choice(["404%", "∞%", "-7%", "0.7%", "NaN%", "yes%"])
    return f"{r.randint(72, 99)}%"


def make_profile(i: int, salt: int = 0) -> dict[str, Any]:
    seed = f"unhinged:{i}" if salt == 0 else f"unhinged:{i}.{salt}"
    r = _rng(seed)
    # Draw from curated + ever-growing generated banks, so newer ids get fresher
    # content as the banks fill (see textgen.py).
    names = content.NAMES + textgen.bank("names")
    taglines = content.TAGLINES + textgen.bank("taglines")
    bios = content.BIOS + textgen.bank("bios")
    curated_prompts = [{"q": q, "a": r.choice(answers)} for q, answers in r.sample(content.PROMPTS, 3)]
    gen_prompts = textgen.bank("prompts")
    prompts = [
        (r.choice(gen_prompts) if gen_prompts and r.random() < 0.5 else cp)
        for cp in curated_prompts
    ]
    # Persona archetype (curated + generated bank; generated items are {q,a}).
    gen_personas = [{"label": p["q"], "voice": p["a"]} for p in textgen.bank("personas")]
    persona = r.choice(content.PERSONAS + gen_personas)
    n_interests = r.randint(3, 5)
    return {
        "id": str(i),
        "persona": persona,
        "seed": seed,  # client renders the avatar deterministically from this
        "image": None,  # future: pre-generated photorealistic AI image URL
        "name": r.choice(names),
        "age": r.choice(content.AGES),
        "job": r.choice(content.JOBS),
        "distance": r.choice(content.DISTANCE),
        "tagline": r.choice(taglines),
        "bio": r.choice(bios),
        "interests": r.sample(content.INTERESTS, n_interests),
        "prompts": prompts,
        "greenflag": r.choice(content.RED_AS_GREEN),
        "compat": _compat(r),
        "legendary": r.random() < 1 / 11,
        "artifact": r.choice(content.AI_ARTIFACTS) if r.random() < 0.7 else None,
        "matchLine": r.choice(content.MATCH_LINES),
    }


# Profiles are unbounded: any id maps to a deterministic profile, so the deck is
# genuinely infinite. lru_cache is a pure perf memo (same id → same profile),
# never a cap on how many distinct profiles exist.
@functools.lru_cache(maxsize=20000)
def _cached(i: int) -> dict[str, Any]:
    return make_profile(i)


def page(cursor: int, limit: int) -> dict[str, Any]:
    """Return `limit` profiles starting at `cursor`. Unbounded — cursor grows forever."""
    limit = max(1, min(limit, 50))
    cursor = max(0, cursor)
    profiles = [_cached(cursor + k) for k in range(limit)]
    return {"profiles": profiles, "next_cursor": cursor + limit}


def by_id(pid: str) -> dict[str, Any] | None:
    try:
        return _cached(max(0, int(pid)))
    except ValueError:
        return None
