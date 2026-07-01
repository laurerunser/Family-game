// tree.js — the middle board: holographic portrait nodes laid out by generation, with
// NAME/TITLE slots (Stages 1-2), batch-locked validation, kin edges, pan/zoom, and the
// Stage-3 edge-draw hook. Off-tree figures (Factor, Outloom) surface in Stage 3.
import { DB } from '../core/data.js';
import * as S from '../core/state.js';
import { tryDrawEdge, isDrawMode } from './edges.js';
import { startRelDraw, isRelMode, dropDraft } from './relationships.js';

const NEW_CHARS = ['talis', 'dris']; // revealed only on the reverse; no name dropdowns

export const BOARD_W = 2400, BOARD_H = 1500;
const W = BOARD_W, H = BOARD_H;
const HALF_W = 75, HALF_H = 96; // node half-width / -height, for connector anchors

// Hand-authored genealogical layout: spouses sit adjacent (a small gap between them so the
// child drop can fall through it), children centred below their couple, the two dynastic
// branches to left (Marenn's line) and centre-right (Suvi's line), the household court off to
// the right, and the off-tree foreign powers below (Stage 3).
const POS = {
  // Gen 1 — the Founders
  vethra: { x: 980, y: 170 }, orel: { x: 1180, y: 170 },
  // Gen 2 — Vethra's children (+ their spouses)
  marenn: { x: 560, y: 560 }, hadon: { x: 760, y: 560 },
  eddan: { x: 1060, y: 560 },
  suvi: { x: 1380, y: 560 }, talis: { x: 1580, y: 560 },
  // Gen 3 — Marenn's branch
  edra: { x: 300, y: 980 }, pol: { x: 490, y: 980 },
  solenne: { x: 700, y: 980 },
  renor: { x: 900, y: 980 }, wenla: { x: 1090, y: 980 },
  // Gen 3 — Suvi's branch
  nemora: { x: 1400, y: 980 }, dris: { x: 1590, y: 980 },
  // Gen 3 — the Court (household, not blood)
  caleth: { x: 1850, y: 980 }, tovesh: { x: 2040, y: 980 }, ilse: { x: 2230, y: 980 },
  // Gen 4
  avesa: { x: 995, y: 1360 },
  // off-tree foreign powers (Stage 3)
  factor: { x: 1750, y: 1360 }, outloom: { x: 2050, y: 1360 },
};
const OFFTREE = ['factor', 'outloom'];
const change = () => document.dispatchEvent(new CustomEvent('game:change'));

const portraitImg = (id) =>
  `<img class="face" src="assets/portraits/${id}.png" alt="" draggable="false"
     onerror="this.onerror=null;this.src='assets/portraits/placeholder.svg'"/>`;

let positions = {};
export function nodePos(id) { return positions[id]; }

// ---- which people are on the board, and option lists -----------------------------------
function placeable() {
  return DB.people.filter((p) => p.generation != null && DB.solution.tree[p.id]);
}
// dropdowns exist only in Phase 1, so only offer the front (Phase-1) figures' names/titles —
// Talis and Dris stay hidden until the reverse reveals them.
function frontPlaceable() { return placeable().filter((p) => p.stage_introduced <= 1); }
function nameOptions() { return [...new Set(frontPlaceable().map((p) => p.given_name))].sort(); }
function titleOptions() { return [...new Set(frontPlaceable().map((p) => DB.solution.tree[p.id].title))].sort(); }

function visibleIds() {
  const st = S.get();
  return Object.keys(POS).filter((id) => {
    const p = DB.byPerson[id];
    if (!p) return false;
    if (OFFTREE.includes(id)) return st.stage >= 3;
    return p.stage_introduced <= st.stage;
  });
}

function layout() {
  positions = {};
  for (const id of visibleIds()) positions[id] = POS[id];
}

