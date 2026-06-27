// edges.js — Stage-3 conspiracy graph: draw a directed edge between two portraits, label
// it with a role, justify it with a decoded cord, and validate against solution.stage3_graph.
// The forged cord (c7) backs only the "patsy" edge, and only once the player has caught it.
import { DB } from './data.js';
import * as S from './state.js';

const COVERT_ROLES = ['assassin', 'spy', 'paymaster', 'funder', 'installs', 'usurper',
  'prime_mover', 'patsy', 'leverage_over', 'witness_for'];
const change = () => document.dispatchEvent(new CustomEvent('game:change'));

// Evidence CLUSTERS — the conspiracy locks in coherent groups, not edge-by-edge. The whole
// payment chain snaps shut at once; the spy and the knot that holds her lock together; the
// Factor and the prime mover behind him resolve as one. A cluster locks only when ALL of its
// edges have been correctly drawn — a far better beat than five unrelated edges.
export const CLUSTERS = [
  { id: 'money', name: 'the payment chain', edges: [
    { from: 'factor', to: 'tovesh', role: 'funder' },
    { from: 'tovesh', to: 'caleth', role: 'paymaster' },
    { from: 'caleth', to: 'nemora', role: 'assassin' },
  ] },
  { id: 'puppet', name: 'the puppet usurpation', edges: [
    { from: 'factor', to: 'solenne', role: 'installs' },
    { from: 'solenne', to: 'nemora', role: 'usurper' },
  ] },
  { id: 'held', name: 'the spy and the held knot', edges: [
    { from: 'ilse', to: 'solenne', role: 'spy' },
    { from: 'solenne', to: 'ilse', role: 'leverage_over' },
  ] },
  { id: 'source', name: 'the Factor and the prime mover', edges: [
    { from: 'outloom', to: 'factor', role: 'prime_mover' },
  ] },
  { id: 'cleared', name: 'the patsy cleared and the witness', edges: [
    { from: 'solenne', to: 'avesa', role: 'patsy' },
    { from: 'dris', to: 'nemora', role: 'witness_for' },
  ] },
];
const edgeDrawn = (e) => S.get().edges.some((h) => h.from === e.from && h.to === e.to && h.role === e.role);
const clusterComplete = (c) => c.edges.every(edgeDrawn);

let drawMode = false;
let source = null;
export function isDrawMode() { return drawMode; }
export function setDrawMode(v) { drawMode = v; source = null; closePopover(); change(); }

export function tryDrawEdge(id, el) {
  if (!source) {
    source = id;
    document.querySelectorAll('.node').forEach((n) => n.classList.remove('edge-source'));
    el.classList.add('edge-source');
    return;
  }
  if (source === id) { source = null; el.classList.remove('edge-source'); return; }
  openPopover(source, id, el);
}

function resolvedCords() {
  // cords the player can cite: those decoded, plus the forgery once caught.
  const ids = Object.keys(S.get().decoded);
  if (S.flag('forgeryCaught')) ids.push('c7');
  return [...new Set(ids)];
}

function openPopover(from, to, anchorEl) {
  closePopover();
  const pop = document.createElement('div');
  pop.className = 'role-pop';
  pop.id = 'role-pop';
  const fromName = DB.byPerson[from].given_name, toName = DB.byPerson[to].given_name;
  const cords = resolvedCords();
  pop.innerHTML = `<h4>${fromName} → ${toName}</h4>
    <select id="rp-role">${COVERT_ROLES.map((r) => `<option value="${r}">${r.replace('_', ' ')}</option>`).join('')}</select>
    <select id="rp-cord">
      <option value="">— justify with a resolved cord —</option>
      ${cords.map((c) => `<option value="${c}">${DB.byDoc[c]?.title || c}</option>`).join('')}
    </select>
    <button class="accent-btn" id="rp-submit">SUBMIT EDGE</button>
    <button class="ghost-btn" id="rp-cancel">cancel</button>`;
  document.body.appendChild(pop);
  const r = anchorEl.getBoundingClientRect();
  pop.style.left = Math.min(window.innerWidth - 260, r.right + 10) + 'px';
  pop.style.top = Math.max(70, r.top) + 'px';

  pop.querySelector('#rp-cancel').addEventListener('click', () => { source = null; closePopover(); change(); });
  pop.querySelector('#rp-submit').addEventListener('click', () => {
    const role = pop.querySelector('#rp-role').value;
    const cord = pop.querySelector('#rp-cord').value;
    submitEdge(from, to, role, cord);
  });
}
function closePopover() { document.getElementById('role-pop')?.remove(); }

function submitEdge(from, to, role, cord) {
  const toast = window.__game.toast;
  const sol = DB.solution.stage3_graph.find((e) => e.from === from && e.to === to && e.role === role);
  if (!sol) {
    toast(`No evidence supports ${DB.byPerson[from].given_name} → ${DB.byPerson[to].given_name} as “${role.replace('_', ' ')}”.`);
    return;
  }
  if (!cord) { toast('That edge needs a cord to justify it. Decode one first.'); return; }
  const cordOk = String(sol.cord).split(',').includes(cord);
  // the forged cord may justify ONLY the patsy edge, and only once caught
  if (cord === 'c7' && (role !== 'patsy' || !S.flag('forgeryCaught'))) {
    toast('The Offered Strand is a false-karn — it cannot justify a true edge.');
    return;
  }
  if (!cordOk) { toast(`${DB.byDoc[cord]?.title || cord} does not speak to that edge.`); return; }
  if (cord !== 'c7' && !S.isDecoded(cord)) { toast(`Decode ${DB.byDoc[cord]?.title || cord} before citing it.`); return; }

  S.addEdge({ from, to, role });
  // reveal off-tree identities as their edges land
  if (to === 'factor' || from === 'factor') S.setFlag('reveal:factor');
  if (to === 'outloom' || from === 'outloom') S.setFlag('reveal:outloom');
  source = null; closePopover();

  // did this edge just complete (lock) an evidence cluster?
  const cluster = CLUSTERS.find((c) => c.edges.some((e) => e.from === from && e.to === to && e.role === role) && clusterComplete(c));
  if (cluster && !S.flag('cluster:' + cluster.id)) {
    S.setFlag('cluster:' + cluster.id);
    toast(`⟡ LOCKED — ${cluster.name} snaps into place (${cluster.edges.length} ${cluster.edges.length > 1 ? 'threads' : 'thread'}).`, 4200);
  } else {
    const rem = CLUSTERS.find((c) => c.edges.some((e) => e.from === from && e.to === to && e.role === role));
    const got = rem ? rem.edges.filter(edgeDrawn).length : 0;
    toast(`Thread traced — ${DB.byPerson[from].given_name} → ${DB.byPerson[to].given_name}. ${rem ? `${got}/${rem.edges.length} of ${rem.name} found.` : ''}`);
  }
  change();
}

// progress, counted by completed CLUSTERS (the unit the conspiracy locks in). Computed from
// the drawn edges (the per-cluster "locked" flag only drives the one-time celebratory beat).
export function clusterProgress() {
  const done = CLUSTERS.filter(clusterComplete).length;
  return { done, total: CLUSTERS.length };
}
// retained for the right-column edge count; clusters are the lock unit
export function graphProgress() {
  const have = S.get().edges;
  const need = DB.solution.stage3_graph;
  const done = need.filter((n) => have.some((h) => h.from === n.from && h.to === n.to && h.role === n.role));
  return { done: done.length, total: need.length };
}
