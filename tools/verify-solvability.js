// verify-solvability.js — prove the reskinned game is still solvable and self-consistent.
// Run: `node tools/verify-solvability.js` (or `npm run verify`). Exits non-zero on failure.
//
// Checks (Build Spec §8, Content Bible Part 1 §F):
//   1. cipher math regression (the canonical [16,5,24,19,11,8]/NEMORA -> CALETH test)
//   2. every lettered cord round-trips to its declared plaintext under the resolved key
//   3. the forgery decodes to a real name under NO key but to gibberish under the true key,
//      and that gibberish is not a valid word -> it can justify no edge
//   4. the assembled second key works (c8 teach -> TALIS); numeric skim holds (320 in/300 out)
//   5. every reverse steganography grid reads (marked cells in order == payload)
//   6. discovery reachability: every Stage-1 front doc is findable from the start set
//   7. solution integrity: tree covers the cast; finale answers + graph reference real ids;
//      the forged cord supports no solution edge; frame-reversal sigils match.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, decodePlainCount, decodeNumeric, assembleKey } from '../js/core/cipher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const read = (n) => JSON.parse(readFileSync(join(DATA, n), 'utf8'));

const people = read('people.json');
const lexicon = read('lexicon.json');
const documents = read('documents.json');
const sigils = read('sigils.json');
const solution = read('solution.json');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error(`  FAIL: ${msg}`); } };
const docById = Object.fromEntries(documents.map((d) => [d.id, d]));
const lettersOnly = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, '');

const TRUENAME = solution.cipher_keys.stage2_truename;
const ASSEMBLED = assembleKey(TRUENAME, solution.cipher_keys.secret_vau_name);
const resolveKey = (sym) => sym === 'assembled' ? ASSEMBLED : (sym === 'stage2_truename' ? TRUENAME : sym);

// vocabulary considered "real" when judging the forgery
const validWords = new Set([
  ...lexicon.map((t) => lettersOnly(t.threnne)),
  ...people.map((p) => lettersOnly(p.given_name)),
]);
for (const d of documents) { // declared cord plaintexts are real words too
  if (d.cipher?.plain) validWords.add(lettersOnly(d.cipher.plain));
  if (d.cipher?.plain_teach) validWords.add(lettersOnly(d.cipher.plain_teach));
}

console.log('1. cipher math regression');
ok(decode([16, 5, 24, 19, 11, 8], 'NEMORA') === 'CALETH', 'decode CALETH');
ok(assembleKey('NEMORA', 'TALIS') === 'NTEAMLOIRSA', 'assemble key');

console.log('2. lettered cords round-trip');
for (const d of documents) {
  const c = d.cipher;
  if (!c || c.type !== 'lettered' || c.forged) continue;
  const key = resolveKey(c.key);
  const got = decode(c.segments, key);
  ok(got === lettersOnly(c.plain), `${d.id}: decode -> ${got} (want ${c.plain})`);
  ok(validWords.has(got), `${d.id}: "${got}" is a real word`);
  if (c.segments_teach) {
    const gt = decode(c.segments_teach, resolveKey(c.key));
    ok(gt === lettersOnly(c.plain_teach), `${d.id} teach -> ${gt} (want ${c.plain_teach})`);
  }
}

console.log('3. the forgery (c7)');
{
  const c7 = docById['c7'];
  ok(c7?.cipher?.forged === true, 'c7 marked forged');
  const noKey = decodePlainCount(c7.cipher.segments);
  ok(noKey === lettersOnly(c7.cipher.plain_if_no_key), `c7 no-key -> ${noKey} (the AVESA trap)`);
  ok(validWords.has(noKey), 'c7 no-key trap is a real name (lures the player)');
  const trueKey = decode(c7.cipher.segments, TRUENAME);
  ok(!validWords.has(trueKey), `c7 under true key -> ${trueKey} is gibberish (the tell)`);
  // c7 must support no CULPABILITY edge — only the "patsy" edge that clears Avesa. Detecting
  // the forgery is what justifies (solenne -> avesa : patsy); the no-key "AVESA = payer"
  // reading is the trap and must back no real edge.
  const c7edges = solution.stage3_graph.filter((e) => String(e.cord).split(',').includes('c7'));
  ok(c7edges.length > 0 && c7edges.every((e) => e.role === 'patsy'), 'c7 supports only the patsy edge');
  const CULPRIT = new Set(['assassin', 'paymaster', 'funder', 'usurper', 'installs', 'prime_mover', 'spy']);
  const avesaCulprit = solution.stage3_graph.some((e) => e.from === 'avesa' && CULPRIT.has(e.role));
  ok(!avesaCulprit, 'Avesa is in no culprit role (cleared by the evidence)');
  ok(solution.forged_cord_id === 'c7', 'solution names c7 as the forgery');
}

