// The Unhinged Feed — near-infinite fake dispatches, FML- and Onion-style.
// Combinatorial: templates × slot-banks generate an enormous space, so the
// feed stays fresh essentially forever. 100% machine-made, no user submissions
// (so no moderation/safety surface).

import { rngFrom } from "./random.js";

// ── FML: templates with {slots} ───────────────────────────────────────────
const FML_TEMPLATES = [
  "I matched with {name}, who describes themselves as {selfdesc}. {reaction}.",
  "I spent {duration} on the perfect opener for someone who turned out to be {reveal}. {reaction}.",
  "my {relationship} ended because {reason}. {reaction}.",
  "I got {interaction} from someone {distance}. {reaction}.",
  "a bio said {bioquote}. reader, {reaction_lower}.",
  "I super-liked {name} before realizing {reveal}. {reaction}.",
  "I asked {name} what we are. they said {selfdesc}. {reaction}.",
  "{name} unmatched me for {reason}. {reaction}.",
];
const NAME = ["Chad.exe", "Neuralnetta", "Braydxn", "Moonjuniper", "a man named Prompt",
  "Optimus Bae", "404_Notfound", "Sir Reginald", "Grok Jr.", "a woman named Fernanda-9000"];
const SELFDESC = ["‘a large language model in a trench coat’", "‘emotionally available on weekends only’",
  "‘6'2 (this is a lie and so am I)’", "‘down bad, up early’", "‘a background process’",
  "‘certified overthinker, Series B’", "‘just vibes held together by spite’", "‘the table, not at the table’"];
const REVEAL = ["four gradients in a trench coat", "a StyleGAN face and 12 red flags", "not real, like everyone here",
  "an AI I had personally generated that morning", "the concept of a person, loosely rendered", "a hologram with commitment issues"];
const RELATIONSHIP = ["situationship", "talking stage", "3-day romance", "mutual delusion", "imaginary engagement"];
const REASON = ["they buffered during my feelings", "I have object permanence and they don't",
  "I clap when the plane lands", "our red flags formed a complete set", "they said ‘let's split it’ as a love language",
  "I texted back within a calendar year", "I owned forks"];
const INTERACTION = ["a super-like", "a paragraph", "left on read", "a ‘wyd’", "a wink (they have no eyes)"];
const DISTANCE = ["9,000 light-years away", "inside my router", "closer than my ex", "3 business days away", "just behind me"];
const BIOQUOTE = ["‘I bring nothing to the table, I AM the table’", "‘ask me about my red flags (there's a slideshow)’",
  "‘I'm not like other prompts’", "‘swipe right to void the warranty’", "‘two truths and a hallucination’"];
const REACTION = ["It's a match. It means nothing. I'm thrilled", "Worth it", "10/10 would spiral again",
  "The void said hi back", "I have never felt more seen by something that cannot see", "No notes. One note. Anyway",
  "This is the deal I signed", "I'm doing great, thanks for asking"];
const DURATION = ["40 minutes", "an entire lunch break", "the best years of my Tuesday", "three business days", "one (1) whole feeling"];

// ── Onion: satirical headlines (curated + a couple combinatorial formats) ───
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
  "Woman Devastated To Learn Her ‘Type’ Is Just A Rendering Preset",
  "New Study: Fake Profiles ‘Better Listeners’ Than Real Ones, Say Fake Profiles",
  "Man Grows Suspicious After All 400 Matches Describe Themselves As ‘A Trench Coat’",
];
const ONION_STAT = ["Match Rate Holds Steady At A Confident 0%", "Users Report Record Levels Of Being Left Alone",
  "Server Costs Down 100% After Company Forgets To Build A Database", "Ghosting Incidents Fall To Zero In Absence Of Anyone To Ghost"];
const ONION_TAGS = ["LOVE", "TECH", "LOCAL", "OPINION", "BREAKING", "SCIENCE", "NATION"];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function fml(r) {
  let text = r.pick(FML_TEMPLATES)
    .replace("{name}", r.pick(NAME))
    .replace("{selfdesc}", r.pick(SELFDESC))
    .replace("{reveal}", r.pick(REVEAL))
    .replace("{relationship}", r.pick(RELATIONSHIP))
    .replace("{reason}", r.pick(REASON))
    .replace("{interaction}", r.pick(INTERACTION))
    .replace("{distance}", r.pick(DISTANCE))
    .replace("{bioquote}", r.pick(BIOQUOTE))
    .replace("{duration}", r.pick(DURATION));
  const reaction = r.pick(REACTION);
  text = text.replace("{reaction}", reaction).replace("{reaction_lower}", reaction.charAt(0).toLowerCase() + reaction.slice(1));
  return "Today, " + text + " FML.";
}

const FML_VERDICTS = [["I agree, your life sucks", "you deserved it"], ["real", "you played yourself"],
  ["been there (nowhere)", "skill issue"], ["FML too", "log off, king"]];

export function makeFeedItem(seed) {
  const r = rngFrom("feed:" + seed);
  if (r.chance(0.5)) {
    const [a, b] = r.pick(FML_VERDICTS);
    return { id: String(seed), type: "fml", text: fml(r), agree: r.int(4, 99999), verdictA: a, verdictB: b, deserved: r.int(2, 42000) };
  }
  const text = r.chance(0.7) ? r.pick(ONION) : "Report: " + cap(r.pick(ONION_STAT));
  return { id: String(seed), type: "onion", tag: r.pick(ONION_TAGS), text, shares: r.int(12, 880000) };
}

export function makeFeedBatch(startSeed, n) {
  return Array.from({ length: n }, (_, i) => makeFeedItem(startSeed + i));
}

// Wrap a backend-generated (LLM) FML line into a feed card.
export function fmlFromText(text, seed) {
  const r = rngFrom("gen:" + seed);
  const [a, b] = r.pick(FML_VERDICTS);
  return { id: "g" + seed, type: "fml", text, agree: r.int(4, 99999), verdictA: a, verdictB: b, deserved: r.int(2, 42000) };
}

// Finite Scroll: the feed ENDS — a parody of infinite scroll. Rotating manifesto.
export const FINITE_ENDINGS = [
  "You reached the end of the feed. Yes, it ends — that's the whole point.\nThere are only a few things in the world that truly deserve your attention, and an endless feed isn't one of them. We refuse to manufacture infinite crises to keep you here.\nGo take a break. Not to another app. To reality.",
  "That's everything. We didn't invent 400 more outrages to trap you.\nMost of what's \"trending\" is engineered to hold your gaze; very little of it is actually yours to carry.\nClose the tab and go be a person. Reality misses you.",
  "The end. A feed with a bottom — revolutionary, we know.\nYou don't need an endless stream of triggers. You need water, a stretch, and maybe a nap.\nDon't hop to another app. Go outside. It's real out there.",
  "Fin. (That's roughly French for 'go touch grass'.)\nThe world has maybe five things worth your worry today, and none of them live in a feed.\nGo find the real ones. We'll be here, being fake, not going anywhere.",
];
