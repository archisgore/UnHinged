// Frontend config + feature flags.
//
// The backend is OPTIONAL. Unhinged is fully functional as a static site;
// when a backend is deployed (see backend/), point API at it and flip the
// flags below. Nothing here collects personal data — `tally` sends only an
// anonymous "a swipe happened" ping with no identity, matching the ToS.

const local = ["localhost", "127.0.0.1"].includes(location.hostname);

export const API = local ? "http://localhost:8000/api" : "https://api.unhinged.love/api";

export const FEATURES = {
  accounts: false,       // there are no accounts; the buttons refuse, on purpose
  remoteProfiles: true,  // fetch cached profiles from the backend (falls back to on-device generation)
  remoteCopy: true,      // pull rotating punchlines from the backend (falls back to bundled copy)
  tally: true,           // powers the global "N holograms judged" counter (anonymous, no PII)
};

// Privacy-friendly analytics. Cookieless, aggregate-only, no PII — matching the
// ToS. OFF until you set one of these (see js/analytics.js for how to get it).
export const ANALYTICS = {
  cloudflareToken: "37dc842fd7a54aeab16f13622241bd83", // Cloudflare Web Analytics (cookieless, public beacon token)
  plausibleDomain: null, // alternative: e.g. "unhinged.love"
};
