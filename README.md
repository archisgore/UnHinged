# Unhinged 💔🔩

**The Dating App Fidget Spinner.** A parody dating app where every profile and
every photo is **100% certified AI-generated fake** — and that's the whole pitch.

> Every other app is 99% bots and catfish. We're just the first to put it on the
> label. You won't find your soulmate here, but you *will* be entertained. No
> account, no tracking, no one is real. You give it your attention; it asks for
> nothing back.

Live at **[unhinged.love](https://unhinged.love)**.

## What it is

A doomscrolling toy. Swipe through an endless deck of gloriously unhinged fake
profiles with procedurally-generated "AI slop" portraits. Like, nope, super-like
into the void — nothing is stored, nothing is judged, because there's no one and
nothing on the other side.

- **100% AI-generated** profiles + photos, generated on-device.
- **0% tracking** — no analytics, no cookies, no accounts, no database.
- **Offline-first PWA** — add it to your home screen; it works on a plane.

## Architecture

Deliberately tiny. The pitch ("tracks nothing, needs no database") *is* the
architecture: everything is generated in the browser from a seed.

```
unhinged/
├── index.html               # app shell: landing, deck, modals
├── styles.css               # clean white dating-app aesthetic, coral accent
├── js/
│   ├── app.js               # swipe deck, gestures, toasts, match modal, PWA reg
│   ├── generator.js         # the "AI slop factory": profiles from word-banks
│   ├── avatar.js            # procedural SVG "AI-generated" portraits
│   ├── random.js            # seeded PRNG (same seed → same person + face)
│   └── copy.js              # all the punchlines (swap for backend-served later)
├── assets/                  # logo.svg (app icon), mark.svg (header mark)
├── icons/                   # rasterized PNG PWA/home-screen icons
├── manifest.webmanifest     # installable PWA metadata
├── sw.js                    # offline-first service worker
├── CNAME                    # unhinged.love
└── .github/workflows/deploy.yml   # GitHub Pages deploy (no build step)
```

**Why static / framework-free:** it makes the app instant, free to host, trivially
installable on iOS/Android home screens today, and keeps the profile/avatar logic
as plain portable JS — ready to be reused behind a React Native shell for real
native apps later.

## Run locally

No build step. Serve the folder over HTTP (ES modules need `http`, not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Controls: drag a card, tap the action buttons, or use ← / → / ↑ on desktop.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes the
repo root to GitHub Pages. `CNAME` points it at `unhinged.love` — set that domain
in **Settings → Pages** and add the DNS records at your registrar. (Cloudflare
Pages works equally well: point it at this repo, no build command, output = `/`.)

## Roadmap

- [ ] **Backend (planned).** Currently there is none by design. The intended
      next chapter uses Unhinged's fakeness as a funnel toward *genuine,
      in-person* connection — details TBD, kept intentionally out of the
      prototype. `js/copy.js` is already factored out so lines can be
      served/rotated from a backend when one exists.
- [ ] Native iOS/Android wrappers reusing the generator modules.
- [ ] More word-banks, prompt types, and avatar artifacts.

## Credits

Built as a prototype. Every "person" herein is fictional and machine-made; any
resemblance to a real human is a hallucination — ours and, arguably, yours.
