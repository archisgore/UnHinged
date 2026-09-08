// Optional backend client. Every call is best-effort: on any failure the app
// falls back to fully on-device behavior, so the static site works with no
// backend at all. Toggle via FEATURES in config.js once the backend is live.

import { API, FEATURES } from "./config.js";

// Fetch a specific set of profile ids (drives the client's randomized order).
export async function fetchProfilesByIds(ids) {
  if (!FEATURES.remoteProfiles || !ids.length) return null;
  try {
    const r = await fetch(`${API}/profiles?ids=${ids.join(",")}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Stable URL for a given face id (used as the photo for on-device fallbacks).
export function faceUrl(id) {
  return `${API}/faces/${id}`;
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

// Growing-corpus stats (cached_faces, frontier) — lets the deck start on
// pre-warmed (instant) photos rather than cold-generated ones.
export async function fetchCorpus() {
  try {
    const r = await fetch(`${API}/corpus`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
