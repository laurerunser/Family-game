// edges.js — Stage-3 conspiracy graph: draw a directed edge between two portraits, label
// it with a role, justify it with a decoded cord, and validate against solution.stage3_graph.
// The forged cord (c7) backs only the "patsy" edge, and only once the player has caught it.
import { DB } from './data.js';
import * as S from './state.js';

const COVERT_ROLES = ['assassin', 'spy', 'paymaster', 'funder', 'installs', 'usurper',
  'prime_mover', 'patsy', 'leverage_over', 'witness_for'];
const change = () => document.dispatchEvent(new CustomEvent('game:change'));

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
  toast(`✦ Edge accepted: ${DB.byPerson[from].given_name} → ${DB.byPerson[to].given_name} (${role.replace('_', ' ')}).`);
  change();
}

// how many of the solution's covert edges has the player correctly drawn?
export function graphProgress() {
  const need = DB.solution.stage3_graph;
  const have = S.get().edges;
  const done = need.filter((n) => have.some((h) => h.from === n.from && h.to === n.to && h.role === n.role));
  return { done: done.length, total: need.length };
}
