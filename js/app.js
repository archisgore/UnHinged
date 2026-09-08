import { makeProfile, CERTIFIED } from "./generator.js";
import { avatarSVG } from "./avatar.js";
import * as C from "./copy.js";

const $ = (sel) => document.querySelector(sel);

/* ───────── Landing ───────── */
$("#hero-kicker").textContent = C.HERO.kicker;
$("#hero-title").textContent = C.HERO.title;
$("#hero-sub").textContent = C.HERO.sub;
$("#start-btn").textContent = C.HERO.cta;
$("#hero-fine").textContent = C.HERO.finePrint;

// rotate the pitch line on the landing screen
let pitchI = 0;
const pitchEl = $("#hero-pitch");
const showPitch = () => {
  pitchEl.style.opacity = "0";
  setTimeout(() => {
    pitchEl.textContent = "“" + C.rotate(C.PITCHES, pitchI++) + "”";
    pitchEl.style.opacity = ".82";
  }, 300);
};
showPitch();
const pitchTimer = setInterval(showPitch, 4200);

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
function openLayer(id) { const el = $("#" + id); el.hidden = false; }
function closeLayer(id) { $("#" + id).hidden = true; }

/* ───────── Deck ───────── */
const deck = $("#deck");
const KEEP = 3; // cards kept live in the DOM
let seed = 1; // ever-incrementing; the whole "database"
let itemCount = 0;
let cards = []; // live card elements, back → front (last = top)
let history = []; // for rewind
let started = false;

function startApp() {
  if (started) return;
  started = true;
  clearInterval(pitchTimer);
  $("#landing").hidden = true;
  $("#app").hidden = false;
  for (let i = 0; i < KEEP; i++) addCard();
  layout();
}

// Decide the next item: mostly profiles, an occasional comedy interstitial.
function nextItem() {
  itemCount++;
  if (itemCount % 7 === 0) {
    return { type: "inter", data: C.rotate(C.INTERSTITIALS, Math.floor(itemCount / 7)) };
  }
  return { type: "profile", profile: makeProfile(seed++) };
}

function addCard(item = nextItem()) {
  const el = document.createElement("article");
  el.className = "card";
  el.__item = item;
  if (item.type === "profile") {
    el.__svg = avatarSVG(item.profile.seed);
    el.innerHTML = renderProfile(item.profile, el.__svg);
  } else {
    el.classList.add("inter");
    el.innerHTML = renderInterstitial(item.data);
  }
  deck.insertBefore(el, deck.firstChild); // new card goes to the back
  cards.unshift(el);
  makeDraggable(el);
  return el;
}