// ---- node DOM ---------------------------------------------------------------------------
function buildNode(id) {
  const st = S.get();
  const p = DB.byPerson[id];
  const sol = DB.solution.tree[id];
  const pos = positions[id];
  const el = document.createElement('div');
  el.className = 'node';
  el.dataset.id = id;
  el.style.left = pos.x + 'px';
  el.style.top = pos.y + 'px';

  const offtree = OFFTREE.includes(id);
  const newChar = NEW_CHARS.includes(id);
  const revealedChar = newChar && S.flag('reveal:' + id);
  const locked = S.isLocked(id);
  if (locked) el.classList.add('locked');
  if (offtree) el.classList.add('offtree');
  if (revealedChar) el.classList.add('revealed');
  if (DB.solution.rightful_line?.includes(id) && st.stage >= 2 && (locked || revealedChar)) el.classList.add('rightful');

  let inner = `<div class="portrait">${portraitImg(id)}</div>`;

  if (offtree) {
    // off-tree powers: identity is revealed by the cords; show name once discovered
    const known = S.flag('reveal:' + id);
    if (known) el.classList.add('revealed');
    inner += `<div class="slot-static">${known ? p.given_name : '— unknown —'}</div>`;
    inner += `<div class="nid">${known ? p.title_english : 'outside the house'}</div>`;
  } else if (newChar && !revealedChar) {
    // a figure the front never named — no dropdown; pin it by drawing its true ties
    inner += `<div class="slot-static" style="color:var(--ink-dim)">${id === 'talis' ? 'the stranger' : 'the farcomer'} (?)</div>`;
    inner += `<div class="nid">drawn in from the reverse</div>`;
  } else if (locked || revealedChar) {
    inner += `<div class="slot-static">${sol.given_name}</div>`;
    inner += `<div class="slot-static" style="color:var(--gold)">${sol.title}</div>`;
  } else {
    const slot = st.slots[id] || {};
    const names = nameOptions(), titles = titleOptions();
    const opt = (arr, val) => ['<option value="">— name —</option>']
      .concat(arr.map((o) => `<option ${o === val ? 'selected' : ''}>${o}</option>`)).join('');
    const optT = (arr, val) => ['<option value="">— title —</option>']
      .concat(arr.map((o) => `<option ${o === val ? 'selected' : ''}>${o}</option>`)).join('');
    inner += `<select data-field="name">${opt(names, slot.name)}</select>`;
    inner += `<select data-field="title">${optT(titles, slot.title)}</select>`;
  }
  el.innerHTML = inner;

  el.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', () => { S.setSlot(id, sel.dataset.field, sel.value); change(); });
    sel.addEventListener('pointerdown', (e) => e.stopPropagation()); // don't start a pan
  });

  // node click: Phase 2 draws family relationships; Phase 3 draws conspiracy edges
  el.addEventListener('click', (e) => {
    if (isRelMode()) { e.stopPropagation(); startRelDraw(id, el); return; }
    if (isDrawMode()) { e.stopPropagation(); tryDrawEdge(id, el); }
  });
  return el;
}

