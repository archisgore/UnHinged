import { makeProfile, CERTIFIED } from "./generator.js";
import * as C from "./copy.js";
import { sfx, initAudio, setMuted, isMuted } from "./sfx.js";
import { login, signup } from "./auth.js";
import { fetchProfilesByIds, faceUrl, fetchCopy, tally, fetchStats, fetchCorpus, chat as askBot } from "./net.js";
import "./analytics.js";

// Deterministic gradient per profile — the placeholder behind each photo while
// it loads (and if it ever fails). Replaces the old procedural SVG avatars.
const GRADS = [
  "linear-gradient(135deg,#FFE29A,#FF9AA2)", "linear-gradient(135deg,#A0E9FF,#B980F0)",
  "linear-gradient(135deg,#FBC2EB,#A6C1EE)", "linear-gradient(135deg,#84FAB0,#8FD3F4)",
  "linear-gradient(135deg,#FCCB90,#D57EEB)", "linear-gradient(135deg,#F6D365,#FDA085)",
  "linear-gradient(135deg,#E0C3FC,#8EC5FC)", "linear-gradient(135deg,#FDCBF1,#B6E1E0)",
];
function gradientFor(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return GRADS[Math.abs(h) % GRADS.length];
}

const $ = (sel) => document.querySelector(sel);

/* ───────── Landing ───────── */
$("#hero-kicker").textContent = C.HERO.kicker;
$("#hero-title").textContent = C.HERO.title;
$("#hero-sub").textContent = C.HERO.sub;
$("#start-btn").textContent = C.HERO.cta;
$("#hero-fine").textContent = C.HERO.finePrint;

let pitchI = 0;
let pitches = C.PITCHES;
const pitchEl = $("#hero-pitch");
const showPitch = () => {
  pitchEl.style.opacity = "0";
  setTimeout(() => {
    pitchEl.textContent = "“" + C.rotate(pitches, pitchI++) + "”";
    pitchEl.style.opacity = ".82";
  }, 300);
};
showPitch();
const pitchTimer = setInterval(showPitch, 4200);
// Pull ever-growing generated copy from the backend (falls back to bundled).
let remoteCards = [];
let remoteDetox = [];
fetchCopy().then((c) => {
  if (c && Array.isArray(c.pitches) && c.pitches.length) pitches = c.pitches;
  if (c && Array.isArray(c.cards) && c.cards.length) remoteCards = c.cards;
  if (c && Array.isArray(c.detox) && c.detox.length) remoteDetox = c.detox;
});

// Global "N holograms judged" counter (anonymous aggregate; best-effort).
function setHolo(n) {
  if (typeof n !== "number") return;
  const txt = `🛸 <b>${n.toLocaleString()}</b> hologram${n === 1 ? "" : "s"} judged and counting`;
  for (const id of ["#holo-count", "#holo-count-about"]) {
    const el = $(id);
    if (el) { el.innerHTML = txt; el.hidden = false; }
  }
}
fetchStats().then((s) => { if (s) setHolo(s.swipes); });
$("#start-btn").addEventListener("click", startApp);

/* ───────── About sheet ───────── */
$("#about-title").textContent = C.ABOUT.title;
$("#about-body").innerHTML = C.ABOUT.body.map((p) => `<p>${p}</p>`).join("");
$("#about-footer").textContent = C.ABOUT.footer;
$("#about-btn").addEventListener("click", () => openLayer("about-sheet"));

document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () => closeLayer(btn.dataset.close))
);
document.querySelectorAll(".modal, .sheet").forEach((layer) =>
  layer.addEventListener("click", (e) => { if (e.target === layer) closeLayer(layer.id); })
);
function openLayer(id) { $("#" + id).hidden = false; }
function closeLayer(id) { $("#" + id).hidden = true; }

/* ───────── Sound toggle ───────── */
$("#mute-btn").addEventListener("click", () => {
  const nowMuted = !isMuted();
  setMuted(nowMuted);
  $("#mute-btn").textContent = nowMuted ? C.SOUND.off : C.SOUND.on;
  if (!nowMuted) { initAudio(); sfx.tap(); }
});

