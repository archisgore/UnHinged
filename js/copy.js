// All the witty bits in one place. Later this can be served from the backend
// (A/B the jokes, rotate seasonal lines, etc.) — for now it's static & offline.

export const TAGLINE = "The dating app that's finally honest: everyone's fake.";

export const HERO = {
  kicker: "Dating App Fidget Spinner",
  title: "Unhinged",
  sub: "Every other app is 99% bots and catfish. We're just the first to put it on the label.",
  cta: "Start doomswiping",
  finePrint: "No account. No tracking. No one is real. You're welcome.",
};

// Shown as a rotating set of one-liners under the hero / in the about sheet.
export const PITCHES = [
  "You won't find your soulmate here. But you WILL be entertained. That's the trade.",
  "99% of dating apps are fake profiles. We rounded up to 100% and stopped lying about it.",
  "Swipe for hours. Owe nothing. Not even a phone number.",
  "It's not ghosting if they were never alive.",
  "Finally, a match rate of 0% and a satisfaction rate of yes.",
  "All the dopamine of dating. None of the human beings.",
  "We can't break your heart. We don't have your data. We barely have a server.",
  "Other apps monetize your loneliness. We just make fun of it, for free.",
  "Certified 100% AI slop. The good kind. The kind that doesn't text your ex.",
  "Think of it as a lava lamp for people who used to have crushes.",
];

// The 'why this exists' sheet.
export const ABOUT = {
  title: "Why Unhinged?",
  body: [
    "Dating apps got serious, extractive, and — let's be honest — mostly fake. Bots, catfish, recycled photos, that one guy holding a fish. You already knew.",
    "Unhinged is the parody that says the quiet part out loud: every profile here is certified AI-generated slop, and so is every photo. Nobody is real. Nobody is watching. There is no account, no database, no algorithm quietly learning your ‘type.’",
    "So swipe like a maniac. Nothing is tracked, nothing is stored, no one is judged (there's no one there to judge). Worst case, you don't find love. Best case, you were entertained for the price of exactly nothing.",
    "It's the one app you can give your attention to that asks for absolutely nothing back.",
  ],
  footer: "P.S. There's a bigger idea coming — using all this fakeness to nudge people toward the real, in-person kind of connection. But that's a later problem. For now: swipe, snort-laugh, repeat.",
};

// Micro-copy for the action buttons (tooltips / aria).
export const ACTIONS = {
  rewind: "Rewind (into a past that also didn't happen)",
  nope: "Nope",
  superlike: "Super Unhinged",
  like: "Like (harmless, we promise)",
  boost: "Boost (does nothing, feels great)",
};

// Toasts that fire on swipe — short, punchy, never repeat back-to-back.
export const NOPE_TOASTS = [
  "Rejected a hologram. Powerful.",
  "They didn't even feel it. They can't feel.",
  "One less imaginary friend.",
  "Brutal. To no one.",
  "Left. Like their moral compass.",
];
export const LIKE_TOASTS = [
  "Liked! They're flattered, theoretically.",
  "Bold. Baseless. Beautiful.",
  "Your secret's safe — there's no database to keep it in.",
  "You have taste. They have no soul. Balanced.",
  "Noted by absolutely nobody.",
];
export const SUPER_TOASTS = [
  "Super Unhinged?! You KNOW they're not real, right?",
  "That's the spirit. Down horrendous for a gradient.",
  "A super-like into the void. The void says hi.",
];

// Occasional "interstitial" cards dropped into the deck for a beat of comedy.
export const INTERSTITIALS = [
  {
    big: "Reminder",
    small: "None of these people exist. You are doing great. Keep swiping.",
  },
  {
    big: "Other apps right now",
    small: "…are showing you a bot named ‘Ashley, 26’ and charging you $39.99 to talk to it.",
  },
  {
    big: "Your match rate: 0%",
    small: "Your entertainment rate: unaffected. This is the deal you signed up for.",
  },
  {
    big: "Fun fact",
    small: "We couldn't sell your data if we wanted to. We never collected any. Sleep well.",
  },
  {
    big: "A moment of honesty",
    small: "Every dating app is mostly fake profiles. We're just the only one wearing it as a badge.",
  },
];

export const rotate = (arr, i) => arr[i % arr.length];
