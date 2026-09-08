// Tiny WebAudio sound design — no audio files, just synthesized blips, so it
// stays offline and weightless. Everything is gated behind a mute toggle and
// only starts after a user gesture (browser autoplay rules).

let actx = null;
let muted = false;

export function initAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; }
  }
  if (actx && actx.state === "suspended") actx.resume().catch(() => {});
}
export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function blip({ freq = 440, dur = 0.08, type = "sine", gain = 0.06, slideTo = null, delay = 0 }) {
  if (!actx || muted) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur); // can't ramp to 0
  o.connect(g).connect(actx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  swipe: () => blip({ freq: 320, slideTo: 190, dur: 0.07, type: "triangle", gain: 0.05 }),
  nope: () => blip({ freq: 200, slideTo: 120, dur: 0.09, type: "sawtooth", gain: 0.04 }),
  like: () => blip({ freq: 520, slideTo: 740, dur: 0.08, type: "triangle", gain: 0.05 }),
  match: () => { blip({ freq: 523, dur: 0.12 }); blip({ freq: 659, dur: 0.12, delay: 0.09 }); blip({ freq: 784, dur: 0.2, delay: 0.18 }); },
  jackpot: () => { [523, 659, 784, 1047].forEach((f, i) => blip({ freq: f, dur: 0.16, delay: i * 0.08, gain: 0.07 })); },
  achieve: () => { blip({ freq: 660, dur: 0.1 }); blip({ freq: 990, dur: 0.16, delay: 0.09 }); },
  tap: () => blip({ freq: 600, slideTo: 820, dur: 0.05, gain: 0.035 }),
  refuse: () => { blip({ freq: 180, dur: 0.1, type: "square", gain: 0.04 }); blip({ freq: 140, dur: 0.14, delay: 0.1, type: "square", gain: 0.04 }); },
};
