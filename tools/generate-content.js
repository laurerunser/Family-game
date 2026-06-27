// generate-content.js — produce the five shipped data/*.json from the source JSON +
// the Signal-Weave reskin maps. Run: `node tools/generate-content.js` (or `npm run generate`).
//
// What it does:
//   - people.json   : reskin title_english (epithet); keep ids, given_names, edges, notes.
//   - lexicon.json  : reskin threnne-form (where changed) + english gloss; keep structure.
//   - sigils.json   : passthrough (numeric patterns are puzzle data).
//   - documents.json: reskin title + body; RE-ENCODE each cord from its `plain` field with
//                     the resolved key (asserts/ warns if the segments drift); build a
//                     deterministic steganography grid for every reverse payload.
//   - solution.json : rebuild tree {given_name,title} from people; keep graph/keys/answers.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode, assembleKey, letterIndex } from '../js/cipher.js';
import { PEOPLE_TITLES, LEXICON, renameWord } from '../content/rename.js';
import { TITLES, BODIES, ENDINGS } from '../content/prose.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'content');
const OUT = join(ROOT, 'data');
mkdirSync(OUT, { recursive: true });

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJSON = (name, obj) => {
  writeFileSync(join(OUT, name), JSON.stringify(obj, null, 2) + '\n');
  console.log(`  wrote data/${name}`);
};

const src = {
  people: readJSON(join(SRC, 'src-people.json')),
  lexicon: readJSON(join(SRC, 'src-lexicon.json')),
  documents: readJSON(join(SRC, 'src-documents.json')),
  sigils: readJSON(join(SRC, 'src-sigils.json')),
  solution: readJSON(join(SRC, 'src-solution.json')),
};

const warnings = [];
const warn = (m) => { warnings.push(m); console.warn(`  ! ${m}`); };

// --- keys (resolved exactly as the engine will resolve them from Stage-2 progress) -------
const KEYS = src.solution.cipher_keys;
const TRUENAME = KEYS.stage2_truename;      // NEMORA
const VAUNAME = KEYS.secret_vau_name;       // TALIS
const ASSEMBLED = assembleKey(TRUENAME, VAUNAME);
if (ASSEMBLED !== KEYS.assembled) warn(`assembled key drift: ${ASSEMBLED} != ${KEYS.assembled}`);

function resolveKey(symbol) {
  if (symbol === 'stage2_truename') return TRUENAME;
  if (symbol === 'assembled') return ASSEMBLED;
  return symbol; // already a literal (shouldn't happen in our data)
}

// forged cord: each letter recorded as a plain knot-count (A=1..Z=26), no running key.
const forgedEncode = (plain) =>
  String(plain).toUpperCase().replace(/[^A-Z]/g, '').split('').map((c) => letterIndex(c) + 1);

const arrEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

// --- deterministic steganography grid builder -------------------------------------------
// Lay the payload letters into MARKED cells, spread evenly across a grid of generated noise.
// Reading marked_indices in order spells the payload. Noise is not load-bearing.
const NOISE = 'AETLONIRSMVUHCDP';
function buildGrid(docId, payloadText, gridW) {
  const letters = String(payloadText).toUpperCase().replace(/[^A-Z]/g, '').split('');
  const L = letters.length;
  const w = gridW || 14;
  const N = Math.max(L * 3, Math.ceil((L * 3) / w) * w); // ~1/3 of cells marked
  // evenly spaced, strictly-increasing marked positions
  const marked = [];
  for (let i = 0; i < L; i++) {
    let pos = Math.floor((i + 0.5) * (N / L));
    if (pos <= (marked[i - 1] ?? -1)) pos = marked[i - 1] + 1;
    if (pos >= N) pos = N - (L - i);
    marked.push(pos);
  }
  const cells = new Array(N);
  let seed = 0;
  for (const ch of docId) seed += ch.charCodeAt(0);
  for (let i = 0; i < N; i++) cells[i] = NOISE[(i * 7 + seed) % NOISE.length];
  marked.forEach((idx, i) => { cells[idx] = letters[i]; });
  return { text: payloadText, grid_w: w, cells, marked_indices: marked };
}

