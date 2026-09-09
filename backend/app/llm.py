"""Provider-agnostic LLM client (OpenAI-compatible chat completions).

Defaults to the free, key-less Pollinations text endpoint — which is fine for
best-effort background text generation but is UNRELIABLE for real-time chat
(intermittent empty responses / timeouts). Set these env vars to a real provider
for a solid experience (the key stays server-side, never shipped to browsers):

    LLM_BASE_URL   e.g. https://api.openai.com/v1/chat/completions
                   or an OpenAI-compatible endpoint (many providers offer one)
    LLM_API_KEY    your secret key  (set via `fly secrets set`)
    LLM_MODEL      e.g. gpt-4o-mini  (or your provider's model id)

Callers must handle failure (return of "" ) and fall back gracefully.
"""

from __future__ import annotations

import json
import os
import urllib.request

BASE_URL = os.environ.get("LLM_BASE_URL", "https://text.pollinations.ai/openai")
API_KEY = os.environ.get("LLM_API_KEY")
MODEL = os.environ.get("LLM_MODEL", "openai")


def chat(messages: list[dict[str, str]], *, max_tokens: int = 120,
         temperature: float = 1.0, timeout: int = 25) -> str:
    """Return the assistant reply, or "" on any failure."""
    body = json.dumps({
        "model": MODEL, "messages": messages,
        "max_tokens": max_tokens, "temperature": temperature,
    }).encode()
    headers = {"content-type": "application/json"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"
    try:
        req = urllib.request.Request(BASE_URL, data=body, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 (configured endpoint)
            data = json.loads(r.read())
        choices = data.get("choices") or []
        if not choices:
            return ""
        return (choices[0].get("message", {}).get("content") or "").strip()
    except Exception:
        return ""


def has_key() -> bool:
    return bool(API_KEY)
