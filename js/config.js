// Frontend config + feature flags.
//
// The backend is OPTIONAL. Unhinged is fully functional as a static site;
// when a backend is deployed (see backend/), point API at it and flip the
// flags below. Nothing here collects personal data — `tally` sends only an
// anonymous "a swipe happened" ping with no identity, matching the ToS.

const local = ["localhost", "127.0.0.1"].includes(location.hostname);

export const API = local ? "http://localhost:8000/api" : "https://api.unhinged.love/api";

export const FEATURES = {
  accounts: false,   // there are no accounts; the buttons refuse, on purpose
  remoteCopy: false, // pull rotating punchlines from the backend (falls back to bundled copy)
  tally: false,      // send anonymous aggregate swipe pings (no PII) for the global counter
};