/* ───────── Parody auth ───────── */
$("#dont-login-btn").textContent = C.AUTH.loginBtn;
$("#dont-signup-btn").textContent = C.AUTH.signupBtn;
$("#auth-enter").textContent = C.AUTH.justEnter;
$("#dont-login-btn").addEventListener("click", () => openAuth("login"));
$("#dont-signup-btn").addEventListener("click", () => openAuth("signup"));
$("#auth-enter").addEventListener("click", () => { closeLayer("auth-sheet"); startApp(); });

let authMode = "login";
function openAuth(mode) {
  authMode = mode;
  initAudio();
  $("#auth-title").textContent = C.AUTH.title(mode);
  $("#auth-blurb").textContent = C.AUTH.blurb;
  $("#auth-email").placeholder = C.AUTH.email;
  $("#auth-pass").placeholder = C.AUTH.password;
  $("#auth-submit").textContent = C.AUTH.submit(mode);
  openLayer("auth-sheet");
}
$("#auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = authMode === "signup"
    ? await signup($("#auth-email").value, $("#auth-pass").value)
    : await login($("#auth-email").value, $("#auth-pass").value);
  sfx.refuse();
  vibrate([10, 30, 10]);
  toast(res.reason || "Refused, obviously.");
  setTimeout(() => { closeLayer("auth-sheet"); startApp(); }, 950);
});

/* ───────── Preferences (absurd, mostly inert) ───────── */
const prefs = { chaos: 2, lookingFor: 0, maxDistance: 0, dealbreakers: new Set() };
$("#prefs-btn").addEventListener("click", () => { renderPrefs(); openLayer("prefs-sheet"); });
$("#prefs-note").textContent = C.PREFS.note;
function renderPrefs() {
  const P = C.PREFS;
  const sel = (id, label, opts, cur) =>
    `<label class="pref"><span>${label}</span><select data-pref="${id}">${
      opts.map((o, i) => `<option value="${i}" ${i === cur ? "selected" : ""}>${o}</option>`).join("")
    }</select></label>`;
  const chaos =
    `<label class="pref"><span>${P.chaos.label}: <b id="chaos-h">${P.chaos.hint[prefs.chaos]}</b></span>
     <input type="range" min="0" max="4" step="1" value="${prefs.chaos}" data-pref="chaos"></label>`;
  const deal =
    `<div class="pref"><span>${P.dealbreakers.label}</span><div class="chips">${
      P.dealbreakers.options.map((o) => `<button type="button" class="chip deal ${prefs.dealbreakers.has(o) ? "on" : ""}" data-deal="${o}">${o}</button>`).join("")
    }</div></div>`;
  $("#prefs-body").innerHTML =
    sel("lookingFor", P.lookingFor.label, P.lookingFor.options, prefs.lookingFor) +
    chaos +
    sel("maxDistance", P.maxDistance.label, P.maxDistance.options, prefs.maxDistance) +
    deal;
}
$("#prefs-body").addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.pref === "chaos") {
    prefs.chaos = +t.value;
    const h = $("#chaos-h"); if (h) h.textContent = C.PREFS.chaos.hint[prefs.chaos];
  } else if (t.dataset.pref) {
    prefs[t.dataset.pref] = +t.value;
  }
});
$("#prefs-body").addEventListener("click", (e) => {
  const b = e.target.closest("[data-deal]");
  if (!b) return;
  const k = b.dataset.deal;
  prefs.dealbreakers.has(k) ? prefs.dealbreakers.delete(k) : prefs.dealbreakers.add(k);
  b.classList.toggle("on");
  sfx.tap();
});

/* ───────── Feedback helpers ───────── */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function vibrate(p) { if (reduceMotion) return; try { navigator.vibrate && navigator.vibrate(p); } catch {} }

/* ───────── Deck ───────── */
const deck = $("#deck");
const KEEP = 3;
let seed = 1;
let itemCount = 0;
let cards = [];
let history = [];
let started = false;

/* ───────── Engagement stats (session-only, never stored) ───────── */
let swipes = 0, streak = 0, lastSwipeTs = 0;
const unlocked = new Set();

