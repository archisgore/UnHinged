# Unhinged — Vision & Roadmap

Captured intentionally so it isn't lost. **Nothing below is built yet** unless
it appears in the shipped app; this file is the north star, not a spec.

Guiding ethos (never violate): **tracks nothing and no one, no PII, no accounts,
100% certified-fake content.** Any future feature must survive that test or it
doesn't ship. Basic aggregate hosting analytics (for scaling only, no identity)
is the sole exception, as stated in the [Terms of Service](../terms.html).

## 1. Backend — why it exists

Two concrete jobs (see [`backend/`](../backend/) for the first cut):

1. **Serve & cache profiles.** Stop regenerating profiles in every browser.
   Pregenerate an unhinged profile pack server-side, cache it, and serve it so
   the deck is consistent across visitors and cheap to load. The profile shape
   already carries an `image` field so we can later attach **pre-generated,
   cached, higher-quality photorealistic AI images** (generated once, served to
   all — never per-browser, never per-user).
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
