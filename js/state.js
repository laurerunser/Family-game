// state.js — player progress, persisted to localStorage. Trust-the-player; no server.
const KEY = 'reverse-of-the-cloth.v1';

const DEFAULT = () => ({
  stage: 1,                 // highest unlocked phase (1..3)
  discovered: [],           // term_ids the player may search
  opened: [],               // doc ids the player has opened/known
  read: [],                 // doc ids the player has read
  slots: {},                // personId -> { name, title }
  locked: {},               // personId -> true (correct & locked)
  lockBatches: 0,           // how many successful batch-locks (drives the cadence)
  edges: [],                // accepted Stage-3 edges: { from, to, role }
  decoded: {},              // cord docId -> decoded plaintext (successful)
  flags: {},                // misc beats: rosettaSeen, stage2, stage3, frameReread, finaleDone
  scratch: '',              // free notes pad
  transPad: '',             // translation pad
  finale: null,             // 'front' | 'reverse' | 'cords'
  playMs: 0,                // accumulated active play time (ms), frozen at win
  wonAt: null,              // timestamp of victory
  hintsOn: false,           // "extra hints" setting (off by default)
  usedHints: false,         // sticky: did the player ever enable hints?
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(DEFAULT(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return DEFAULT();
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }, 120);
}

export function reset() {
  state = DEFAULT();
  try { localStorage.removeItem(KEY); } catch (e) {}
}

export function get() { return state; }

// --- convenience mutators ---------------------------------------------------------------
export function discover(termIds) {
  let added = false;
  for (const t of termIds || []) if (!state.discovered.includes(t)) { state.discovered.push(t); added = true; }
  if (added) save();
  return added;
}
export function isDiscovered(t) { return state.discovered.includes(t); }

export function openDoc(id) {
  if (!state.opened.includes(id)) { state.opened.push(id); save(); }
}
export function isOpen(id) { return state.opened.includes(id); }

export function markRead(id) {
  if (!state.read.includes(id)) { state.read.push(id); save(); }
}
export function isRead(id) { return state.read.includes(id); }

export function setSlot(personId, field, value) {
  state.slots[personId] = state.slots[personId] || { name: null, title: null };
  state.slots[personId][field] = value || null;
  save();
}
export function lock(personId) { state.locked[personId] = true; save(); }
export function isLocked(personId) { return !!state.locked[personId]; }

export function addEdge(edge) {
  if (!state.edges.some((e) => e.from === edge.from && e.to === edge.to && e.role === edge.role)) {
    state.edges.push(edge); save();
  }
}
export function hasEdge(from, to, role) {
  return state.edges.some((e) => e.from === from && e.to === to && (role ? e.role === role : true));
}

export function setDecoded(id, plain) { state.decoded[id] = plain; save(); }
export function isDecoded(id) { return !!state.decoded[id]; }

export function setFlag(k, v = true) { state.flags[k] = v; save(); }
export function flag(k) { return !!state.flags[k]; }

export function setStage(n) { if (n > state.stage) { state.stage = n; save(); } }
export function setScratch(t) { state.scratch = t; save(); }
export function setTransPad(t) { state.transPad = t; save(); }
export function setFinale(choice) {
  state.finale = choice;
  if (!state.wonAt) state.wonAt = Date.now();
  setFlag('finaleDone');
  save();
}

// timer: accumulate active play time (frozen once won)
export function addPlay(ms) { if (!state.wonAt) { state.playMs += ms; save(); } }
export function hasWon() { return !!state.wonAt; }

// settings
export function setHints(on) {
  state.hintsOn = !!on;
  if (on) state.usedHints = true;
  save();
}