function startApp() {
  if (started) return;
  started = true;
  clearInterval(pitchTimer);
  initAudio();
  $("#landing").hidden = true;
  $("#app").hidden = false;
  sizeConfetti();
  for (let i = 0; i < KEEP; i++) addCard();
  layout();
  resetIdle();
}

// Backend-served profiles in RANDOM, no-repeat order. `seen` is per-session
// memory so every user gets a unique, non-repeating experience; ids are biased
// toward the warmed range (instant photos) and the pool grows as you swipe.
const remoteBuf = [];
const seen = new Set();
let warmFrontier = 0;
let refilling = false;

fetchCorpus().then((c) => {
  if (c && typeof c.frontier === "number") warmFrontier = c.frontier;
  refillRemote(); // prefetch so the first cards are photos, not placeholders
});

function pickUnseenId() {
  const pool = Math.max(warmFrontier, seen.size * 2 + 20, 60);
  for (let t = 0; t < 60; t++) {
    const id = Math.floor(Math.random() * pool);
    if (!seen.has(id)) { seen.add(id); return id; }
  }
  let id = 0;
  while (seen.has(id)) id++;
  seen.add(id);
  return id;
}

async function refillRemote() {
  if (refilling || remoteBuf.length >= 6) return;
  refilling = true;
  const ids = Array.from({ length: 8 }, () => pickUnseenId());
  const pg = await fetchProfilesByIds(ids); // null unless FEATURES.remoteProfiles / reachable
  if (pg && pg.profiles) remoteBuf.push(...pg.profiles);
  refilling = false;
}

function nextItem() {
  itemCount++;
  const interval = Math.max(4, 8 - prefs.chaos); // chaos preference = more interstitials
  if (itemCount % interval === 0) {
    // ≤20% of interstitial moments are sincere digital-detox reminders.
    if (Math.random() < 0.2) {
      const pool = remoteDetox.length ? remoteDetox : C.DETOX;
      return { type: "detox", data: pool[Math.floor(Math.random() * pool.length)] };
    }
    const cards = remoteCards.length ? remoteCards : C.INTERSTITIALS;
    return { type: "inter", data: cards[Math.floor(Math.random() * cards.length)] };
  }
  // Prefer a backend profile (random, no-repeat); fall back on-device but still
  // give it a real backend photo so we never show the old SVG cartoons.
  refillRemote();
  let profile;
  if (remoteBuf.length) {
    profile = remoteBuf.shift();
  } else {
    profile = makeProfile(seed++);
    profile.image = faceUrl(pickUnseenId());
  }
  return { type: "profile", profile };
}

function addCard(item = nextItem()) {
  const el = document.createElement("article");
  el.className = "card";
  el.__item = item;
  if (item.type === "profile") {
    if (item.profile.legendary) el.classList.add("legendary");
    el.innerHTML = renderProfile(item.profile);
  } else if (item.type === "detox") {
    el.classList.add("detox");
    el.innerHTML = renderDetox(item.data);
  } else {
    el.classList.add("inter");
    el.innerHTML = renderInterstitial(item.data);
  }
  deck.insertBefore(el, deck.firstChild);
  cards.unshift(el);
  makeDraggable(el);
  return el;
}

function layout() {
  cards.forEach((el, i) => {
    const depth = cards.length - 1 - i;
    if (!el.classList.contains("flinging")) {
      el.style.zIndex = String(10 + i);
      el.style.transform = `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`;
      el.style.opacity = depth > KEEP - 1 ? "0" : "1";
      el.style.transition = "transform .3s ease, opacity .3s ease";
    }
    el.style.pointerEvents = i === cards.length - 1 ? "auto" : "none";
  });
  $("#swipe-hint").style.opacity = cards.length ? "1" : "0";
}
function topCard() { return cards[cards.length - 1]; }

