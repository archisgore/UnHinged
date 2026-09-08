// Privacy-friendly web analytics — OFF until you opt in.
//
// The ToS allows "basic web analytics for scaling/hosting" only: aggregate,
// cookieless, no personal data. Two supported options (set one in config.js):
//
//   Cloudflare Web Analytics (recommended — you have a Cloudflare account):
//     Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site
//     (unhinged.love) → copy the beacon "token" → set ANALYTICS.cloudflareToken.
//     Cookieless, no sampling, no PII. Works on GitHub Pages regardless of proxy.
//
//   Plausible (alternative): set ANALYTICS.plausibleDomain = "unhinged.love".
//
// Note: there are no accounts/logins here (by design), so this measures VISITS
// and pages — how many people show up and roughly where from — not "logins".

import { ANALYTICS } from "./config.js";

const A = ANALYTICS || {};

if (A.cloudflareToken) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: A.cloudflareToken }));
  document.head.appendChild(s);
} else if (A.plausibleDomain) {
  const s = document.createElement("script");
  s.defer = true;
  s.setAttribute("data-domain", A.plausibleDomain);
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}