// --- people.json -------------------------------------------------------------------------
const people = src.people.map((p) => {
  const title = PEOPLE_TITLES[p.id];
  if (!title) warn(`no PEOPLE_TITLES entry for ${p.id}`);
  return { ...p, title_english: title || p.title_english };
});

// --- lexicon.json ------------------------------------------------------------------------
const lexicon = src.lexicon.map((t) => {
  const o = LEXICON[t.term_id];
  if (!o) { warn(`no LEXICON entry for ${t.term_id}`); return { ...t }; }
  return { ...t, threnne: o.threnne ?? t.threnne, english: o.english ?? t.english };
});

// --- documents.json ----------------------------------------------------------------------
const documents = src.documents.map((d) => {
  const doc = JSON.parse(JSON.stringify(d)); // deep clone, preserves every flag
  if (TITLES[d.id]) doc.title = TITLES[d.id]; else warn(`no TITLES for ${d.id}`);
  if (BODIES[d.id]) doc.body = BODIES[d.id]; else warn(`no BODIES for ${d.id}`);

  // finale: attach the authored epilogue prose to each ending option
  if (doc.is_finale && Array.isArray(doc.endings)) {
    doc.endings = doc.endings.map((e) => ({ ...e, text: ENDINGS[e.id] || e.meaning }));
  }

  // reverse steganography payloads -> deterministic grids
  if (doc.hidden_payload && doc.hidden_payload.text) {
    const grid = buildGrid(d.id, doc.hidden_payload.text, doc.hidden_payload.grid_w);
    doc.hidden_payload = { ...doc.hidden_payload, ...grid };
    delete doc.hidden_payload.render; // we now ship explicit cells everywhere
    delete doc.hidden_payload.note;
  }

  // cords -> re-encode from `plain` with the resolved key (safety against rename drift)
  if (doc.cipher && doc.cipher.type === 'lettered') {
    const c = doc.cipher;
    const key = resolveKey(c.key);
    if (c.forged) {
      const seg = forgedEncode(renameWord(c.plain_if_no_key));
      if (!arrEq(seg, c.segments)) warn(`${d.id} forged segments drift: ${seg} != ${c.segments}`);
      c.segments = seg;
    } else {
      const seg = encode(renameWord(c.plain), key);
      if (!arrEq(seg, c.segments)) warn(`${d.id} segments drift: ${seg} != ${c.segments}`);
      c.segments = seg;
    }
    // c8 carries a second (teaching) encoding
    if (c.segments_teach && c.plain_teach) {
      const tkey = resolveKey(c.key); // assembled
      const segT = encode(renameWord(c.plain_teach), tkey);
      if (!arrEq(segT, c.segments_teach)) warn(`${d.id} segments_teach drift`);
      c.segments_teach = segT;
      if (c.assembled_key) c.assembled_key = ASSEMBLED;
    }
  }
  return doc;
});

// --- solution.json -----------------------------------------------------------------------
const solution = JSON.parse(JSON.stringify(src.solution));
const tree = {};
for (const p of people) {
  if (p.noise) continue; // search-noise commoners are never placed or validated on the board
  tree[p.id] = { given_name: p.given_name, title: p.title_english };
}
solution.tree = tree;

// --- write all five ----------------------------------------------------------------------
console.log('Generating Signal-Weave content...');
writeJSON('people.json', people);
writeJSON('lexicon.json', lexicon);
writeJSON('documents.json', documents);
writeJSON('sigils.json', src.sigils);
writeJSON('solution.json', solution);

console.log(warnings.length
  ? `Done with ${warnings.length} warning(s).`
  : 'Done. No warnings — every cord re-encoded to identical segments.');