/* ───────── Rendering ───────── */
function renderProfile(p) {
  const chips = p.interests.map((x) => `<span class="chip">${x}</span>`).join("");
  const prompts = p.prompts
    .map((pr, i) => `
      <div class="prompt" data-prompt="${i}" role="button" tabindex="0" title="Like this answer">
        <div class="q">${pr.q}…</div>
        <div class="a">${pr.a}</div>
        <span class="prompt-heart"></span>
      </div>`)
    .join("");
  const artifact = p.artifact ? `<div class="artifact-badge">⚠︎ AI artifact: ${p.artifact}</div>` : "";
  const standout = p.legendary ? `<div class="standout-ribbon">${C.JACKPOT.badge}</div>` : "";
  // A gradient placeholder shows instantly; the cliché photo fades in on top and
  // removes itself if it ever fails to load, leaving the gradient.
  const photo = `<div class="card-skel" style="background:${gradientFor(p.seed)}"></div>` + (p.image
    ? `<img class="card-img" src="${p.image}" alt="AI-generated dating photo" onload="this.classList.add('loaded')" onerror="this.remove()"/>`
    : "");
  return `
    <div class="card-photo">
      ${photo}
      <div class="photo-fade"></div>
      <div class="cert-badge" title="${CERTIFIED}">✦ 100% fake</div>
      ${artifact}
      ${standout}
      <button class="share-btn" data-share aria-label="Share this fake person">↗</button>
      <span class="stamp stamp-like">LIKE</span>
      <span class="stamp stamp-nope">NOPE</span>
      <div class="photo-name">
        <span class="compat">${p.compat} match</span>
        <h2>${p.name}<span style="font-weight:400"> ${p.age}</span></h2>
        <div class="sub">${p.job}</div>
        <div class="dist">📍 ${p.distance}</div>
      </div>
    </div>
    <div class="card-body">
      <p class="tagline">“${p.tagline}”</p>
      <p class="bio">${p.bio}</p>
      <div class="chips">${chips}</div>
      ${prompts}
      <div class="greenflag">Green flag: ${p.greenflag}</div>
    </div>`;
}

function renderDetox(text) {
  return `
    <div class="detox-mark">🌿</div>
    <div class="detox-kicker">a genuinely real reminder</div>
    <div class="detox-text">${text}</div>
    <div class="detox-foot">the profiles are fake. this isn't.</div>`;
}

function renderInterstitial(d) {
  const big = d.big || d.q || "";      // generated cards use {q,a}; curated use {big,small}
  const small = d.small || d.a || "";
  return `
    <span class="stamp stamp-like">LIKE</span>
    <span class="stamp stamp-nope">NOPE</span>
    <div class="big">${big}</div>
    <div class="small">${small}</div>
    <img class="mark" src="assets/mark.svg" alt="Unhinged" width="46" height="46"/>`;
}

/* ───────── Tap interactions (delegated) ───────── */
function likePrompt(card, prompt) {
  card.__likedPrompt = card.__item.profile.prompts[+prompt.dataset.prompt];
  prompt.classList.add("liked");
  vibrate(8);
  sfx.tap();
  toast("♥ Liked their answer. Bold. Baseless.");
  setTimeout(() => flingUp(card), 220);
}
deck.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card || card !== topCard() || card.classList.contains("flinging")) return;
  if (card.__moved) { card.__moved = false; return; } // was a drag, not a tap
  if (e.target.closest("[data-share]")) { e.stopPropagation(); shareProfile(card.__item); return; }
  const prompt = e.target.closest(".prompt");
  if (prompt && card.__item.type === "profile") likePrompt(card, prompt);
});
deck.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const prompt = e.target.closest(".prompt");
  const card = topCard();
  if (prompt && card && card.__item.type === "profile") { e.preventDefault(); likePrompt(card, prompt); }
});

