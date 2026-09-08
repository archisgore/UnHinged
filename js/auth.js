// Auth — fully plumbed, deliberately refusing.
//
// The product decision is that Unhinged has NO accounts (no tracking, no data).
// So the buttons say "Don't Login" and "Don't Signup", and these functions
// politely refuse. But the plumbing is real and async-shaped: when a backend
// exists, `login`/`signup` can POST to it and this refusal becomes the default
// only when accounts are disabled. See backend/ and js/config.js.

import { API, FEATURES } from "./config.js";

const REFUSALS = {
  login: [
    "There is nothing to log into. That's the feature, not a bug.",
    "Login failed successfully. You have no account and never will.",
    "We checked. You're not in the database. There is no database.",
  ],
  signup: [
    "You cannot sign up. We refuse to know you. You're welcome.",
    "Account NOT created. We collected nothing. Sleep well.",
    "Signup declined — by us, on principle, forever.",
  ],
};

function refuse(kind) {
  const list = REFUSALS[kind];
  return { ok: false, refused: true, reason: list[Math.floor(Math.random() * list.length)] };
}

// Async-shaped so a real backend can drop in without changing callers.
export async function login(_email, _password) {
  if (!FEATURES.accounts) return refuse("login");
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: _email, password: _password }),
  });
  return r.json();
}

export async function signup(_email, _password) {
  if (!FEATURES.accounts) return refuse("signup");
  const r = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: _email, password: _password }),
  });
  return r.json();
}