console.log('4. assembled key + numeric skim');
{
  const c8 = docById['c8'];
  ok(decode(c8.cipher.segments, ASSEMBLED) === lettersOnly(c8.cipher.plain), `c8 source -> ${c8.cipher.plain}`);
  ok(decode(c8.cipher.segments_teach, ASSEMBLED) === lettersOnly(c8.cipher.plain_teach), 'c8 teach -> TALIS');
  const out = decodeNumeric(docById['c1'].cipher.entries.find((e) => e.label === 'the large wage').amount_clusters);
  const inn = decodeNumeric(docById['c4'].cipher.entries[0].amount_clusters);
  ok(out === 300, `c1 wage out = ${out}`);
  ok(inn === 320, `c4 funding in = ${inn}`);
  ok(inn - out === 20, 'the skim (320 in - 300 out = 20) holds');
}

console.log('5. steganography grids read');
for (const d of documents) {
  const hp = d.hidden_payload;
  if (!hp || !hp.cells) continue;
  const readBack = hp.marked_indices.map((i) => hp.cells[i]).join('');
  ok(readBack === lettersOnly(hp.text), `${d.id}: marked cells -> "${readBack}" (want "${lettersOnly(hp.text)}")`);
}

console.log('6. discovery reachability (Stage-1 fronts)');
{
  const stage1 = documents.filter((d) => d.stage === 1 && d.type === 'front');
  const discovered = new Set();
  for (const d of stage1) if (d.is_start) (d.searchable_terms || []).forEach((t) => discovered.add(t));
  const opened = new Set(stage1.filter((d) => d.is_start).map((d) => d.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of stage1) {
      if (opened.has(d.id)) continue;
      if ((d.searchable_terms || []).some((t) => discovered.has(t))) {
        opened.add(d.id); changed = true;
        (d.searchable_terms || []).forEach((t) => discovered.add(t));
      }
    }
  }
  for (const d of stage1) ok(opened.has(d.id), `${d.id} reachable by search from the start set`);
  // the keys are plantable from Stage 2: NEMORA and TALIS appear as reverse payloads
  const payloads = documents.filter((d) => d.hidden_payload).map((d) => lettersOnly(d.hidden_payload.text)).join(' ');
  ok(payloads.includes(TRUENAME), 'NEMORA is planted in a reverse payload');
  ok(payloads.includes(solution.cipher_keys.secret_vau_name), 'TALIS is planted in a reverse payload');
}

console.log('7. solution integrity');
{
  const ids = new Set(people.map((p) => p.id));
  for (const [id, e] of Object.entries(solution.tree)) {
    ok(ids.has(id), `tree id ${id} is a real person`);
    ok(!!e.given_name && !!e.title, `tree ${id} has name + title`);
  }
  for (const [role, id] of Object.entries(solution.finale_answers)) ok(ids.has(id), `finale ${role}=${id} is real`);
  for (const e of solution.stage3_graph) {
    ok(ids.has(e.from) && ids.has(e.to), `graph edge ${e.from}->${e.to} references real ids`);
  }
  // the near-match the forgery leans on: avesa vs solenne differ by exactly one knot
  const pat = (id) => sigils.find((s) => s.owner_person_id === id)?.pattern;
  const diff = pat('avesa').reduce((n, v, i) => n + (v !== pat('solenne')[i] ? 1 : 0), 0);
  ok(diff === 1, `avesa/solenne naels differ by exactly one knot (got ${diff})`);
  // frame reversal: the Outloom heir-nael equals the d1 border sigil (d1_reread match)
  const outloom = pat('outloom');
  const reread = docById['d1_reread'].match_sigil.border_nael_pattern;
  ok(JSON.stringify(outloom) === JSON.stringify(reread), 'Outloom heir-nael == d1 border-nael (frame reversal)');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'}: ${pass} checks passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
