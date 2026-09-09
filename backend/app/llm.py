"""LLM client. Uses Claude (official Anthropic SDK) when an ANTHROPIC_API_KEY is
present — that's the reliable, in-character path — and otherwise falls back to the
free, key-less Pollinations endpoint (best-effort; fine for background text but
unreliable for real-time chat). Callers must handle "" (failure) gracefully.

To go real, set on the backend:
    fly secrets set ANTHROPIC_API_KEY=sk-ant-... -a unhinged-api
    # optional: fly secrets set LLM_MODEL=claude-haiku-4-5 -a unhinged-api
"""

from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

USE_ANTHROPIC = bool(os.environ.get("ANTHROPIC_API_KEY"))
MODEL = os.environ.get("LLM_MODEL") or ("claude-haiku-4-5" if USE_ANTHROPIC else "openai")

# OpenAI-compatible fallback (Pollinations by default).
OPENAI_BASE_URL = os.environ.get("LLM_BASE_URL", "https://text.pollinations.ai/openai")

_client = None  # lazily-created Anthropic client


def _anthropic_chat(messages: list[dict[str, str]], max_tokens: int,
                    temperature: float, timeout: int) -> str:  # temperature unused (this SDK build rejects it)
    global _client
    try:
        import anthropic
        if _client is None:
            _client = anthropic.Anthropic()
        system = " ".join(m["content"] for m in messages if m.get("role") == "system")
        convo = [
            {"role": m["role"], "content": m["content"]}
            for m in messages if m.get("role") in ("user", "assistant")
        ]
        while convo and convo[0]["role"] == "assistant":  # must start with a user turn
            convo.pop(0)
        if not convo:
            return ""
        kwargs: dict[str, Any] = {"model": MODEL, "max_tokens": max_tokens, "messages": convo}
        if system:
            kwargs["system"] = system
        resp = _client.with_options(timeout=timeout).messages.create(**kwargs)
        return "".join(b.text for b in resp.content if b.type == "text").strip()
    except Exception:
        return ""


def _openai_chat(messages: list[dict[str, str]], max_tokens: int,
                 temperature: float, timeout: int) -> str:
    body = json.dumps({"model": MODEL, "messages": messages,
                       "max_tokens": max_tokens, "temperature": temperature}).encode()
    try:
        req = urllib.request.Request(OPENAI_BASE_URL, data=body,
                                     headers={"content-type": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 (configured endpoint)
            data = json.loads(r.read())
        choices = data.get("choices") or []
        return (choices[0].get("message", {}).get("content") or "").strip() if choices else ""
    except Exception:
        return ""


def chat(messages: list[dict[str, str]], *, max_tokens: int = 120,
         temperature: float = 1.0, timeout: int = 25) -> str:
    """Return the assistant reply, or "" on any failure."""
    if USE_ANTHROPIC:
        return _anthropic_chat(messages, max_tokens, temperature, timeout)
    return _openai_chat(messages, max_tokens, temperature, timeout)


def has_key() -> bool:
    return USE_ANTHROPIC