/* ───────── Swipe / drag ───────── */
function makeDraggable(el) {
  let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false, id = null;
  const likeStamp = el.querySelector(".stamp-like");
  const nopeStamp = el.querySelector(".stamp-nope");

  const down = (e) => {
    if (el !== topCard()) return;
    dragging = true; id = e.pointerId; el.__moved = false;
    startX = e.clientX; startY = e.clientY;
    el.setPointerCapture(id);
    el.classList.add("dragging");
    el.style.transition = "none";
  };
  const move = (e) => {
    if (!dragging) return;
    dx = e.clientX - startX; dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 8) el.__moved = true;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`;
    const k = Math.min(Math.abs(dx) / 90, 1);
    if (likeStamp && nopeStamp) {
      likeStamp.style.opacity = dx > 0 ? String(k) : "0";
      nopeStamp.style.opacity = dx < 0 ? String(k) : "0";
    }
    if (k > 0.55 && !el.__buzzed) { el.__buzzed = true; vibrate(6); } // "stick" cue
    if (k <= 0.55) el.__buzzed = false;
    hideHint();
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    if (Math.abs(dx) > 100) fling(el, dx > 0 ? "like" : "nope");
    else {
      el.style.transition = "transform .3s ease";
      el.style.transform = "";
      if (likeStamp) likeStamp.style.opacity = "0";
      if (nopeStamp) nopeStamp.style.opacity = "0";
    }
    dx = dy = 0;
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}

// Animate a card off-screen, then resolve the swipe. `transform` is the exit pose.
function flingOut(el, transform, action) {
  if (el.classList.contains("flinging")) return;
  el.classList.add("flinging");
  el.style.transition = "transform .4s ease, opacity .4s ease";
  el.style.transform = transform;
  el.style.opacity = "0";
  finishSwipe(el, action);
}
function fling(el, action) {
  const dir = action === "nope" ? -1 : 1;
  flingOut(el, `translate(${dir * (window.innerWidth + 200)}px, ${dir * 40}px) rotate(${dir * 22}deg)`, action);
}
function flingUp(el) {
  flingOut(el, `translateY(${-(window.innerHeight + 200)}px) rotate(-8deg)`, "super");
}
function finishSwipe(el, action) {
  const item = el.__item, likedPrompt = el.__likedPrompt;
  vibrate(action === "nope" ? 10 : 14);
  sfx[action === "nope" ? "nope" : "like"]();
  setTimeout(() => {
    cards = cards.filter((c) => c !== el);
    history.push({ item });
    if (history.length > 20) history.shift();
    el.remove();
    addCard();
    layout();
  }, 240);
  recordSwipe();
  reactTo(action, item, likedPrompt);
}

/* ───────── Engagement: streaks + achievements ───────── */
function recordSwipe() {
  swipes++;
  tally().then((res) => { if (res && typeof res.swipes === "number") setHolo(res.swipes); });
  hideHint();
  resetIdle();
  const now = Date.now();
  streak = now - lastSwipeTs < 6000 ? streak + 1 : 1;
  lastSwipeTs = now;
  updateStatChip();

  const line = C.STREAK_LINES(streak);
  if (line) toast(line);

  for (const a of C.ACHIEVEMENTS) {
    if (swipes === a.at && !unlocked.has(a.at)) {
      unlocked.add(a.at);
      achievement(a);
    }
  }
}
function updateStatChip() {
  const chip = $("#streak-chip");
  chip.hidden = swipes === 0;
  chip.classList.toggle("hot", streak >= 5);
  chip.innerHTML = streak >= 3
    ? `<b>🔥 ${streak}</b> streak`
    : `<b>${swipes}</b> judged`;
}

/* ───────── Idle nudge ───────── */
let idleTimer = null;
// All dismissable overlays, in Escape close-priority order (topmost first).
const LAYER_IDS = ["chat-sheet", "match-modal", "auth-sheet", "prefs-sheet", "about-sheet"];
function anyLayerOpen() {
  return LAYER_IDS.some((id) => !$("#" + id).hidden);
}
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (started && !anyLayerOpen()) toast(pick(C.IDLE_NUDGES));
    resetIdle();
  }, 22000);
}

/* ───────── Tab-away title bait ───────── */
const realTitle = document.title;
document.addEventListener("visibilitychange", () => {
  if (!started) return;
  document.title = document.hidden ? pick(C.TITLE_BAIT) : realTitle;
});

/* ───────── PWA install nudge ───────── */
let deferredInstall = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  const btn = $("#install-btn");
  btn.textContent = C.INSTALL.cta;
  btn.hidden = false;
});
$("#install-btn").addEventListener("click", async () => {
  $("#install-btn").hidden = true;
  if (!deferredInstall) return;
  deferredInstall.prompt();
  try { await deferredInstall.userChoice; } catch {}
  deferredInstall = null;
  toast(C.INSTALL.toast);
});

/* ───────── Reactions ───────── */
function reactTo(action, item, likedPrompt) {
  if (action === "nope") { toast(pick(C.NOPE_TOASTS)); return; }
  if (item.type !== "profile") { toast(action === "super" ? pick(C.SUPER_TOASTS) : pick(C.LIKE_TOASTS)); return; }
  if (action === "super" || likedPrompt) { toast(pick(C.SUPER_TOASTS)); showMatch(item, likedPrompt); return; }
  // like: variable reward. Legendary always matches; others ~40%.
  toast(pick(C.LIKE_TOASTS));
  if (item.profile.legendary || Math.random() < 0.4) showMatch(item, likedPrompt);
}

/* ───────── Action bar ───────── */
$(".actions").addEventListener("click", (e) => {
  const btn = e.target.closest(".act");
  if (!btn) return;
  const action = btn.dataset.action, top = topCard();
  if (action === "boost") { vibrate(20); toast(pick(["Boosted! Into the same void, but faster.", "You are now 400% more invisible.", "Boost active. Audience: still zero."])); return; }
  if (action === "rewind") { rewind(); return; }
  if (!top) return;
  if (action === "super") flingUp(top);
  else fling(top, action);
});

function rewind() {
  const last = history.pop();
  if (!last) { toast("Nothing to rewind. The past is as fake as the present."); return; }
  vibrate(8);
  toast("Rewound. Reliving a moment that never happened.");
  if (cards.length >= KEEP) { const back = cards.shift(); back.remove(); }
  const el = addCard(last.item);
  deck.appendChild(el);
  cards = cards.filter((c) => c !== el);
  cards.push(el);
  layout();
}

/* ───────── Match modal ───────── */
let currentMatch = null;
function showMatch(item, likedPrompt) {
  const p = item.profile;
  currentMatch = item;
  const legendary = p.legendary;
  $("#match-face").innerHTML = `<div class="face-skel" style="background:${gradientFor(p.seed)}"></div>` +
    (p.image ? `<img class="face-img" src="${p.image}" alt="" onload="this.classList.add('loaded')" onerror="this.remove()"/>` : "");
  $("#match-face").classList.toggle("legendary", !!legendary);
  $("#match-line").textContent = likedPrompt
    ? `They saw you like “${likedPrompt.a}”. It's a match. It means nothing. Enjoy!`
    : p.matchLine;
  $("#match-foot").textContent = legendary ? C.JACKPOT.matchNote : "*neither of you is real, so this is legally meaningless.";
  openLayer("match-modal");
  $("#match-message-btn").focus();
  vibrate(legendary ? [20, 40, 60] : [12, 30, 12]);
  (legendary ? sfx.jackpot : sfx.match)();
  confettiBurst(legendary ? 160 : 90, legendary);
}
$("#match-message-btn").addEventListener("click", () => { closeLayer("match-modal"); if (currentMatch) openChat(currentMatch); });
$("#match-share-btn").addEventListener("click", () => { if (currentMatch) shareProfile(currentMatch); });

