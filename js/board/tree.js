// tree.js — the middle board: holographic portrait nodes laid out by generation, with
// NAME/TITLE slots (Stages 1-2), batch-locked validation, kin edges, pan/zoom, and the
// Stage-3 edge-draw hook. Off-tree figures (Factor, Outloom) surface in Stage 3.
import { DB } from '../core/data.js';
import * as S from '../core/state.js';
import { tryDrawEdge, isDrawMode } from './edges.js';
import { startRelDraw, isRelMode, dropDraft } from './relationships.js';

const NEW_CHARS = ['talis', 'dris']; // revealed only on the reverse; no name dropdowns

export const BOARD_W = 2400, BOARD_H = 1600;
const W = BOARD_W, H = BOARD_H;
const ROW_Y = { 1: 220, 2: 540, 3: 920, 4: 1240, off: 1460 };
const ORDER = {
  1: ['vethra', 'orel'],
  2: ['hadon', 'marenn', 'suvi', 'talis', 'eddan'],
  3: ['edra', 'pol', 'solenne', 'renor', 'wenla', 'nemora', 'dris', 'caleth', 'tovesh', 'ilse'],
  4: ['avesa'],
  off: ['factor', 'outloom'],
};
const change = () => document.dispatchEvent(new CustomEvent('game:change'));

const portraitImg = (id) =>
  `<img class="face" src="assets/portraits/${id}.svg" alt="" draggable="false"
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
  const ids = [];
  for (const id of [...ORDER[1], ...ORDER[2], ...ORDER[3], ...ORDER[4]]) {
    const p = DB.byPerson[id];
    if (p && p.stage_introduced <= st.stage) ids.push(id);
  }
  if (st.stage >= 3) ids.push(...ORDER.off);
  return ids;
}

function layout() {
  positions = {};
  const st = S.get();
  const rows = { 1: [], 2: [], 3: [], 4: [], off: [] };
  for (const id of visibleIds()) {
    const g = ORDER.off.includes(id) ? 'off' : DB.byPerson[id].generation;
    rows[g].push(id);
  }
  for (const [g, list] of Object.entries(rows)) {
    const y = ROW_Y[g];
    const n = list.length;
    list.forEach((id, i) => {
      const x = n === 1 ? W / 2 : 240 + (i * (W - 480)) / (n - 1);
      positions[id] = { x, y };
    });
  }
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

  const offtree = ORDER.off.includes(id);
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
  let out = '';
  const line = (a, b, cls, label) => {
    const pa = positions[a], pb = positions[b];
    if (!pa || !pb) return;
    const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
    out += `<path class="edge-line ${cls}" d="M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}"/>`;
    if (label) out += `<text class="edge-label ${cls}" x="${mx}" y="${my - 6}" text-anchor="middle">${label}</text>`;
  };
  // front kin edges (the visible family structure). Hidden ties are NEVER auto-shown —
  // the player discovers and draws them in Phase 2.
  for (const p of DB.people) {
    if (!positions[p.id]) continue;
    for (const e of p.edges || []) {
      if (!positions[e.to] || e.hidden || e.stage > st.stage) continue;
      line(p.id, e.to, 'kin', ROLE_SHORT[e.type] ?? '');
    }
  }
  // Phase-2 family ties the player has LOCKED
  for (const e of st.relations) line(e.from, e.to, 'hidden-edge', ROLE_SHORT[e.role] ?? e.role);
  // Phase-2 proposed (not yet locked) ties — dashed candidates
  for (const e of st.relDraft) line(e.from, e.to, 'candidate', ROLE_SHORT[e.role] || e.role);
  // covert Stage-3 conspiracy edges drawn by the player
  for (const e of st.edges) line(e.from, e.to, 'covert', ROLE_SHORT[e.role] ?? e.role);
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
