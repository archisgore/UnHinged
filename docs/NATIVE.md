# Native apps (iOS + Android) via Capacitor

Unhinged's native apps are the **same web app** wrapped in a thin native shell
with [Capacitor](https://capacitorjs.com). The web app (repo root) stays the
source of truth and keeps working as a PWA. Capacitor uses **Swift Package
Manager** on iOS (no CocoaPods needed).

## Layout

- `capacitor.config.json` — app id (`love.unhinged.app`), name, `webDir: www`.
- `scripts/build-web.mjs` — copies the static site into `www/` (the bundle
  Capacitor ships). Excludes `sw.js` — the shell serves assets locally, so no
  service worker is needed inside the webview.
- `js/native.js` — Capacitor Share/Haptics/StatusBar/SplashScreen with web
  fallback, so identical code runs as PWA and native.
- `www/`, `ios/`, `android/`, `node_modules/` are **generated** (gitignored).

## One-time setup

```bash
npm install
npm run build:web
npx cap add ios
npx cap add android
```

## Build & run

```bash
npm run ios       # build web → sync → open Xcode
npm run android   # build web → sync → open Android Studio
```

- **iOS:** in Xcode open `ios/App/App.xcodeproj`, pick a simulator/device, Run.
  (SwiftPM resolves Capacitor packages on first build.)
- After changing any web code: `npm run build:web && npx cap copy` (fast; copies
  the fresh `www/` into both platforms). Use `npx cap sync` when native deps change.

## App icons & splash

```bash
npm run assets    # @capacitor/assets — generates all icon/splash sizes
```
Source: `assets/icon.png` (1024×1024) and optional `assets/splash.png` (2732²).

## Troubleshooting

- **Blank screen + `Launchd job spawn failed` / `Resource temporarily
  unavailable` / `extensionKit error`:** this is a wedged **iOS Simulator**, not
  the app. Fix: Simulator → **Device ▸ Erase All Content and Settings** (or quit
  Simulator and re-run); if it persists, **reboot the Mac**; or try a different
  simulator/a real device. The web bundle is validated (`node test/smoke.mjs`).
- **`xcrun: unable to find utility "simctl"`:** your command-line tools point at
  CommandLineTools, not Xcode. Fix once:
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- **API calls fail in the app:** the shell runs at `capacitor://localhost`;
  `js/config.js` detects the native shell and uses the production API
  (`https://api.unhinged.love`) rather than `localhost:8000`.

## Store submission (when/if we decide to list — TBD)

- Accounts: Apple Developer Program ($99/yr), Google Play ($25 once).
- **Category: Entertainment, not Dating** (novelty/parody, no real users, no
  accounts, no PII) — avoids real-dating identity/safety scrutiny. Age rating
  likely 17+ (unrestricted web + AI chat + suggestive humor).
- **Review readiness (before submitting):** apps with AI-generated content need
  visible content moderation — add a report/block affordance to the chat and
  cards (not yet built; the AI chat one matters most). Lean on native features
  (haptics, share sheet, offline) so it's not flagged as a "repackaged website"
  (Apple 4.2).
- **Push notifications:** deliberately omitted — they contradict the "go to
  reality, we won't manufacture triggers to keep you here" ethos. Revisit only
  as rare/opt-in if ever.
