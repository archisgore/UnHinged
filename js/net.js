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

// Anonymous "a swipe happened" ping — no identity, no body. Returns the new
// global count (or null on failure / when disabled).
export async function tally() {
  if (!FEATURES.tally) return null;
  try {
    const r = await fetch(`${API}/tally`, { method: "POST", keepalive: true });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// The global aggregate counter (best-effort; no flag, no PII).
export async function fetchStats() {
  try {
    const r = await fetch(`${API}/stats`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
