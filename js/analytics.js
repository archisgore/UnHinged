// Privacy-friendly analytics — OFF until you opt in.
//
// The ToS allows "basic web analytics for scaling/hosting" only: aggregate,
// cookieless, no personal data. This loads Plausible (cookieless, GDPR-friendly)
// ONLY if you set ANALYTICS.plausibleDomain in config.js. Until then it does
// nothing, so no data leaves the browser.
//
// To enable: create a Plausible site for unhinged.love, then set
//   ANALYTICS.plausibleDomain = "unhinged.love"  (in js/config.js)

import { ANALYTICS } from "./config.js";

const domain = ANALYTICS && ANALYTICS.plausibleDomain;
if (domain) {
  const s = document.createElement("script");
  s.defer = true;
  s.setAttribute("data-domain", domain);
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}
