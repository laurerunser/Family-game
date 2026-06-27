// rename.js — the structural rename maps for the Signal-Weave reskin.
// Keys (person id, term_id) are the stable internal handles and are NEVER changed.
// We only recast display labels: people epithets and lexicon threnne-forms + glosses.
// No cipher-bearing word changes form, so all cord segments are preserved (the generator
// re-encodes from each cord's `plain` field and asserts the segments are unchanged).

// --- People: id -> reskinned English epithet (given names are kept) -----------------
export const PEOPLE_TITLES = {
  vethra:  'the First Warp',
  orel:    'the Loomfoot',
  marenn:  'the Standing Warp',
  suvi:    'the Silent Relay',     // was "the Quiet Shuttle"
  eddan:   'the Short Strand',     // was "the Short Thread"
  talis:   'the Stranger',
  nemora:  'the Unwoven',
  edra:    'the Loomwright',
  solenne: 'the Even Hand',
  renor:   'the Brackish',
  hadon:   'the Unmarked',         // was "the Plainweave"
  pol:     'the Quiet Hand',
  wenla:   'the Farwife',          // was "the Reedwife"
  avesa:   'the Loud Loom',
  caleth:  'the Patient',
  tovesh:  'the Counter',
  ilse:    'the Open Face',
  dris:    'the Farcomer',
  factor:  'the Outside Counter',
  outloom: 'the Loom Beyond',
  dav:     'the Sifter',           // was "the Carder"
  tomas:   'the Scourer',          // was "the Fuller"
  yola:    'the Tinter',           // was "the Dyer"
};

// --- Lexicon: term_id -> { threnne?, english } -------------------------------------
// `threnne` only present where the word-form itself is reskinned; else the form is kept.
// `english` is the recast Signal-Weave gloss.
export const LEXICON = {
  // affixes
  aff_a:    { english: 'female (suffix)' },
  aff_o:    { english: 'male (suffix)' },
  aff_e:    { english: 'neutral / unmarked (suffix)' },
  aff_en:   { english: 'young / infant / lesser (diminutive)' },
  aff_ver:  { english: 'elder / great' },
  aff_shen: { english: 'outside / foreign / false / illegitimate' },
  aff_shorn:{ english: 'severed / bereaved / dead' },
  aff_vera: { english: 'true / by-right (prefix)' },

  // world & office
  threa:     { english: 'a strand; a bloodline (a line of descent in the Weave)' },
  warp:      { english: 'the ruling line (the prime signal of the Weave)' },
  weft:      { english: 'a cadet line (a branch signal)' },
  cloth:     { threnne: 'vael', english: 'a signal-record; the recorded truth' },
  vara:      { english: 'Warden of the Loom (the ruler)' },
  oramei:    { english: 'the realm (the ashen reach of Oramei)' },
  threnne_p: { english: 'the people (of the Weave)' },
  loomhouse: { english: 'the seat of rule (the hall of the Great Loom)' },
  grey:      { threnne: 'the dark', english: "where the dead are; 'gone dark' = died" },
  grey_knot: { threnne: 'dark-karn', english: "the woven mark closing a dead strand's signal" },
  aelry:     { english: 'the slow driftlights crossing the dark each Turning; the year-marker' },
  turning:   { english: '(1) the annual rite where renthe is done; (2) a year [deliberate polysemy]' },
  karn:      { english: 'a cord; an encrypted knotted ledger' },
  karna:     { english: 'the Counter / keeper of the cords (office)' },
  nael:      { english: 'a signal-sigil binding a record or cord to a hand; a seal' },

  // kinship
  nenne:     { english: 'parent (nenna mother, nenno father)' },
  suri:      { english: 'child (suri-a daughter, suri-o son, suri-en infant)' },
  tava:      { english: 'sibling (tava-a sister, tava-o brother)' },
  tava_shen: { english: 'half-sibling' },
  nenne_ver: { english: 'grandparent' },
  suri_suri: { english: 'grandchild' },
  osa:       { english: 'aunt/uncle (osa-a / osa-o)' },
  osi:       { english: 'niece/nephew' },
  tavin:     { english: 'cousin' },
  vau:       { english: 'spouse; the bond (vau-a wife, vau-o husband)' },
  vau_shorn: { english: 'widow(er)' },
  vinn:      { english: 'twin' },

  // rite / status / succession
  renthe:     { english: "the rite of acknowledgement upon the Great Loom (verb 'renthed')" },
  threa_shen: { english: 'unstranded; not in the Weave' },
  warn:       { english: 'the named heir' },
  veresh:     { english: 'trueborn' },
  suri_shen:  { english: 'illegitimate child (barred unless renthed)' },
  weft_suri:  { english: 'a cadet child; a ward' },
  threa_nenne:{ english: 'strand-parent / godparent (threa-nenna / threa-nenno)' },
  vela:       { english: 'pattern-master / tutor' },

  // tier 2 — affective & hidden
  venn:       { english: 'the underside; the reverse; the inverted sub-channel; the hidden truth' },
  velsa:      { english: 'a secret love; a lover' },
  sevi:       { english: 'a sworn friend / companion' },
  rivenn:     { english: 'a rival; one who envies the warp' },
  venn_vau:   { english: 'a bond made off the Weave (a secret marriage)' },
  vera_nenna: { english: 'a true mother (vs vael-nenne, the recorded parent)' },
  cloth_nenne:{ threnne: 'vael-nenne', english: 'the official / recorded parent' },
  weftshorn:  { english: 'cut from the Weave; erased — deliberately denied a rightful place' },

  // tier 3 — covert & criminal
  warp_shen:  { english: 'usurper (false holder of the warp)' },
  vara_set:   { english: 'an installed ruler (a puppet)' },
  vell:       { english: 'the prime mover / mastermind (the Vell)' },
  shen_loom:  { english: 'the Outloom (the foreign power behind the fall)' },
  shen_karn:  { english: 'the Factor (foreign broker / agent)' },
  karn_pass:  { english: "a conduit (a paymaster moving another's money)" },
  karn_held:  { english: 'a held cord (leverage / blackmail)' },
  offer_threa:{ english: 'an offered strand (a patsy / scapegoat)' },
  false_karn: { english: 'a forged cord' },
  shoran:     { english: "an assassin ('the shears'; the hand that severs a signal)" },
  mis_shorn:  { english: 'a death the speaker KNOWS was no accident — a strand cut out of turn; carries the speaker’s certainty and grief' },
  threa_kept: { english: "to have quietly carried another's pattern at real cost to oneself" },
};

// Cord plaintexts: identity map (no cipher word reskinned). Present so the generator can
// route every cord plaintext through one place if a future rename touches a cord word.
export const WORD = {};
export function renameWord(plain) {
  return (WORD[plain] || plain);
}
