// Copies the static web app into www/ for Capacitor to bundle into the native
// apps. Keeps the native build cleanly separated from the source (no backend/,
// test/, docs/, node_modules/ leaks into the app bundle).

import { cp, mkdir, rm } from "node:fs/promises";

const OUT = "www";
// Only the files the app actually serves. sw.js is intentionally EXCLUDED —
// the native shell serves assets locally, so a service worker isn't needed and
// can conflict inside the webview.
const ENTRIES = [
  "index.html", "terms.html", "feed.html",
  "styles.css", "manifest.webmanifest",
  "js", "assets", "icons",
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const entry of ENTRIES) {
  await cp(entry, `${OUT}/${entry}`, { recursive: true });
}
console.log(`built ${OUT}/ (${ENTRIES.length} entries)`);
