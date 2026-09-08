// Browser smoke test — the guard the app was missing when the `[hidden]`
// overlay bug shipped (Start became unclickable, whole app dead, but syntax
// checks and static previews all passed). Loads the real app in Chromium and
// asserts the core flow actually works. Exits non-zero on any failure so CI
// can block the deploy.
//
// Run locally:  cd <repo>; python3 -m http.server 8000 &  node test/smoke.mjs

import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:8000";
const fails = [];
const check = (cond, msg) => {
  if (cond) console.log("  ✓ " + msg);
  else { fails.push(msg); console.error("  ✗ " + msg); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

try {
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  const hero = (await page.textContent("#hero-title"))?.trim();
  check(hero === "Unhinged", `landing hero renders (got ${JSON.stringify(hero)})`);

  // THE regression guard: Start must be clickable — no hidden overlay intercepting.
  await page.click("#start-btn", { timeout: 8000 });
  await page.waitForTimeout(1500);

  check((await page.getAttribute("#app", "hidden")) === null, "app becomes visible after Start");
  const cards = await page.$$eval("#deck .card", (els) => els.length);
  check(cards >= 1, `deck renders cards (got ${cards})`);

  await page.click(".act-like", { timeout: 5000 });
  await page.waitForTimeout(800);
  const cards2 = await page.$$eval("#deck .card", (els) => els.length);
  check(cards2 >= 1, `deck replenishes after a swipe (got ${cards2})`);
  await page.keyboard.press("Escape"); // dismiss a match modal if one opened

  await page.goto(BASE + "/feed.html", { waitUntil: "networkidle", timeout: 30000 });
  const feed = await page.$$eval(".feed-card", (els) => els.length);
  check(feed >= 1, `feed renders items (got ${feed})`);

  await page.goto(BASE + "/terms.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  check(/Terms of Service/i.test((await page.textContent("h1")) || ""), "terms page renders");
} catch (e) {
  fails.push("exception: " + e.message);
  console.error("  ✗ exception:", e.message);
}

check(pageErrors.length === 0, `no uncaught page errors (${pageErrors.length}: ${pageErrors.join("; ")})`);

await browser.close();
if (fails.length) {
  console.error(`\n${fails.length} smoke check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll smoke checks passed ✅");
