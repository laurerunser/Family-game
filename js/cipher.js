// cipher.js — the Stage-3 cord cipher, shared by the browser engine and the Node tools.
//
// Spec (Build Spec §4, Content Bible Part 1 §E):
//   ALPHABET: A=0 .. Z=25 (26 letters).
//   LETTERED CORDS: each letter is one knot-segment (count 1..26) shifted by a running key.
//     encode: knot  = ((index(plain) + index(key)) mod 26) + 1
//     decode: index = ((knot - 1) - index(key)) mod 26
//   WORD-GAPS consume NO key letter (represented here as `null` in a segment array).
//   NUMERIC CORDS: keyless base-10 digit clusters (e.g. [3,0,0] -> 300).
//
// Keys are stored SYMBOLICALLY in the content ("stage2_truename", "assembled") and resolved
// from the player's Stage-2 progress at runtime — never hard-coded into the engine.

const A_CODE = 65; // 'A'
const GAP = null;  // a word-break marker inside a segment array

/** letter -> 0..25 (uppercased). Returns -1 for non-letters. */
export function letterIndex(ch) {
  const c = ch.toUpperCase().charCodeAt(0) - A_CODE;
  return c >= 0 && c < 26 ? c : -1;
}

/** 0..25 -> 'A'..'Z' */
export function indexLetter(i) {
  return String.fromCharCode(A_CODE + (((i % 26) + 26) % 26));
}

/** Strip to A-Z (used to normalise keys). Keeps spaces out — keys are contiguous. */
export function normaliseKey(key) {
  return String(key || '').toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Assemble the deep key by interleaving two names letter-by-letter, starting with the
 * first, then appending the remainder of the longer one.
 *   assembleKey("NEMORA","TALIS") -> "NTEAMLOIRSA"
 */
export function assembleKey(a, b) {
  a = normaliseKey(a);
  b = normaliseKey(b);
  let out = '';
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (i < a.length) out += a[i];
    if (i < b.length) out += b[i];
  }
  return out;
}

/**
 * Encode a plaintext string into knot-segments. Spaces become GAP markers (null) and do
 * NOT advance the running key.
 * @returns {(number|null)[]}
 */
export function encode(plain, key) {
  key = normaliseKey(key);
  if (!key.length) throw new Error('encode: empty key');
  const segments = [];
  let k = 0;
  for (const ch of String(plain)) {
    if (ch === ' ') { segments.push(GAP); continue; }
    const pi = letterIndex(ch);
    if (pi < 0) continue; // ignore punctuation
    const ki = letterIndex(key[k % key.length]);
    segments.push(((pi + ki) % 26) + 1);
    k++;
  }
  return segments;
}

/**
 * Decode knot-segments back into a string. GAP markers (null) emit a space and do NOT
 * advance the running key. Out-of-range knots decode to '?'.
 * @returns {string}
 */
export function decode(segments, key) {
  key = normaliseKey(key);
  if (!key.length) throw new Error('decode: empty key');
  let out = '';
  let k = 0;
  for (const seg of segments) {
    if (seg === GAP) { out += ' '; continue; }
    const knot = Number(seg);
    if (!Number.isInteger(knot) || knot < 1 || knot > 26) { out += '?'; k++; continue; }
    const ki = letterIndex(key[k % key.length]);
    out += indexLetter((knot - 1) - ki);
    k++;
  }
  return out;
}

/**
 * Decode WITHOUT a key (plain knot-counts: knot N -> letter N, A=1..Z=26). This is how the
 * forged cord reads "AVESA" when the player wrongly applies no key — and the lesson that the
 * real cords are keyed. GAP -> space.
 * @returns {string}
 */
export function decodePlainCount(segments) {
  let out = '';
  for (const seg of segments) {
    if (seg === GAP) { out += ' '; continue; }
    const knot = Number(seg);
    if (!Number.isInteger(knot) || knot < 1 || knot > 26) { out += '?'; continue; }
    out += indexLetter(knot - 1);
  }
  return out;
}

/** Numeric cord: flat digit clusters -> integer. [3,0,0] -> 300. */
export function decodeNumeric(clusters) {
  return Number((clusters || []).map((c) => Array.isArray(c) ? c.join('') : String(c)).join(''));
}

export const GAP_MARKER = GAP;
