// make-portraits.js — generate placeholder holographic-bust portraits (one SVG per figure)
// in the family colours from CHARACTER-ART-BRIEF.md, each with a role emblem, a silhouette
// archetype, and the character's nael knot-row worked into the frame. Placeholder art meant
// to look intentional until the real portraits arrive. Run: `node tools/make-portraits.js`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'portraits');
mkdirSync(OUT, { recursive: true });

// family colours (from the art brief / game palette)
const GOLD = '#ffd56b', PURPLE = '#b06cff', GREEN = '#54ffb0', BLUE = '#4fd6ff',
  BRONZE = '#c2a878', CRIMSON = '#ff5d7a', ORANGE = '#ff9a3c';

// ---- silhouette archetypes (viewBox 120x72) --------------------------------------------
const BUST = {
  adult: `<path d="M24 72 C24 52 40 47 60 47 C80 47 96 52 96 72 Z"/><rect x="54" y="36" width="12" height="8" rx="2"/><circle cx="60" cy="26" r="13"/>`,
  child: `<path d="M35 72 C35 57 46 53 60 53 C74 53 85 57 85 72 Z"/><rect x="56" y="40" width="8" height="7" rx="2"/><circle cx="60" cy="30" r="10"/>`,
  hooded: `<path d="M24 72 C24 52 40 47 60 47 C80 47 96 52 96 72 Z"/><circle cx="60" cy="27" r="12"/><path d="M42 30 Q60 4 78 30 Q60 20 42 30 Z"/>`,
  masked: `<path d="M24 72 C24 52 40 47 60 47 C80 47 96 52 96 72 Z"/><rect x="54" y="36" width="12" height="8" rx="2"/><circle cx="60" cy="26" r="13"/><rect x="46" y="22" width="28" height="7" rx="2" opacity="0.9"/>`,
  monument: `<path d="M30 72 V22 H90 V72" fill="none"/><path d="M30 30 H90 M30 44 H90 M30 58 H90" fill="none"/><path d="M60 30 L72 44 L60 58 L48 44 Z"/>`,
};

// ---- crowns (for rulers) ---------------------------------------------------------------
const CROWN = {
  spindle: `<path d="M46 14 L50 5 L55 12 L60 3 L65 12 L70 5 L74 14 Z"/><path d="M60 3 V-2 M50 5 L44 0 M70 5 L76 0" stroke-width="1" opacity="0.7"/>`,
  band: `<path d="M48 15 L52 9 L56 14 L60 8 L64 14 L68 9 L72 15 Z"/>`,
  scales: `<path d="M48 15 L52 9 L56 14 L60 8 L64 14 L68 9 L72 15 Z"/><path d="M60 8 V2 M50 4 H70 M50 4 L46 9 M70 4 L74 9" stroke-width="1" fill="none" opacity="0.85"/>`,
};

