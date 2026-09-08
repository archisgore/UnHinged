import { makeProfile, CERTIFIED } from "./generator.js";
import { avatarSVG } from "./avatar.js";
import * as C from "./copy.js";
import { sfx, initAudio, setMuted, isMuted } from "./sfx.js";
import { login, signup } from "./auth.js";
import { fetchProfiles, fetchCopy, tally } from "./net.js";

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
// Optionally refresh punchlines from the backend (falls back to bundled).
fetchCopy().then((c) => { if (c && Array.isArray(c.pitches) && c.pitches.length) pitches = c.pitches; });
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

// Optional buffer of backend-served profiles (flag-gated; empty otherwise).
const remoteBuf = [];
let remoteCursor = Math.floor(Math.random() * 500); // random start → sessions see different slices
async function refillRemote() {
  if (remoteBuf.length >= 6) return;
  const pg = await fetchProfiles(remoteCursor, 20); // null unless FEATURES.remoteProfiles
  if (pg && pg.profiles) { remoteBuf.push(...pg.profiles); remoteCursor = pg.next_cursor; }
}

function nextItem() {
  itemCount++;
  const interval = Math.max(4, 8 - prefs.chaos); // chaos preference = more interstitials
  if (itemCount % interval === 0) {
    return { type: "inter", data: C.rotate(C.INTERSTITIALS, Math.floor(itemCount / interval)) };
  }
  // Prefer a cached backend profile if available; always fall back on-device.
  refillRemote();
  const profile = remoteBuf.length ? remoteBuf.shift() : makeProfile(seed++);
  return { type: "profile", profile };
}

function addCard(item = nextItem()) {
  const el = document.createElement("article");
  el.className = "card";
  el.__item = item;
  if (item.type === "profile") {
    el.__svg = avatarSVG(item.profile.seed);
    if (item.profile.legendary) el.classList.add("legendary");
    el.innerHTML = renderProfile(item.profile, el.__svg);
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
function renderProfile(p, svg) {
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
  // Future: backend profiles may carry a pre-generated photorealistic image.
  const media = p.image ? `<img class="card-img" src="${p.image}" alt="AI-generated portrait" loading="lazy"/>` : svg;
  return `
    <div class="card-photo">
      ${media}
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

function renderInterstitial(d) {
  return `
    <span class="stamp stamp-like">LIKE</span>
    <span class="stamp stamp-nope">NOPE</span>
    <div class="big">${d.big}</div>
    <div class="small">${d.small}</div>
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

function fling(el, action) {
  if (el.classList.contains("flinging")) return;
  const dir = action === "nope" ? -1 : 1;
  el.classList.add("flinging");
  el.style.transition = "transform .4s ease, opacity .4s ease";
  el.style.transform = `translate(${dir * (window.innerWidth + 200)}px, ${dir * 40}px) rotate(${dir * 22}deg)`;
  el.style.opacity = "0";
  finishSwipe(el, action);
}
function flingUp(el) {
  if (el.classList.contains("flinging")) return;
  el.classList.add("flinging");
  el.style.transition = "transform .4s ease, opacity .4s ease";
  el.style.transform = `translateY(${-(window.innerHeight + 200)}px) rotate(-8deg)`;
  el.style.opacity = "0";
  finishSwipe(el, "super");
}
function finishSwipe(el, action) {
  const item = el.__item, likedPrompt = el.__likedPrompt;
  vibrate(action === "nope" ? 10 : 14);
  sfx[action === "nope" ? "nope" : "like"]();
  setTimeout(() => {
    cards = cards.filter((c) => c !== el);
    history.push({ item, svg: el.__svg });
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
  tally(); // anonymous aggregate ping (no-op unless FEATURES.tally)
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
function anyLayerOpen() {
  return ["match-modal", "about-sheet", "chat-sheet", "auth-sheet", "prefs-sheet"]
    .some((id) => !$("#" + id).hidden);
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
  if (last.item.type === "profile") el.__svg = last.svg;
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
  $("#match-face").innerHTML = p.image
    ? `<img src="${p.image}" alt="" style="width:100%;height:100%;object-fit:cover"/>`
    : avatarSVG(p.seed, 240);
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
function openChat(item) {
  chatItem = item;
  const p = item.profile;
  $("#chat-face").innerHTML = avatarSVG(p.seed, 80);
  $("#chat-name").textContent = p.name;
  $("#chat-msgs").innerHTML = "";
  $("#chat-starters").innerHTML = C.CONVO_STARTERS
    .map((s) => `<button class="starter">${s}</button>`).join("");
  addMsg("bot", pick(C.BOT_REPLIES));
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
function send(text) {
  addMsg("me", text);
  vibrate(6);
  const t = $("#chat-typing"); t.hidden = false; scrollChat();
  setTimeout(() => { t.hidden = true; addMsg("bot", pick(C.BOT_REPLIES)); }, 650 + Math.random() * 500);
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
    for (const id of ["chat-sheet", "match-modal", "auth-sheet", "prefs-sheet", "about-sheet"]) {
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
