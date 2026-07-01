# Theme Bible — the "Signal-Weave" sci-fi reskin

This is the single source of truth for the cosmetic reskin. The **puzzle is unchanged**:
same cast (by `id`), same edges, same cipher segments, same solution, same clue chains.
Only the *surface* changes — glosses, epithets, titles, prose, and framing. The five
shipped `data/*.json` files are **generated** from `content/src-*.json` + the rename maps
in `content/rename.js` + the reskinned prose in `content/prose.js`, then verified by
`tools/verify-solvability.js`.

## The world

A decadent, ancient **star-empire** in long decline. Its dynastic law and lineage are not
written but **woven as light** — vast holographic signal-records on the **Great Loom** in
the **Loomhouse**, the seat of rule on the dying throne-world **Oramei** (an ashen reach on
the edge of the dark). To **weave** a record is to encode it into the Weave; to read it is
to call up its hologram.

Every record (a **vael**) has two faces: the **front** signal everyone can read (the public
truth — and the medium of the lie), and an **inverted sub-channel** woven into the same
light — the **venn**, the reverse, where a silenced hand can hide what the front denies.
Deeper still are the **karn**: encrypted **data-cords**, the Counter's knotted ledgers, that
speak only to a hand that holds the key. Three media — front / reverse / cords — three ways
to hold a truth: as a public lie, as buried resistance, as silent power. The finale turns
on which medium you choose. *The medium is the meaning.*

To die is to **go dark** (`the Dark`, was `the grey`). The **Vára** is the Warden of the
Loom — the ruler. The **warp** is the ruling signal-line; the **weft**, a cadet line. A
**nael** is a signal-sigil that binds a record or cord to a hand. The **aelry** are the slow
driftlights that cross the dark over Oramei each **Turning** (the annual rite-year) — the
empire's calendar; the year they did not come is a fixed date-anchor.

Off the board stand two foreign powers: **the Factor** (`shen-karn`, an outside broker) and
behind it **the Outloom** (`shen-loom`, the Loom Beyond) — a rival signal-empire that
engineered Oramei's fall to absorb it, the prime mover (**the Vell**). The order that hires
the player to "restore the genealogy" is the Outloom's heir — the frame reversal.

## The sealed tongue (Old Imperial)

The conlang word-forms are **kept** as the empire's sealed Old Tongue (the player decodes
them as opaque vocabulary — the core mechanic). Only the *glosses* are recast to the
Signal-Weave meaning, plus a few overtly-textile word-forms reskinned:

- `cloth` → **vael** — a signal-record / the recorded truth.
- `the grey` → **the Dark** — where the dead are; "gone dark" = died.
- `grey-knot` → **dark-karn** — the mark closing a dead strand's signal.
- everything else keeps its form (vara, warp, weft, threa, loom, karn, nael, suri, renthe,
  veresh, venn, sevi, velsa, rivenn, shen-, mis-shorn, threa-kept, …) with recast glosses.

Because no cipher-bearing word changes form, **every cord segment is preserved exactly**
(the generator re-encodes each cord from its `plain` field as a safety check — output must
equal the source segments).

## People — kept given names, reskinned epithets

Given names are kept (they already suit a star-empire and they are the cipher keys). The
weaving epithets are recast (see `content/rename.js` `PEOPLE_TITLES`). Examples:
Suvi "the Quiet Shuttle" → "the Silent Relay"; Nemora "the Unwoven" → "the Unwoven" (kept —
already perfect); the Factor / the Outloom kept as foreign-power titles.

## Cipher keys (unchanged)

Primary = `NEMORA` (restored in Stage 2). Deep = `NEMORA` ⋈ `TALIS` = `NTEAMLOIRSA`.
Resolved from Stage-2 progress at runtime, never hard-coded.
