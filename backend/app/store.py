"""A single anonymous aggregate counter (total swipes, everyone combined).

No identity, no per-user rows — just one number, matching the ToS. SQLite here
for a zero-dependency local/single-instance store; swap for Neon/Postgres (as in
WineTone) when it needs to be durable across multiple instances.
"""

from __future__ import annotations

import os
import sqlite3
import threading

_DB = os.environ.get("UNHINGED_DB", "./data.db")
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    return sqlite3.connect(_DB)


def init() -> None:
    with _lock, _connect() as c:
        c.execute(
            "CREATE TABLE IF NOT EXISTS counter "
            "(id INTEGER PRIMARY KEY CHECK (id = 1), swipes INTEGER NOT NULL)"
        )
        c.execute("INSERT OR IGNORE INTO counter (id, swipes) VALUES (1, 0)")


def bump(n: int = 1) -> int:
    n = max(0, min(n, 1))  # one ping per request; never trust the client to inflate
    with _lock, _connect() as c:
        c.execute("UPDATE counter SET swipes = swipes + ? WHERE id = 1", (n,))
        row = c.execute("SELECT swipes FROM counter WHERE id = 1").fetchone()
        return int(row[0]) if row else 0


def get() -> int:
    with _lock, _connect() as c:
        row = c.execute("SELECT swipes FROM counter WHERE id = 1").fetchone()
        return int(row[0]) if row else 0


# Ensure the table exists as soon as the module loads, so endpoints work even
# if the app's lifespan startup hasn't run (e.g. bare TestClient(app)).
init()