/* ───────── Chat (obviously-AI bot) ───────── */
let chatItem = null;
let chatHistory = []; // [{role, content}] for the LLM
let chatBusy = false;
function openChat(item) {
  chatItem = item;
  const p = item.profile;
  $("#chat-face").innerHTML = `<div class="face-skel" style="background:${gradientFor(p.seed)}"></div>` +
    (p.image ? `<img class="face-img" src="${p.image}" alt="" onload="this.classList.add('loaded')" onerror="this.remove()"/>` : "");
  $("#chat-name").textContent = p.name;
  $("#chat-msgs").innerHTML = "";
  $("#chat-starters").innerHTML = C.CONVO_STARTERS
    .map((s) => `<button class="starter">${s}</button>`).join("");
  const greeting = pick(C.BOT_REPLIES);
  addMsg("bot", greeting);
  chatHistory = [{ role: "assistant", content: greeting }];
  openLayer("chat-sheet");
}
$("#chat-starters").addEventListener("click", (e) => {
  const b = e.target.closest(".starter");
  if (b) send(b.textContent);
});
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#chat-text");
  const v = input.value.trim();
  if (v) { send(v); input.value = ""; }
});
async function send(text) {
  if (chatBusy) return;
  chatBusy = true;
  addMsg("me", text);
  vibrate(6);
  chatHistory.push({ role: "user", content: text });
  const t = $("#chat-typing"); t.hidden = false; scrollChat();
  // Real in-character reply from the backend LLM; canned fallback if it's down.
  const reply = (await askBot(chatItem && chatItem.profile, chatHistory)) || pick(C.BOT_REPLIES);
  t.hidden = true;
  addMsg("bot", reply);
  chatHistory.push({ role: "assistant", content: reply });
  chatBusy = false;
}
function addMsg(who, text) {
  const div = document.createElement("div");
  div.className = "msg msg-" + who;
  div.textContent = text;
  $("#chat-msgs").appendChild(div);
  scrollChat();
}
function scrollChat() { const m = $("#chat-msgs"); m.scrollTop = m.scrollHeight; }