// keep the visual stack (scale/translate the ones behind the top card)
function layout() {
  cards.forEach((el, i) => {
    const depth = cards.length - 1 - i; // 0 = top
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
    .map((pr) => `<div class="prompt"><div class="q">${pr.q}…</div><div class="a">${pr.a}</div></div>`)
    .join("");
  const artifact = p.artifact
    ? `<div class="artifact-badge">⚠︎ AI artifact: ${p.artifact}</div>` : "";
  return `
    <div class="card-photo">
      ${svg}
      <div class="photo-fade"></div>
      <div class="cert-badge">✦ ${CERTIFIED}</div>
      ${artifact}
      <span class="stamp stamp-like">LIKE</span>
      <span class="stamp stamp-nope">NOPE</span>
      <div class="photo-name">
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

/* ───────── Swipe / drag ───────── */
function makeDraggable(el) {
  let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false, id = null;
  const likeStamp = el.querySelector(".stamp-like");
  const nopeStamp = el.querySelector(".stamp-nope");

  const down = (e) => {
    if (el !== topCard()) return;
    dragging = true; id = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    el.setPointerCapture(id);
    el.classList.add("dragging");
    el.style.transition = "none";
  };
  const move = (e) => {
    if (!dragging) return;
    dx = e.clientX - startX; dy = e.clientY - startY;
    const rot = dx / 18;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    const k = Math.min(Math.abs(dx) / 90, 1);
    if (likeStamp && nopeStamp) {
      likeStamp.style.opacity = dx > 0 ? String(k) : "0";
      nopeStamp.style.opacity = dx < 0 ? String(k) : "0";
    }
    hideHint();
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    if (Math.abs(dx) > 100) {
      fling(el, dx > 0 ? "like" : "nope");
    } else {
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
  const dir = action === "nope" ? -1 : 1;
  el.classList.add("flinging");
  el.style.transition = "transform .4s ease, opacity .4s ease";
  el.style.transform = `translate(${dir * (window.innerWidth + 200)}px, ${dir * 40}px) rotate(${dir * 22}deg)`;
  el.style.opacity = "0";
  const item = el.__item;
  setTimeout(() => {
    cards = cards.filter((c) => c !== el);
    history.push({ item, svg: el.__svg });
    if (history.length > 20) history.shift();
    el.remove();
    addCard();
    layout();
  }, 260);
  reactTo(action, item);
}

/* ───────── Actions ───────── */
function reactTo(action, item) {
  if (action === "nope") toast(pick(C.NOPE_TOASTS));
  else if (action === "super") {
    toast(pick(C.SUPER_TOASTS));
    if (item.type === "profile") showMatch(item);
  } else if (action === "like") {
    toast(pick(C.LIKE_TOASTS));
    if (item.type === "profile" && Math.random() < 0.4) showMatch(item);
  }
}

document.querySelector(".actions").addEventListener("click", (e) => {
  const btn = e.target.closest(".act");
  if (!btn) return;
  const action = btn.dataset.action;
  const top = topCard();
  if (action === "boost") { toast(pick(["Boosted! Into the same void, but faster.", "You are now 400% more invisible.", "Boost active. Audience: still zero."])); return; }
  if (action === "rewind") { rewind(); return; }
  if (!top) return;
  manualFling(top, action);
});

// buttons fling the top card programmatically
function manualFling(top, action) {
  if (!top || top.classList.contains("flinging")) return;
  if (action === "super") { flingUp(top); return; }
  fling(top, action);
}
function flingUp(el) {
  el.classList.add("flinging");
  el.style.transition = "transform .4s ease, opacity .4s ease";
  el.style.transform = `translateY(${-(window.innerHeight + 200)}px) rotate(-8deg)`;
  el.style.opacity = "0";
  const item = el.__item;
  setTimeout(() => {
    cards = cards.filter((c) => c !== el);
    history.push({ item, svg: el.__svg });
    el.remove(); addCard(); layout();
  }, 260);
  reactTo("super", item);
}

function rewind() {
  const last = history.pop();
  if (!last) { toast("Nothing to rewind. The past is as fake as the present."); return; }
  toast("Rewound. Reliving a moment that never happened.");
  // drop the oldest live card to keep the DOM lean, then re-add last on top
  if (cards.length >= KEEP) { const back = cards.shift(); back.remove(); }
  const el = addCard(last.item);
  if (last.item.type === "profile") { el.__svg = last.svg; }
  // ensure it lands on top
  deck.appendChild(el);
  cards = cards.filter((c) => c !== el);
  cards.push(el);
  layout();
}

/* ───────── Match modal ───────── */
function showMatch(item) {
  const p = item.profile;
  $("#match-face").innerHTML = avatarSVG(p.seed, 240);
  $("#match-line").textContent = p.matchLine;
  openLayer("match-modal");
}

/* ───────── Toast ───────── */
let lastToast = "";
const toastEl = $("#toast");
let toastTimer = null;
function toast(msg) {
  if (msg === lastToast) return; // never repeat back-to-back
  lastToast = msg;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let hintHidden = false;
function hideHint() { if (!hintHidden) { hintHidden = true; $("#swipe-hint").style.opacity = "0"; } }

/* ───────── Keyboard (desktop) ───────── */
window.addEventListener("keydown", (e) => {
  if (!started || !topCard()) return;
  if (e.key === "ArrowLeft") manualFling(topCard(), "nope");
  else if (e.key === "ArrowRight") manualFling(topCard(), "like");
  else if (e.key === "ArrowUp") manualFling(topCard(), "super");
});

/* ───────── PWA ───────── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {})
  );
}
