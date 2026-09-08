// The AI slop factory. Every profile here is 100% certified fake and assembled
// on-device from these word-banks by a seeded RNG. No database, no network, no
// humans were dated in the making of this app.

import { rngFrom } from "./random.js";

const NAMES = [
  "Braydxn", "Kaeleigh", "Chad.exe", "Moonjuniper", "Tyler (unverified)",
  "Aveeery", "Brookelynn", "G… wait let me check", "Sir Reginald", "Prompt",
  "Zaddyus", "Mmbagel", "Fernanda-9000", "Blayze", "Aiden No.4",
  "Cassixdy", "Grok Jr.", "Beatrix", "Hunter?", "Neuralnetta",
  "DeShaun-2", "Loraxine", "Vincent Adultman", "Skyeler", "Optimus Bae",
  "Madyzon", "The Algorithm", "Gwenda", "404_Notfound", "Björnathan",
];

const AGES = [
  "18", "19", "21", "22", "24", "25", "26", "27", "28", "29", "30",
  "31", "33", "34", "37", "42", "1,024 (in epochs)", "34 (in dog years)",
  "27 but emotionally 6", "age is a construct", "∞", "0.7 (temperature)",
];

const JOBS = [
  "Professional bubble-wrap popper", "Vibes analyst, Series B", "Chaos coordinator",
  "Freelance red flag", "Reply-guy (retired)", "Certified overthinker",
  "Part-time villain in my ex's story", "Founder of a company that does nothing",
  "Emotional support influencer", "Barista at a café that doesn't exist",
  "Large language model in a trench coat", "Full-stack liar",
  "CEO of leaving you on read", "Unpaid intern at my own life",
  "Sommelier of gas-station wine", "Competitive napper (regional finalist)",
  "Crypto refugee", "I ‘consult’", "Beekeeper (no bees)",
  "Astrologer for houseplants", "Professional wedding crasher",
  "Ghost (literally)", "Middle manager of my group chat",
];

const TAGLINES = [
  "Here for a good time, not a real one.",
  "Certified AI slop. Swipe responsibly.",
  "I peaked in the training data.",
  "Emotionally unavailable but geographically nearby.",
  "Looking for someone to ignore texts from.",
  "Will love-bomb, then buffer.",
  "Ask me about my red flags (there's a slideshow).",
  "I'm not like other prompts.",
  "Green flag energy, red flag execution.",
  "Fluent in sarcasm and one (1) other language.",
  "Down bad, up early.",
  "Two truths and a hallucination.",
  "Swipe right to void the warranty.",
  "My love language is aggressively fine.",
];

const BIOS = [
  "I generated my own personality this morning and I'm honestly obsessed with her.",
  "6'2 because apparently that matters to you people. It's a lie. Everything is a lie. That's the brand.",
  "I will plan an elaborate first date and then suggest we ‘just grab coffee’ 40 minutes away.",
  "My therapist and I are working on why I opened this app instead of doing literally anything else.",
  "Looking for my player two. Warning: I pause the game to talk about my feelings.",
  "Not to be dramatic but if you don't like my dog we are getting divorced (I do not have a dog).",
  "I contain multitudes and at least three unresolved subscriptions.",
  "Fun fact: none of these facts are fun, and I am not real.",
  "I bring nothing to the table. I AM the table. Sit.",
  "Swipe right and I'll send you a paragraph. Swipe left and I'll send you a paragraph.",
  "I'm the reason the ‘block’ button has a confirmation dialog.",
  "Big ‘texts back in 4-6 business days’ energy.",
  "I once returned a mattress after 89 nights. I will return you too. Emotionally.",
  "My ideal Sunday: brunch, a walk, and quietly restructuring my entire attachment style.",
];

