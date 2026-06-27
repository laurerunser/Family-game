# DEVLOG — *The Reverse of the Cloth* (Signal-Weave)

A running record of what was built and **where each idea came from** — so a blog post can
cleanly separate *our own* design from what we borrowed from
[**The Archives of Tresova**](https://jamwitch.itch.io/trevosa) (the game that inspired this).

**Legend:** 🟣 **Original** (our own idea) · 🟠 **Inspired by Tresova** (mechanic or design
borrowed from that game / its devlog; our implementation, their idea).

---

## At a glance

### 🟠 Borrowed from The Archives of Tresova
- **The whole core loop / genre.** Three-phase narrative deduction; a sealed conlang learned
  by context; search-and-discover with a small **capped** result list; a family tree you
  name by reading; "turn the document over" steganography; encrypted number/letter cords;
  anti-brute-force batch locking; a covert conspiracy graph. The mechanics are Tresova's;
  we re-skinned and re-authored everything on top.
- **Timeline-ordered, capped search results.** Documents are sorted in in-fiction
  chronological order so common words surface early-story documents and deep cuts need
  targeted searches — a deliberate discovery arc. (Tresova fixed this in a jam-version bug;
  ours sorts by each document's `date`.)
- **The "reachable undiscovered documents" hint.** An optional helper that, per document,
  counts how many *not-yet-found* documents you can reach by searching its words — exactly
  the helper Tresova added in their devlog (off by default, to avoid clutter).

### 🟣 Our own (original)
- **The entire story & setting.** Rose Bertrand's plot, cast, and every document; the sci-fi
  **"Signal-Weave"** re-skin of a decaying star-empire (names, the Old Tongue's glosses, the
  framing of records-as-light, the finale's three media). The puzzle *logic* is preserved;
  the *world and words* are ours.
- **The retro-futuristic / holographic CRT presentation** and the fixed 3-column layout
  (records + lexicon · pan/zoom tree · status/notes), all art (placeholder, traced in SVG).
- **Credits footer + the About page.**
- **The active-play timer** (freezes at victory).
- **Two note pads** — a free NOTES pad and a TRANSLATIONS pad fed by the reader's term
  hover-menu ("record translation" drops the word in and moves the cursor there).
- **"Show my translations" overlay** + the **shine** on words you haven't translated yet.
- **The win screen**: a no-spoiler result card (finish time + whether hints were used) and
  **social sharing** (Web Share API with the image; Twitter / WhatsApp / Facebook; download
  for Instagram) + OG link-preview card.
- **Difficulty escalation per phase**: Phase 2's "identify the new relationships, lock at
  four" rule and the two hidden characters that lock as a pair; the **"warn me when I've
  named too many"** toggle; and Phase 3's **evidence-cluster locking** (the whole payment
  chain / the spy-and-leverage pair / the Factor-and-prime-mover snap shut as units).
- **Black-and-white → colour reveal**: characters are greyscale until locked, then snap to
  full colour (a CSS filter; the same art serves both states).
- Housekeeping: `SOLUTION.md`, `TRANSLATION.md`, this `DEVLOG.md`, and the build/verify/docs
  tooling.

---

## Chronological log

### Session 1 — the build
- 🟠 **Core engine + content pipeline.** Built the three-phase engine (search/discover, tree
  with batch-lock, turn-the-cloth steganography, cord cipher, conspiracy graph, finale) to
  the Tresova-style spec. The five `data/*.json` are generated from the original puzzle plus
  our re-skin maps, and verified solvable (cipher round-trips, the forgery, both keys,
  reachability) — 100+ automated checks.
- 🟣 **Signal-Weave re-skin.** Kept the puzzle fixed; re-themed all surface vocabulary,
  glosses, epithets, titles, prose, and metaphor into the star-empire setting.

### Session 1 — credits & about
- 🟣 **Footer credits** (laure runser / rose bertrand / Tresova links, "no ai use anywhere").
- 🟣 **About page** crediting the coding & SVG art (Laure) and the story & document logic
  (Rose), thanking the little-sister playtesters and the makers of Tresova.

### Session 1 — right-column tools & sharing
- 🟣 **Timer**, **extra-hints toggle**, **two note pads** (free + translation), the reader's
  **term hover-menu** (search / record translation), credits moved into the right column.
- 🟠 **Reachability hint** implemented behind the toggle (Tresova's devlog idea).
- 🟣 **Victory card + social sharing** + OG meta/card.

### Session 1 — difficulty & polish
- 🟠 Confirmed **timeline-sorted capped search** was already in place (Tresova design).
- 🟣 **Show-translations overlay** + **shine on untranslated words**.
- 🟣 **Phase-2 lock-at-four** for the new material + **"warn when named too many"** toggle +
  a richer Phase 1→2 transition (your Phase-1 time, shareable, then the rules for Phase 2).
- 🟣 **Phase-3 evidence-cluster locking** (lock coherent groups, not arbitrary single edges).
- 🟣 **B&W → colour reveal** on lock.
- 🟣 `SOLUTION.md`, `TRANSLATION.md`, `DEVLOG.md`; **code refactor** into well-named modules.

> Note: Phase 2 was redesigned mid-session so the "lock at four" rule governs the **new
> relationships** the reverse reveals (not a pile of name dropdowns), and the two hidden
> characters (Talis, Dris) lock as a pair — see the commit history for the exact shape.
