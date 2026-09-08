// Optional backend client. Every call is best-effort: on any failure the app
// falls back to fully on-device behavior, so the static site works with no
// backend at all. Toggle via FEATURES in config.js once the backend is live.

import { API, FEATURES } from "./config.js";

export async function fetchProfiles(cursor = 0, limit = 20) {
  if (!FEATURES.remoteProfiles) return null;
  try {
    const r = await fetch(`${API}/profiles?cursor=${cursor}&limit=${limit}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export async function fetchCopy() {
  if (!FEATURES.remoteCopy) return null;
  try {
    const r = await fetch(`${API}/copy`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Anonymous "a swipe happened" ping — no identity, no body. Fire-and-forget.
export function tally() {
  if (!FEATURES.tally) return;
  try { fetch(`${API}/tally`, { method: "POST", keepalive: true }).catch(() => {}); } catch {}
}
