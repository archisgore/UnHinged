# Unhinged — Vision & Roadmap

Captured intentionally so it isn't lost. **Nothing below is built yet** unless
it appears in the shipped app; this file is the north star, not a spec.

Guiding ethos (never violate): **tracks nothing and no one, no PII, no accounts,
100% certified-fake content.** Any future feature must survive that test or it
doesn't ship. Basic aggregate hosting analytics (for scaling only, no identity)
is the sole exception, as stated in the [Terms of Service](../terms.html).

## 1. Backend — why it exists

Two concrete jobs (see [`backend/`](../backend/) for the first cut):

1. **Serve profiles + grow the corpus.** Profiles are unbounded (any id → a
   deterministic profile), so the deck is genuinely infinite. Faces accumulate:
   a scheduled job (`.github/workflows/warm.yml`, every 6h) calls token-gated
   `POST /api/admin/warm` to bank the next chunk of StyleGAN faces onto the
   volume, advancing a persisted frontier; `GET /api/corpus` reports growth. The
   feed is combinatorial (near-infinite). So the ready content keeps growing over
   time toward effectively infinite — "always fresh".

   **Photorealistic AI faces — SHIPPED.** `backend/app/faces.py` lazily fetches a
   StyleGAN face (thispersondoesnotexist.com — people who don't exist, exactly the
   pitch) per profile, downscales/recompresses (~500KB→~50KB), caches it on the
   /data volume, and serves it via `GET /api/faces/{id}` (immutable cache).
   `/api/profiles` returns a stable https image URL per profile; the frontend
   layers the photo over the procedural SVG (instant fallback, graceful on error).
   Swap `FACE_SOURCE` for a keyed image model later for more control.
2. **A place for aggregate, non-personal counters** (e.g. "N billion holograms
   judged") — anonymous, no identity, matching the ToS.

## 2. The Unhinged Feed — v1 SHIPPED

A scrolling feed (`feed.html` + `js/feed.js`), in the spirit of **FML (Fuck My
Life)** and **The Onion** — short, funny, fake dispatches, procedurally generated
on-device with infinite scroll. **No user submissions**, so there's no
moderation/safety surface. Linked from the landing and the About sheet.

Future: richer/rotating content (backend-served), and explore possible
**partnerships with FML and/or The Onion**.

## 2b. User management — Clerk (future, like WineTone)

When real accounts are eventually wanted, use **Clerk** for user management,
mirroring WineTone's setup. The seam already exists: `js/auth.js` +
`js/config.js` (`FEATURES.accounts`, currently false) and refusing `/api/auth/*`
endpoints. Note this coexists with the "no PII" ethos only if accounts stay
strictly optional and off by default — the current product is deliberately
account-free ("Don't Login" / "Don't Signup").

## 3. In-person connection — the no-PII common pool (future)

The connection idea deliberately shares **zero personal information**:

- People suggest either a **physical place** (Google Maps link) or an **online
  event** (Meetup, Eventbrite, etc. link).
- Suggestions drop into a **common, anonymized pool** and are **randomly
  surfaced** to others.
- Others can see only **what** was suggested — never **by whom**, never **who
  (if anyone) is going**, never even **whether anyone is going at all**.

No matching of two people. No attendance. No identity. Just an anonymous pool of
"here's a place/event that exists," surfaced at random.

### Safety (must-solve before any of §3 ships)

Any feature that surfaces places or events introduces real-world safety risk:
someone could link an **unsafe location** or fabricate a **fake, unsafe event**.
Fighting exactly that kind of harm is the whole point of Unhinged, so §3 cannot
ship without a serious safety design — vetting/allow-listing of link targets,
abuse reporting, rate limiting, and human review at minimum. Treat safety as a
blocking requirement, not a follow-up.

## Status

Shipped: static PWA at unhinged.love — swipe deck, procedural profiles/avatars,
match + AI chat, share, streaks/achievements, sound, parody auth, preferences,
Terms of Service. Backend: first cut in `backend/` (profile serving/caching +
anonymous counter), not yet deployed.
