"""API tests. Run: cd backend && pytest"""

from __future__ import annotations

import os
import tempfile

# Use a throwaway DB so tests never touch a real counter file.
os.environ.setdefault("UNHINGED_DB", os.path.join(tempfile.gettempdir(), "unhinged_test.db"))
# Keep tests hermetic — no network fetches to the face generator.
os.environ.setdefault("FACES_ENABLED", "0")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health() -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_profiles_page_shape() -> None:
    r = client.get("/api/profiles", params={"cursor": 0, "limit": 5})
    assert r.status_code == 200
    body = r.json()
    assert len(body["profiles"]) == 5
    p = body["profiles"][0]
    for key in ("id", "seed", "name", "age", "job", "prompts", "compat", "legendary", "image"):
        assert key in p
    assert len(p["prompts"]) == 3


def test_profiles_are_stable() -> None:
    a = client.get("/api/profiles", params={"cursor": 3, "limit": 2}).json()
    b = client.get("/api/profiles", params={"cursor": 3, "limit": 2}).json()
    assert a == b  # cached pack -> deterministic


def test_profiles_wrap_around() -> None:
    body = client.get("/api/profiles", params={"cursor": 499, "limit": 3}).json()
    assert len(body["profiles"]) == 3  # wraps past the end of the pack


def test_limit_is_clamped() -> None:
    body = client.get("/api/profiles", params={"cursor": 0, "limit": 9999}).json()
    assert len(body["profiles"]) <= 50


def test_tally_and_stats_increment() -> None:
    before = client.get("/api/stats").json()["swipes"]
    after = client.post("/api/tally").json()["swipes"]
    assert after == before + 1


def test_face_route_404_when_disabled() -> None:
    # With faces disabled, the route degrades to 404 (frontend uses the SVG).
    r = client.get("/api/faces/0")
    assert r.status_code == 404


def test_auth_refuses() -> None:
    for path in ("/api/auth/login", "/api/auth/signup"):
        r = client.post(path, json={"email": "x@y.z", "password": "hunter2"})
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is False and body["refused"] is True
        assert body["reason"]