/* ───────── Share ───────── */
async function shareProfile(item) {
  if (item.type !== "profile") return;
  const p = item.profile;
  const data = { title: C.SHARE.title, text: C.SHARE.text(p.name), url: C.SHARE.url };
  vibrate(8);
  try {
    if (navigator.share) { await navigator.share(data); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(`${data.text} ${data.url}`); toast(C.SHARE.copied); }
  catch { toast(C.SHARE.url); }
}

/* ───────── Toasts ───────── */
let lastToast = "", toastTimer = null;
const toastEl = $("#toast");
function toast(msg) {
  if (msg === lastToast) return;
  lastToast = msg;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.classList.remove("show"); lastToast = ""; }, 1900);
}
function achievement(a) {
  vibrate([15, 40, 15]);
  sfx.achieve();
  confettiBurst(70, false);
  const el = $("#ach");
  el.innerHTML = `<div class="ach-emoji">${a.emoji}</div><div class="ach-title">${a.title}</div><div class="ach-note">${a.note}</div>`;
  el.classList.add("show");
  clearTimeout(el.__t);
  el.__t = setTimeout(() => el.classList.remove("show"), 2600);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let hintHidden = false;
function hideHint() { if (!hintHidden) { hintHidden = true; $("#swipe-hint").style.opacity = "0"; } }

/* ───────── Confetti ───────── */
const cv = $("#confetti");
const ctx = cv ? cv.getContext("2d") : null;
let parts = [], raf = null;
function sizeConfetti() {
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", () => { sizeConfetti(); });
function confettiBurst(n, gold) {
  if (reduceMotion || !ctx) return;
  const colors = gold ? ["#FFD15C", "#FF3D6E", "#FF6B8A", "#fff"] : ["#FF3D6E", "#FF6B8A", "#4a9bff", "#17c964", "#FFD15C"];
  const cx = innerWidth / 2, cy = innerHeight * 0.4;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
    parts.push({ x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4,
      r: 3 + Math.random() * 5, c: colors[i % colors.length], life: 1, rot: Math.random() * 6 });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach((p) => {
    p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.life -= 0.012; p.rot += 0.2;
    ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 1.4); ctx.restore();
  });
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  if (parts.length) raf = requestAnimationFrame(tick);
  else { ctx.clearRect(0, 0, cv.width, cv.height); raf = null; }
}

/* ───────── Keyboard (desktop) ───────── */
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    for (const id of LAYER_IDS) {
      if (!$("#" + id).hidden) { closeLayer(id); return; }
    }
  }
  if (!started || !topCard() || anyLayerOpen()) return;
  if (e.key === "ArrowLeft") fling(topCard(), "nope");
  else if (e.key === "ArrowRight") fling(topCard(), "like");
  else if (e.key === "ArrowUp") flingUp(topCard());
});

/* ───────── PWA ───────── */
if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