// ---- edges (SVG) ------------------------------------------------------------------------
const ROLE_SHORT = {
  spouse: '', parent_of: '', true_parent_of: 'true parent', child_of: '', thread_parent: 'godparent',
  pattern_master: 'tutor', friend: 'sevi', lover: 'velsa', assassin: 'assassin', spy: 'spy',
  paymaster: 'paymaster', funder: 'funder', installs: 'installs', usurper: 'usurper',
  prime_mover: 'prime mover', patsy: 'patsy', leverage_over: 'holds', witness_for: 'witness',
};
function drawEdges() {
  const svg = document.getElementById('edges-svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const st = S.get();
  const P = positions;
  const vis = (id) => !!P[id];
  let out = '';
  const seg = (d, cls) => { out += `<path class="edge-line ${cls}" d="${d}"/>`; };
  const label = (x, y, cls, t) => { if (t) out += `<text class="edge-label ${cls}" x="${x}" y="${y}" text-anchor="middle">${t}</text>`; };

  // ---- gather blood structure: couples + parent→children --------------------------------
  // (data edges that are non-hidden + in-stage) PLUS the ties the player has locked in Phase 2.
  const spouseOf = {}, couples = [];
  const addCouple = (a, b) => { if (!vis(a) || !vis(b) || spouseOf[a]) return; spouseOf[a] = b; spouseOf[b] = a; couples.push([a, b]); };
  for (const p of DB.people) for (const e of p.edges || [])
    if (e.type === 'spouse' && !e.hidden && e.stage <= st.stage && vis(p.id) && vis(e.to)) addCouple(p.id, e.to);
  for (const r of st.relations) if (r.role === 'spouse' && vis(r.from) && vis(r.to)) addCouple(r.from, r.to);

  const unitKey = (pid) => spouseOf[pid] ? [pid, spouseOf[pid]].sort().join('+') : pid;
  const units = {};
  const addChild = (pid, cid) => { if (!vis(pid) || !vis(cid)) return; (units[unitKey(pid)] = units[unitKey(pid)] || new Set()).add(cid); };
  for (const p of DB.people) for (const e of p.edges || [])
    if (e.type === 'parent_of' && !e.hidden && e.stage <= st.stage && vis(p.id) && vis(e.to)) addChild(p.id, e.to);
  for (const r of st.relations) if (r.role === 'true_parent_of' && vis(r.from) && vis(r.to)) addChild(r.from, r.to);

  // ---- spouse bars (solid blood) --------------------------------------------------------
  for (const [a, b] of couples) {
    const l = P[a].x < P[b].x ? P[a] : P[b], rt = P[a].x < P[b].x ? P[b] : P[a];
    seg(`M ${l.x + HALF_W} ${l.y} L ${rt.x - HALF_W} ${rt.y}`, 'kin');
  }

  // ---- parent → children drops (spouse-midpoint → sibling bar → each child) --------------
  for (const key of Object.keys(units)) {
    const parts = key.split('+');
    const couple = parts.length === 2;
    const px = couple ? (P[parts[0]].x + P[parts[1]].x) / 2 : P[parts[0]].x;
    const py = P[parts[0]].y;
    const kids = [...units[key]].map((c) => P[c]);
    const startY = couple ? py : py + HALF_H;         // couples drop through the gap between them
    const childTop = Math.min(...kids.map((c) => c.y)) - HALF_H;
    const barY = (Math.max(startY, py + HALF_H) + childTop) / 2;
    seg(`M ${px} ${startY} L ${px} ${barY}`, 'kin');
    const xs = kids.map((c) => c.x);
    if (kids.length > 1) seg(`M ${Math.min(px, ...xs)} ${barY} L ${Math.max(px, ...xs)} ${barY}`, 'kin');
    for (const c of kids) seg(`M ${c.x} ${barY} L ${c.x} ${c.y - HALF_H}`, 'kin');
  }

  // ---- non-blood relationships: dashed, orthogonal (right-angle) connectors, NO labels ----
  // Each relationship type gets a DISTINCT line style (colour + dash) so the player can tell
  // them apart — but never a label: what each style means is for them to deduce.
  const nonBlood = [];
  for (const p of DB.people) for (const e of p.edges || []) {
    if (e.hidden || e.stage > st.stage || !vis(p.id) || !vis(e.to)) continue;
    if (e.type === 'thread_parent') nonBlood.push([p.id, e.to, 'rel-godparent']);
    else if (e.type === 'pattern_master') nonBlood.push([p.id, e.to, 'rel-tutor']);
  }
  for (const r of st.relations) {
    if (r.role === 'friend') nonBlood.push([r.from, r.to, 'rel-friend']);
    else if (r.role === 'lover') nonBlood.push([r.from, r.to, 'rel-lover']);
  }
  nonBlood.forEach(([a, b, cls], i) => {
    const pa = P[a], pb = P[b];
    if (!pa || !pb) return;
    // drop from A, run along a channel below the row, rise to B — two 90° bends, staggered
    // slightly per-link so parallel ties don't sit on top of each other.
    const channel = Math.max(pa.y, pb.y) + HALF_H + 24 + (i % 4) * 15;
    seg(`M ${pa.x} ${pa.y + HALF_H} L ${pa.x} ${channel} L ${pb.x} ${channel} L ${pb.x} ${pb.y + HALF_H}`, 'rel ' + cls);
  });

  // ---- Phase-2 proposed ties (dashed gold) + Phase-3 conspiracy edges --------------------
  for (const e of st.relDraft) {
    const pa = P[e.from], pb = P[e.to];
    if (pa && pb) seg(`M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`, 'candidate');
  }
  for (const e of st.edges) {
    const pa = P[e.from], pb = P[e.to];
    if (pa && pb) { seg(`M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`, 'covert'); label((pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 6, 'covert', ROLE_SHORT[e.role] ?? e.role); }
  }
  svg.innerHTML = out;
}

export function renderBoard() {
  layout();
  const nodesEl = document.getElementById('nodes');
  nodesEl.innerHTML = '';
  for (const id of visibleIds()) nodesEl.appendChild(buildNode(id));
  if (isDrawMode() || isRelMode()) nodesEl.querySelectorAll('.node').forEach((n) => n.classList.add('draw-mode'));
  // removable chips for proposed Phase-2 ties
  for (const e of S.get().relDraft) {
    const pa = positions[e.from], pb = positions[e.to];
    if (!pa || !pb) continue;
    const chip = document.createElement('div');
    chip.className = 'rel-chip';
    chip.style.left = ((pa.x + pb.x) / 2) + 'px';
    chip.style.top = ((pa.y + pb.y) / 2) + 'px';
    chip.innerHTML = `<span>${(ROLE_SHORT[e.role] || e.role) || 'tie'}</span><button title="remove">✕</button>`;
    chip.querySelector('button').addEventListener('click', (ev) => { ev.stopPropagation(); dropDraft(e); });
    nodesEl.appendChild(chip);
  }
  drawEdges();
}

// ---- pairing status (used by the lock logic and the "too many" warning) -----------------
function placeableUpTo(stage) {
  return DB.people.filter((p) => p.generation != null && DB.solution.tree[p.id] && p.stage_introduced <= stage);
}
export function pairingStatus() {
  const st = S.get();
  const pool = placeableUpTo(st.stage);
  const remaining = pool.filter((p) => !S.isLocked(p.id));
  const paired = remaining.filter((p) => { const s = st.slots[p.id] || {}; return s.name && s.title; });
  // Phase 1 stays gentle — the growing cadence (1, 2, 3, 3…). Phase 2 is strict: name + title
  // exactly four figures, all four correct, before any lock; over-naming a fifth blocks
  // everything; fewer than four only for the final remainder (the two hidden figures).
  const required = st.stage >= 2 ? Math.min(4, remaining.length) : [1, 2, 3][Math.min(st.lockBatches, 2)];
  return { remaining, paired, required, strict: st.stage >= 2 };
}

// ---- batch-locked validation ------------------------------------------------------------
export function attemptLock() {
  const st = S.get();
  const { paired, required, strict } = pairingStatus();

  if (strict && paired.length > required) {
    toast(`Too many named: only ${required} lock at a time, and only if they stand alone. Unpair down to ${required} you’re sure of.`);
    return;
  }
  if (paired.length < required) {
    toast(`Give a name AND a title to ${required} figure${required > 1 ? 's' : ''} before locking — you have ${paired.length}.`);
    return;
  }
  const wrong = paired.filter((p) => {
    const s = st.slots[p.id], sol = DB.solution.tree[p.id];
    return !(s.name === sol.given_name && s.title === sol.title);
  });
  if (wrong.length) {
    toast(`${paired.length - wrong.length} of ${paired.length} correct — none locked. Refine and try again.`);
    return;
  }
  paired.forEach((p) => S.lock(p.id));
  st.lockBatches++; S.save();
  toast(`✦ Locked ${paired.length} ${paired.length > 1 ? 'names' : 'name'} into the Weave.`);
  change();
}

let toastTimer = null;
export function toast(msg, ms = 3200) {
  const t = document.getElementById('board-toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

// pan/zoom lives in ./viewport.js