// ---- role emblems (small, centred ~ x60 y57) -------------------------------------------
const EM = {
  threads: `<path d="M60 48 V66 M52 50 L60 58 M68 50 L60 58 M50 60 H70" stroke-width="1.4" fill="none"/>`,
  loomfoot: `<path d="M50 52 H70 M50 52 V64 M70 52 V64 M50 64 L46 68 M70 64 L74 68 M56 52 V64 M64 52 V64" stroke-width="1.2" fill="none"/>`,
  cutthread: `<path d="M52 58 H57 M63 58 H68 M58 54 L62 62" stroke-width="1.4" fill="none"/>`,
  blank: `<rect x="52" y="50" width="16" height="14" rx="2" fill="none" stroke-width="1.2" opacity="0.6"/>`,
  gear: `<circle cx="60" cy="57" r="6" fill="none" stroke-width="1.4"/><path d="M60 49 V51 M60 63 V65 M52 57 H54 M66 57 H68 M54 51 L56 53 M66 63 L64 61" stroke-width="1.2"/>`,
  hands: `<path d="M50 60 Q55 54 60 60 Q65 54 70 60" fill="none" stroke-width="1.4"/>`,
  crack: `<path d="M50 60 L54 52 L58 60 L62 52 L66 60 L70 52" fill="none" stroke-width="1.3" opacity="0.7"/><path d="M60 52 L58 66 L62 60" stroke-width="1" fill="none"/>`,
  compass: `<path d="M60 49 L63 57 L60 65 L57 57 Z"/><circle cx="60" cy="57" r="8" fill="none" stroke-width="1"/>`,
  shout: `<path d="M56 52 Q64 57 56 62" fill="none" stroke-width="1.4"/><path d="M62 50 Q72 57 62 64 M66 47 Q79 57 66 67" fill="none" stroke-width="1" opacity="0.6"/>`,
  shuttle: `<path d="M48 57 Q60 49 72 57 Q60 65 48 57 Z" fill="none" stroke-width="1.4"/><circle cx="60" cy="57" r="2"/><path d="M72 57 L80 55 M72 57 L80 60" stroke-width="1" opacity="0.7"/>`,
  key: `<circle cx="55" cy="57" r="4" fill="none" stroke-width="1.4"/><path d="M59 57 H70 M66 57 V61 M70 57 V61" stroke-width="1.4" fill="none"/>`,
  unravel: `<path d="M52 50 V64 M58 50 V60 Q58 66 62 64 M64 50 V58 Q64 68 70 62" fill="none" stroke-width="1.2" opacity="0.85"/>`,
  coil: `<path d="M54 52 Q68 52 66 57 Q54 57 56 62 Q70 62 68 66" fill="none" stroke-width="1.3"/>`,
  shears: `<circle cx="55" cy="62" r="3" fill="none" stroke-width="1.2"/><circle cx="65" cy="62" r="3" fill="none" stroke-width="1.2"/><path d="M57 60 L68 50 M63 60 L52 50" stroke-width="1.3"/>`,
  cords: `<path d="M50 51 Q54 55 50 59 Q54 63 50 67 M58 51 Q62 55 58 59 Q62 63 58 67 M66 51 Q70 55 66 59 Q70 63 66 67" fill="none" stroke-width="1.2"/>`,
  cradle: `<path d="M50 60 Q60 68 70 60 M50 60 V56 M70 60 V56" fill="none" stroke-width="1.4"/><circle cx="60" cy="56" r="2.5"/>`,
  sieve: `<circle cx="60" cy="57" r="8" fill="none" stroke-width="1.3"/><path d="M53 54 H67 M53 58 H67 M53 62 H67 M56 51 V63 M60 51 V63 M64 51 V63" stroke-width="0.7" opacity="0.7"/>`,
  brush: `<path d="M58 49 L62 49 L61 60 L59 60 Z"/><path d="M59 60 L57 68 M60 60 V68 M61 60 L63 68" stroke-width="1" fill="none"/>`,
  palette: `<path d="M52 57 Q52 50 60 50 Q70 50 70 58 Q70 63 64 62 Q66 66 60 66 Q52 66 52 57 Z" fill="none" stroke-width="1.2"/><circle cx="57" cy="55" r="1.4"/><circle cx="63" cy="54" r="1.4"/><circle cx="64" cy="59" r="1.4"/>`,
  broker: `<path d="M54 52 H66 M54 57 H66 M54 62 H66" stroke-width="1.3"/><path d="M60 48 L64 52 H56 Z"/>`,
  engine: `<path d="M52 52 H68 M52 62 H68 M56 48 V66 M64 48 V66" stroke-width="1.2" fill="none" opacity="0.8"/>`,
};

// ---- the cast: id -> {color, bust, crown?, em, nael, outsider?, dim?} ------------------
const C = {
  // Founders — gold
  vethra:  { color: GOLD, bust: 'adult', crown: 'spindle', em: 'threads', nael: [6,3,6] },
  orel:    { color: GOLD, bust: 'adult', em: 'loomfoot', nael: [2,2,2], marriedIn: true },
  eddan:   { color: GOLD, bust: 'child', em: 'cutthread', nael: [1,1], dim: true },
  // Seated Line — purple
  marenn:  { color: PURPLE, bust: 'adult', crown: 'band', em: 'shout', nael: [5,2,4], echo: true },
  hadon:   { color: PURPLE, bust: 'adult', em: 'blank', nael: [3,3,3], marriedIn: true },
  edra:    { color: PURPLE, bust: 'adult', crown: 'band', em: 'gear', nael: [3,4,3] },
  pol:     { color: PURPLE, bust: 'adult', em: 'hands', nael: [2,3,2], marriedIn: true },
  solenne: { color: PURPLE, bust: 'adult', crown: 'scales', em: 'threads', nael: [2,4,2], strings: true },
  renor:   { color: PURPLE, bust: 'adult', em: 'crack', nael: [4,4,1] },
  wenla:   { color: PURPLE, bust: 'adult', em: 'compass', nael: [1,3,4], marriedIn: true },
  avesa:   { color: PURPLE, bust: 'adult', crown: 'band', em: 'shout', nael: [2,4,1] },
  // Rightful Line — green
  suvi:    { color: GREEN, bust: 'adult', em: 'shuttle', nael: [4,2,5], mirror: true },
  talis:   { color: GREEN, bust: 'hooded', em: 'key', nael: [2,5,1], outsider: true, dim: true },
  nemora:  { color: GREEN, bust: 'adult', em: 'unravel', nael: [6,4,2], unwoven: true },
  dris:    { color: GREEN, bust: 'hooded', em: 'coil', nael: [5,1,3], outsider: true },
  // Court — blue
  caleth:  { color: BLUE, bust: 'adult', em: 'shears', nael: [1,5,2] },
  tovesh:  { color: BLUE, bust: 'adult', em: 'cords', nael: [3,1,4] },
  ilse:    { color: BLUE, bust: 'adult', em: 'cradle', nael: [4,1,3] },
  // Servants — bronze
  dav:     { color: BRONZE, bust: 'hooded', em: 'sieve', nael: [2,1] },
  tomas:   { color: BRONZE, bust: 'hooded', em: 'brush', nael: [1,2] },
  yola:    { color: BRONZE, bust: 'hooded', em: 'palette', nael: [3,2] },
  // Foreign powers — crimson
  factor:  { color: CRIMSON, bust: 'masked', em: 'broker', nael: [7,3,7] },
  outloom: { color: CRIMSON, bust: 'monument', em: 'engine', nael: [5,2,5] },
};

