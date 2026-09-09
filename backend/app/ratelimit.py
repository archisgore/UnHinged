"""Tiny in-memory rate limiter to cap LLM cost/abuse on the chat endpoint.

Single always-on machine, so in-memory is fine. Two guards: a per-IP sliding
window and a global daily cap. Both are advisory soft caps (reset on restart for
the global counter) — enough to keep a viral spike from running up the Anthropic
bill. Tune via env (see main.py).
"""

from __future__ import annotations

import threading
import time

_lock = threading.Lock()
_hits: dict[str, list[float]] = {}
_global_day = ""
_global_count = 0


def allow(key: str, limit: int, window: float) -> bool:
    """Per-key sliding window: at most `limit` hits per `window` seconds."""
    now = time.time()
    with _lock:
        arr = [t for t in _hits.get(key, []) if now - t < window]
        if len(arr) >= limit:
            _hits[key] = arr
            return False
        arr.append(now)
        _hits[key] = arr
        if len(_hits) > 5000:  # bound memory
            for k in [k for k, v in _hits.items() if not v or now - v[-1] > window]:
                _hits.pop(k, None)
        return True


def allow_global(daily_cap: int) -> bool:
    """Global daily budget (UTC day). Resets on restart."""
    global _global_day, _global_count
    day = time.strftime("%Y-%m-%d", time.gmtime())
    with _lock:
        if _global_day != day:
            _global_day = day
            _global_count = 0
        if _global_count >= daily_cap:
            return False
        _global_count += 1
        return True
