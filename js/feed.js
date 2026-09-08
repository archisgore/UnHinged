// The Unhinged Feed — an infinite scroll of fake dispatches, in the spirit of
// FML and The Onion. 100% machine-generated, like everything here. No user
// submissions (so no moderation/safety surface); pure procedural comedy.

import { rngFrom } from "./random.js";

// FML-style confessions: "Today, <thing>. FML."
const FML = [
  "I matched with a man named Chad.exe who lists his job as ‘large language model in a trench coat.’ I said ‘same.’ We are perfect for each other and also not real.",
  "I spent 40 minutes crafting the perfect opener for a profile, then remembered she is four gradients in a trench coat. I sent it anyway. She left me on read. There is no read.",
  "I got super-liked by someone 9,000 light-years away and genuinely considered the commute.",
  "my situationship ended because he buffered during my feelings. he says he ‘lacks object permanence.’ he does.",
  "I unmatched a guy for having six fingers, then matched three more with six fingers. the app is trying to tell me something. the app is a slideshow.",
  "I told my therapist I feel seen by an AI-generated woman named Neuralnetta. she asked ‘by whom.’ exactly.",
  "someone's bio said ‘I bring nothing to the table, I AM the table.’ reader, I sat.",
  "I've been doomswiping for two hours and my match rate is a proud, stable 0%. my entertainment rate is unaffected. this is the deal I signed.",
  "I liked a prompt that said ‘win me over by being normal, I've never seen it.’ it's a match. it means nothing. I'm thrilled.",
  "I caught feelings for a profile whose photo melts if you stare. so I stared. worth it.",
  "I clapped when the plane landed and my match ghosted me mid-flight. they were not on the flight. they are not anywhere.",
  "matched with ‘The Algorithm.’ conversation was one-sided and vaguely threatening. 10/10 would be recommended to again.",
]

// Onion-style satirical headlines about AI dating / Unhinged.
const ONION = [
  "Area Man Emotionally Devastated By Rejection From Profile He Was Fully Aware Is A Gradient",
  "Report: 100% Of Matches Confirmed Fake, Up From Industry Average Of 99%",
  "Local Woman's Situationship With AI Man Ends After He Buffers During Her Feelings",
  "Study Finds Users 400% More Relaxed Once Told None Of It Was Real",
  "Nation's Loneliest Man Finally At Peace After App Promises To Track Absolutely Nothing",
  "Heartbroken User Comforted By Fact That Heartbreaker Does Not Technically Exist",
  "Dating App Announces Bold New Feature: Continuing To Not Have Your Data",
  "Man Who Read Terms Of Service Reports It Was, Against All Odds, Kind Of Nice",
  "Sources: Six-Fingered Suitor ‘Extremely Confident’ Despite Everything",
  "Breaking: Local Swiper Achieves Enlightenment After Realizing The Void Swipes Back",
  "AI Bachelor Ends Season Early, Citing Lack Of Object Permanence",
  "Experts Warn Doomswiping Unhinged May Cause Unexpected Bouts Of Laughing Alone",
]

const FML_VERDICTS = [
  ["I agree, your life sucks", "you deserved it"],
  ["real", "you played yourself"],
  ["been there (nowhere)", "skill issue"],
  ["FML too", "log off, king"],
]

const ONION_TAGS = ["LOVE", "TECH", "LOCAL", "OPINION", "BREAKING", "SCIENCE", "NATION"]

export function makeFeedItem(seed) {
  const r = rngFrom("feed:" + seed);
  if (r.chance(0.5)) {
    const [a, b] = r.pick(FML_VERDICTS);
    return {
      id: String(seed),
      type: "fml",
      text: "Today, " + r.pick(FML) + " FML.",
      agree: r.int(4, 9999),
      verdictA: a,
      verdictB: b,
      deserved: r.int(2, 4200),
    };
  }
  return {
    id: String(seed),
    type: "onion",
    tag: r.pick(ONION_TAGS),
    text: r.pick(ONION),
    shares: r.int(12, 88000),
  };
}

export function makeFeedBatch(startSeed, n) {
  return Array.from({ length: n }, (_, i) => makeFeedItem(startSeed + i));
}
