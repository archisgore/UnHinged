// Procedural "AI-generated" portraits as inline SVG. Deterministic per seed,
// so a profile always wears the same face. Intentionally a little off — extra
// eyes, melty gradients, a watermark — because the fakeness IS the feature.

import { rngFrom } from "./random.js";

const SKIN = ["#F2C9A0", "#E8B48C", "#C98B63", "#8D5A3C", "#F4D0B0", "#B57C57",
  "#9AA7FF", "#8BD3C7", "#E7A6C4", "#C9B7FF"]; // includes obviously-unreal tones
const HAIR = ["#2B2B2B", "#5A3A22", "#8A5A2B", "#C9A227", "#B23A48", "#3A5BA0",
  "#7A2BAE", "#20A39E", "#E86AA6", "#111111", "#D14E2B"];
const BG = [
  ["#FFE29A", "#FF9AA2"], ["#A0E9FF", "#B980F0"], ["#FFD6E7", "#C1FBA4"],
  ["#FBC2EB", "#A6C1EE"], ["#FDCBF1", "#E6DEE9"], ["#84FAB0", "#8FD3F4"],
  ["#FCCB90", "#D57EEB"], ["#E0C3FC", "#8EC5FC"], ["#F6D365", "#FDA085"],
];

const D = 800; // fixed design space; `size` only sets the rendered width/height

// Build one SVG portrait string.
export function avatarSVG(seed, size = 800) {
  const r = rngFrom("face:" + seed);
  const [c1, c2] = r.pick(BG);
  const skin = r.pick(SKIN);
  const hair = r.pick(HAIR);
  const gid = "g" + Math.abs(hashSeed(seed));

  const eyeY = 320 + r.int(-15, 15);
  const eyeGap = 120 + r.int(-15, 25);
  const cx = 400;
  const thirdEye = r.chance(0.18); // certified artifact
  const smileW = 70 + r.int(-20, 60);
  const smileDrop = r.int(-10, 40);
  const rot = r.int(-4, 4);

  const eye = (x) => `
    <ellipse cx="${x}" cy="${eyeY}" rx="34" ry="${26 + r.int(-4, 10)}" fill="#fff"/>
    <circle cx="${x + r.int(-6, 6)}" cy="${eyeY + r.int(-4, 6)}" r="15" fill="#2a2a2a"/>
    <circle cx="${x + 5}" cy="${eyeY - 5}" r="4" fill="#fff"/>`;

  // hair as two overlapping blobs for that "diffusion smear" look
  const hair1 = 150 + r.int(-20, 20);

  return `
<svg viewBox="0 0 ${D} ${D}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI-generated portrait">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <filter id="${gid}b"><feGaussianBlur stdDeviation="6"/></filter>
    <radialGradient id="${gid}v" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.28"/>
    </radialGradient>
  </defs>

  <rect width="${D}" height="${D}" fill="url(#${gid})"/>
  <!-- soft blobs -->
  <circle cx="${r.int(80, 720)}" cy="${r.int(80, 300)}" r="${r.int(60, 160)}" fill="#ffffff" opacity="0.18" filter="url(#${gid}b)"/>
  <circle cx="${r.int(80, 720)}" cy="${r.int(500, 740)}" r="${r.int(80, 200)}" fill="#000000" opacity="0.08" filter="url(#${gid}b)"/>

  <g transform="rotate(${rot} ${cx} 430)">
    <!-- shoulders -->
    <path d="M170 800 C 200 620 300 560 400 560 C 500 560 600 620 630 800 Z" fill="${hair}" opacity="0.9"/>
    <path d="M215 800 C 240 660 320 610 400 610 C 480 610 560 660 585 800 Z" fill="#ffffff" opacity="0.85"/>

    <!-- hair back -->
    <ellipse cx="${cx}" cy="300" rx="${hair1 + 40}" ry="${hair1 + 20}" fill="${hair}"/>
    <!-- face -->
    <ellipse cx="${cx}" cy="330" rx="140" ry="165" fill="${skin}"/>
    <!-- ears -->
    <circle cx="${cx - 140}" cy="345" r="26" fill="${skin}"/>
    <circle cx="${cx + 140}" cy="345" r="26" fill="${skin}"/>
    <!-- hair front smear -->
    <path d="M${cx - 165} 300 C ${cx - 150} 170, ${cx + 150} 170, ${cx + 165} 300
             C ${cx + 120} 250, ${cx - 120} 250, ${cx - 165} 300 Z" fill="${hair}"/>

    ${eye(cx - eyeGap / 2)}
    ${eye(cx + eyeGap / 2)}
    ${thirdEye ? eye(cx + r.int(-30, 30)).replace(`cy="${eyeY}"`, `cy="${eyeY - 70}"`) : ""}

    <!-- nose -->
    <path d="M${cx} ${eyeY + 30} q -14 60 4 74" fill="none" stroke="#00000033" stroke-width="8" stroke-linecap="round"/>
    <!-- mouth -->
    <path d="M${cx - smileW} ${eyeY + 140} q ${smileW} ${80 + smileDrop} ${smileW * 2} 0"
          fill="none" stroke="#B23A48" stroke-width="12" stroke-linecap="round"/>
  </g>

  <rect width="${D}" height="${D}" fill="url(#${gid}v)"/>
  <!-- watermark: the whole point -->
  <g opacity="0.9" transform="translate(${D - 150} ${D - 40})">
    <rect x="-14" y="-26" width="150" height="34" rx="17" fill="#000000" opacity="0.45"/>
    <text x="60" y="-3" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="#fff">✦ AI FAKE</text>
  </g>
</svg>`;
}

function hashSeed(s) {
  let h = 0;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

// Convenience: an SVG data URI (handy for <img> or CSS backgrounds / native later).
export function avatarDataURI(seed, size = 800) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(avatarSVG(seed, size));
}
