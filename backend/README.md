# Unhinged API

A small FastAPI service. Its jobs (see [`../docs/VISION.md`](../docs/VISION.md)):

1. **Serve & cache pregenerated profiles** so browsers don't regenerate the deck
   on every load — and so **pre-generated photorealistic AI images** can be
   attached later (each profile already has an `image` slot).
2. Keep a **single anonymous aggregate counter** (total swipes, everyone
   combined). No accounts, no per-user rows, no PII — matching the site's
   [Terms of Service](../terms.html).

Auth endpoints exist but **refuse**, mirroring the client's "Don't Login /
Don't Signup" bit.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/api/health` | liveness + pack size |
| GET  | `/api/profiles?cursor=0&limit=10` | a page of cached profiles (wraps for an endless deck) |
| GET  | `/api/profiles/{id}` | one profile |
| GET  | `/api/copy` | rotating marketing copy (tagline + pitches) |
| GET  | `/api/stats` | `{ "swipes": <aggregate> }` |
| POST | `/api/tally` | anonymous "a swipe happened" ping (no body, no PII) |
| POST | `/api/auth/login`, `/api/auth/signup` | politely refuse (no accounts) |

## Run locally

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
# http://localhost:8000/api/health
```

## Test & lint

```bash
pytest          # 7 tests: health, profiles shape/stability/wrap/clamp, tally, auth-refusal
ruff check .
mypy
```

## Deploy (Fly.io, WineTone-style)

```bash
cd backend
fly launch --no-deploy   # first time; creates the app from fly.toml
fly deploy
```

Then:
- point the frontend API base at the deployed host in [`../js/config.js`](../js/config.js)
  (e.g. `https://api.unhinged.love/api`) and add a DNS `CNAME api → <app>.fly.dev`;
- flip the relevant flags in `FEATURES` (`remoteProfiles`, `remoteCopy`, `tally`).

The counter uses SQLite (`UNHINGED_DB`, default ephemeral). For a durable,
multi-instance counter, attach a Fly volume (see the commented `[mounts]` in
`fly.toml`) or swap `store.py` for Neon/Postgres as WineTone does.

## Frontend integration

The frontend is **fully functional with no backend** — profiles generate
on-device and copy is bundled. When `FEATURES.*` flags are on, `js/net.js`
fetches from here and **falls back to on-device behavior on any error**, so the
static site never breaks if the API is down.