function naelRow(pattern, color) {
  const n = pattern.length, w = 3, gap = 4, total = n * w + (n - 1) * gap;
  let x = 60 - total / 2, out = '';
  for (const k of pattern) {
    const h = 3 + k * 1.6;
    out += `<rect x="${x.toFixed(1)}" y="${(70 - h).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" rx="1" fill="${color}" opacity="0.85"/>`;
    x += w + gap;
  }
  return out;
}

function svg(id, c) {
  const col = c.color;
  const bust = BUST[c.bust];
  const crown = c.crown ? CROWN[c.crown] : '';
  const em = EM[c.em] || '';
  const dashed = c.outsider ? `<rect x="3" y="3" width="114" height="66" rx="8" fill="none" stroke="${ORANGE}" stroke-width="1.4" stroke-dasharray="6 5" opacity="0.85"/>` : '';
  const echo = c.echo ? `<g opacity="0.28" transform="translate(6,-2)"><circle cx="60" cy="26" r="13" fill="none" stroke="${col}" stroke-width="1.2"/></g>` : '';
  const mirror = c.mirror ? `<g opacity="0.22" transform="translate(120,0) scale(-1,1)"><circle cx="60" cy="26" r="13" fill="none" stroke="${col}" stroke-width="1.2"/></g>` : '';
  const strings = c.strings ? `<path d="M52 5 V16 M60 3 V14 M68 5 V16" stroke="${col}" stroke-width="0.7" opacity="0.5"/><path d="M64 4 V16" stroke="${CRIMSON}" stroke-width="0.9" opacity="0.8"/>` : '';
  const unwoven = c.unwoven ? `<path d="M88 40 q10 6 4 16 M90 34 q12 2 8 14" stroke="${col}" stroke-width="1" fill="none" opacity="0.6"/><path d="M60 40 L58 47" stroke="${ORANGE}" stroke-width="1.3"/>` : '';
  const globalOpacity = c.dim ? 0.6 : 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 72" role="img" aria-label="${id}">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${col}" stop-opacity="0.16"/><stop offset="1" stop-color="${col}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="116" height="68" rx="8" fill="url(#field)"/>
  ${dashed}
  <g opacity="${globalOpacity}">
    ${echo}${mirror}
    <g fill="none" stroke="${col}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)">
      ${bust}
    </g>
    <g fill="none" stroke="${col}" stroke-linecap="round">${crown}</g>
    <g fill="${col}" stroke="${col}">${em}</g>
    ${strings}${unwoven}
  </g>
  <g stroke="none">${naelRow(c.nael, col)}</g>
  <g opacity="0.10" stroke="#000"><path d="M0 8 H120 M0 16 H120 M0 24 H120 M0 32 H120 M0 40 H120 M0 48 H120 M0 56 H120 M0 64 H120"/></g>
</svg>`;
}

let count = 0;
for (const [id, c] of Object.entries(C)) {
  writeFileSync(join(OUT, id + '.svg'), svg(id, c).replace(/\n\s+/g, '\n'));
  count++;
}
// a neutral fallback (used if an id has no portrait yet)
writeFileSync(join(OUT, 'placeholder.svg'), svg('placeholder', { color: '#b39bd4', bust: 'adult', em: 'blank', nael: [2,2,2] }));
console.log(`wrote ${count} portraits + placeholder to assets/portraits/`);