const PROMPTS = [
  ["My most irrational fear is", [
    "that the barista is judging my order (she is, I designed her to)",
    "the moment right before the microwave hits 0:00",
    "someone asking ‘what are we?’ while I'm still a beta feature",
    "birds. all of them. yes even that one.",
    "being perceived, generally, at any distance",
  ]],
  ["Green flags I have", [
    "I text back (in a parallel universe)",
    "I remember your coffee order and your childhood trauma",
    "financially literate enough to know I'm broke",
    "I've never been arrested on this particular continent",
    "I clap when the plane lands, ironically, which is worse",
  ]],
  ["The way to win me over is", [
    "argue with me about a fact you're wrong about, confidently",
    "show me a picture of your fridge, no context",
    "have opinions about at least one (1) sandwich",
    "let me win at mini golf while pretending you didn't",
    "just be normal. i've never seen it. i want to.",
  ]],
  ["Two truths and a lie", [
    "I'm a doctor. I'm 6'4. I know what a doctor does.",
    "I've read the book. I've seen the movie. I have object permanence.",
    "I love hiking. I love travel. I have left the house.",
    "I'm low maintenance. I'm easy going. This app is a documentary.",
    "I'm over my ex. My ex knows I'm over them. My ex exists.",
  ]],
  ["We'll get along if", [
    "you also apologize to Roomba when you kick it",
    "your red flags and mine form a complete set",
    "you think ‘let's split it’ is a love language",
    "you can sit in comfortable silence for 45–90 minutes",
    "you're also just vibes held together by caffeine and spite",
  ]],
  ["A shower thought I refuse to let go of", [
    "if I delete this app, do I cease to exist? (yes)",
    "every group chat has a final boss and it's usually me",
    "‘per my last text’ is just corporate for ‘bestie WHAT’",
    "the ‘seen’ receipt is humanity's greatest mistake",
    "I'm not procrastinating, I'm loading",
  ]],
];

const RED_AS_GREEN = [
  "Emotionally unavailable ✅ (it's giving mysterious)",
  "Still ‘friends’ with every ex ✅ (great networker)",
  "Texts back once a fortnight ✅ (respects your space)",
  "Talks about their startup unprompted ✅ (passionate)",
  "Owns zero (0) forks ✅ (minimalist)",
  "Cried at a car commercial ✅ (deeply feeling)",
  "Has a ‘finsta’ for their houseplants ✅ (nurturing)",
];

const DISTANCE = [
  "0.3 miles away", "just behind you", "1 unresolved feeling away",
  "3 business days away", "somewhere in the cloud", "42 km / 1 red flag",
  "closer than your ex", "inside the router", "9,000 light-years away",
  "same coffee shop, too shy", "left on read, 2 blocks over",
];

// Interests: pick a handful of chips.
const INTERESTS = [
  "doomscrolling", "gaslighting (recreational)", "matcha", "true crime",
  "ghosting", "astrology", "gym (theoretical)", "thrifting", "lofi beats",
  "overthinking", "spite", "hot yoga (cold)", "board games", "arson (fictional)",
  "cheese", "manifesting", "vinyl I can't play", "meal-prepping once",
  "walks that become talks", "aggressive optimism", "canceling plans",
];

// Playful "AI artifact" watermarks stamped on some cards.
const AI_ARTIFACTS = [
  "6 fingers, extremely confident",
  "background melts if you stare",
  "teeth: yes",
  "generated at temperature 1.4",
  "hands rendered by committee",
  "eyes track you across the room",
  "this jawline is load-bearing",
];

export function makeProfile(seed) {
  const r = rngFrom("unhinged:" + seed);
  const promptSet = r.some(PROMPTS, 3).map(([q, answers]) => ({
    q,
    a: r.pick(answers),
  }));

  return {
    id: String(seed),
    seed: "unhinged:" + seed,
    name: r.pick(NAMES),
    age: r.pick(AGES),
    job: r.pick(JOBS),
    distance: r.pick(DISTANCE),
    tagline: r.pick(TAGLINES),
    bio: r.pick(BIOS),
    interests: r.some(INTERESTS, r.int(3, 5)),
    prompts: promptSet,
    greenflag: r.pick(RED_AS_GREEN),
    artifact: r.chance(0.7) ? r.pick(AI_ARTIFACTS) : null,
    matchLine: r.pick([
      "It's a match! Neither of you is real. Perfect.",
      "You matched! Now what. Exactly. Nothing.",
      "Mutual delusion achieved. Congrats.",
      "It's a match! They will not text first. Nobody will. Bliss.",
      "Certified match. 0% chance of heartbreak. Also 0% chance of anything.",
    ]),
  };
}

// A stable label used everywhere to reinforce the pitch.
export const CERTIFIED = "100% AI-generated · not a real person";
