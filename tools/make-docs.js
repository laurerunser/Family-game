// make-docs.js — generate SOLUTION.md (who is who + the conspiracy) and TRANSLATION.md
// (every Old-Tongue word and its English gloss) from the shipped data. Keeps both in sync
// with the content. Run: `node tools/make-docs.js` (or `npm run docs`).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (n) => JSON.parse(readFileSync(join(ROOT, 'data', n), 'utf8'));
const people = read('people.json');
const lexicon = read('lexicon.json');
const solution = read('solution.json');
const byPerson = Object.fromEntries(people.map((p) => [p.id, p]));
const name = (id) => byPerson[id]?.given_name || id;

// ---- SOLUTION.md ------------------------------------------------------------------------
const ROLE_EN = {
  prime_mover: 'prime mover', funder: 'funder', paymaster: 'paymaster (a conduit)',
  assassin: 'assassin', installs: 'installs (the puppet)', usurper: 'usurper',
  spy: 'spy (coerced)', leverage_over: 'holds leverage over', patsy: 'frames as patsy',
  witness_for: 'witness for',
};
const finaleRole = {};
for (const [role, id] of Object.entries(solution.finale_answers)) finaleRole[id] = role;

const GEN_LABEL = { 1: 'Generation 1 — the founders', 2: 'Generation 2 — Vethra’s children',
  3: 'Generation 3 — the grandchildren & the court', 4: 'Generation 4' };

let sol = `# SOLUTION — *The Reverse of the Cloth* (Signal-Weave)

> ⚠️ **Full spoilers.** This is the answer key: who everyone really is, the rightful line,
> and the whole conspiracy. Auto-generated from \`data/*.json\` by \`tools/make-docs.js\`.

## The rightful line

**${solution.rightful_line.map(name).join(' → ')}.**

${solution.rightful_line_note}

## Who is who

The front (the public record) lies; the reverse (Suvi's hidden weave) tells the truth; the
cords (Phase 3) name the crime. Each figure below: **given name — "title"**, then the front
role → the reverse truth → the cord role.
`;

const groups = { 1: [], 2: [], 3: [], 4: [], court: [], outside: [] };
for (const p of people) {
  if (p.noise) continue;
  if (p.generation == null) groups.outside.push(p);
  else groups[p.generation].push(p);
}
for (const g of ['1', '2', '3', '4']) {
  if (!groups[g].length) continue;
  sol += `\n### ${GEN_LABEL[g]}\n\n`;
  for (const p of groups[g]) {
    const tag = finaleRole[p.id] ? `  **[${finaleRole[p.id].replace('_', ' ').toUpperCase()}]**` : '';
    sol += `- **${p.given_name} — "${p.title_english}"**${tag}` + (p.note ? `\n  ${p.note}` : '') + '\n';
  }
}
sol += `\n### The outside tier (off-tree)\n\n`;
for (const p of groups.outside) {
  const tag = finaleRole[p.id] ? `  **[${finaleRole[p.id].replace('_', ' ').toUpperCase()}]**` : '';
  sol += `- **${p.given_name} — "${p.title_english}"**${tag}` + (p.note ? `\n  ${p.note}` : '') + '\n';
}

sol += `\n## The conspiracy (Phase 3)\n\nDirected edges, each justified by a cord:\n\n`;
for (const e of solution.stage3_graph) {
  sol += `- **${name(e.from)} → ${name(e.to)}** — ${ROLE_EN[e.role] || e.role}  _(cord ${e.cord})_\n`;
}
sol += `\n**The forgery:** cord \`${solution.forged_cord_id}\` frames **${name('avesa')}** (the patsy). ` +
  `It is recorded in plain knot-counts, so under the true key it decodes to gibberish while every real cord ` +
  `decodes to an Old-Tongue word. Spotting that clears Avesa.\n`;

sol += `\n## Cipher keys\n\n` +
  `- **Primary (palace cords):** \`${solution.cipher_keys.stage2_truename}\` — Nemora's restored name.\n` +
  `- **Second (Factor cords):** \`${solution.cipher_keys.stage2_truename}\` ⋈ \`${solution.cipher_keys.secret_vau_name}\` = ` +
  `\`${solution.cipher_keys.assembled}\` (${solution.cipher_keys.assembled_rule})\n` +
  `\nDecode: \`index = ((knot − 1) − keyindex) mod 26\`, A=0…Z=25; word-gaps consume no key letter. ` +
  `Numeric cords are keyless base-10 clusters.\n`;

writeFileSync(join(ROOT, 'SOLUTION.md'), sol);
console.log('wrote SOLUTION.md');

// ---- TRANSLATION.md ---------------------------------------------------------------------
const TIER_LABEL = {
  1: 'Tier 1 — world, office, kinship, rite & status (Phase 1)',
  2: 'Tier 2 — affective & hidden (Phase 2, off the reverse)',
  3: 'Tier 3 — covert & criminal (Phase 3, off the cords)',
};
let tr = `# TRANSLATION — the sealed Old Tongue

Every word of the empire's Old Tongue and its English gloss. The game never auto-translates
prose; players learn these by context. Auto-generated from \`data/lexicon.json\` by
\`tools/make-docs.js\`.

## Affixes (combine freely)

| Affix | Meaning |
| --- | --- |
`;
for (const t of lexicon.filter((x) => x.affix)) tr += `| \`${t.threnne}\` | ${t.english} |\n`;

for (const tier of [1, 2, 3]) {
  const rows = lexicon.filter((x) => !x.affix && x.tier === tier);
  if (!rows.length) continue;
  tr += `\n## ${TIER_LABEL[tier]}\n\n| Word | Meaning |\n| --- | --- |\n`;
  rows.sort((a, b) => a.threnne.localeCompare(b.threnne));
  for (const t of rows) tr += `| **${t.threnne}** | ${t.english} |\n`;
}
writeFileSync(join(ROOT, 'TRANSLATION.md'), tr);
console.log('wrote TRANSLATION.md');
