# Native apps (iOS + Android) via Capacitor

Unhinged ships as native iOS/Android apps by wrapping the existing static web app
(this repo) in a [Capacitor](https://capacitorjs.com) shell. **The web app stays
the source of truth** — it keeps working as a PWA at unhinged.love, and the native
apps load the same HTML/CSS/JS bundled locally, calling the same backend
(`api.unhinged.love`). No rewrite, one codebase.

## How it fits together

- `capacitor.config.json` — app id (`love.unhinged.app`), name, `webDir: www`.
- `scripts/build-web.mjs` — copies the web app into `www/` (excludes backend/tests/
  docs and the service worker, which isn't used in the shell).
- `js/native.js` — uses Capacitor's Share/Haptics/StatusBar/SplashScreen plugins
  when running natively, and falls back to the Web APIs on the web. Same code both
  places; no bundler.
- `www/`, `ios/`, `android/`, `node_modules/` are generated and git-ignored.

## One-time setup

Install the extra native toolchains (this repo's dev box already has Xcode + Java):

```bash
# iOS
sudo gem install cocoapods          # or: brew install cocoapods
# Android: install Android Studio (bundles the SDK), or the command-line SDK tools
```

Then, from the repo root:

```bash
npm install                          # Capacitor CLI + plugins
npm run build:web                    # populate www/
npx cap add ios
npx cap add android
npm run assets                       # generate app icons + splash from assets/icon.png
```

## Develop / run

```bash
npm run ios        # build:web → cap sync ios → open Xcode  (Cmd-R to run a simulator)
npm run android    # build:web → cap sync android → open Android Studio
```

After **any** change to the web app, re-sync:

```bash
npm run sync       # build:web → cap sync (copies latest web assets into both apps)
```

## Native niceties already wired

- **Share** — the profile/match share uses the native share sheet (`@capacitor/share`).
- **Haptics** — swipes/matches use `@capacitor/haptics` (falls back to `navigator.vibrate`).
- **Status bar / splash** — styled and dismissed on launch (`initNativeChrome()`).
- **Report** — the AI chat has a report (⚑) control (see review notes).

## App Store / Play Store review notes (read before submitting)

- **Category: Entertainment, not Dating.** It's a parody/novelty — no real users, no
  real matching, no accounts, no PII. Listing under Dating invites real-dating
  scrutiny (identity/age verification, moderation) that doesn't apply here.
- **AI-generated content moderation.** Profiles/photos/chat are AI-generated. Apple
  (1.2 / AI guidance) and Google expect filtering + a way to report. Claude runs with
  a SFW system prompt, and the chat has a **report affordance** (⚑). If a reviewer
  wants more, add a per-card report and a block list.
- **Not "just a website" (Apple 4.2).** The native build has real interactivity
  (swipe, haptics, native share, LLM chat, offline shell) — lean on those in the
  listing/screenshots so it doesn't read as a repackaged site.
- **Age rating** will likely be **17+** (unrestricted web + AI chat + suggestive humor).
- **Sign in with Apple** is only required *if* you add third-party login (e.g. Clerk);
  currently there are no accounts.
- **Push notifications: intentionally omitted.** They contradict the app's "go to
  reality, we won't manufacture triggers to keep you here" ethos (Finite Scroll,
  detox cards). Add only as rare, self-aware, opt-in if ever.

## Accounts / cost

- Apple Developer Program — $99/yr (needs a Mac + Xcode; ✓ present).
- Google Play Developer — $25 one-time (needs Android Studio/SDK).
