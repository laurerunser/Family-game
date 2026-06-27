// relationships.js — Phase 2 mechanic: the reverse reveals hidden FAMILY ties, and the
// player draws them on the tree. Ties are proposed as candidates, then locked in batches —
// you need four correct ties (or the final remainder) with NO false ones, or nothing locks.
// The two hidden figures, Talis and Dris, carry no name dropdown: they reveal and snap to
// colour together once the ties that pin them are locked.
import { DB } from '../core/data.js';
import * as S from '../core/state.js';

// the hidden ties the reverse reveals (the answer key for Phase 2)
export const FAMILY_TIES = [
  { from: 'suvi', to: 'talis', role: 'spouse' },          // the venn-vau
  { from: 'suvi', to: 'nemora', role: 'true_parent_of' },  // the true mother
  { from: 'talis', to: 'nemora', role: 'true_parent_of' }, // the true father
  { from: 'nemora', to: 'ilse', role: 'friend' },          // sevi
  { from: 'nemora', to: 'dris', role: 'lover' },           // velsa
];
const FAMILY_ROLES = [
  ['spouse', 'spouse (secret)'], ['true_parent_of', 'true parent of'], ['child_of', 'child of'],
  ['sibling_of', 'sibling of'], ['friend', 'sworn friend of'], ['lover', 'secret lover of'],
];
const NEW_CHARS = ['talis', 'dris'];

const change = () => document.dispatchEvent(new CustomEvent('game:change'));
const same = (a, b) => a.from === b.from && a.to === b.to && a.role === b.role;
const isTrueTie = (t) => FAMILY_TIES.some((x) => same(x, t));
const remainingTargets = () => FAMILY_TIES.filter((t) => !S.hasRelation(t.from, t.to, t.role));

export function isRelMode() { return S.get().stage === 2; }
export function relationProgress() { return { done: S.get().relations.length, total: FAMILY_TIES.length }; }

// reveal status used by the board: warn/feedback in stages.js
export function relLockInfo() {
  const draft = S.get().relDraft;
  const wrong = draft.filter((d) => !isTrueTie(d));
  const required = Math.min(4, remainingTargets().length);
  return { draft, wrong, required, canLock: draft.length >= required && wrong.length === 0 && draft.length > 0 };
}

const talisPinned = () => S.hasRelation('suvi', 'talis', 'spouse') && S.hasRelation('talis', 'nemora', 'true_parent_of');
const drisPinned = () => S.hasRelation('nemora', 'dris', 'lover');

// ---- drawing: click a source then a target -> a family-role popover ---------------------
let source = null;
export function startRelDraw(id, el) {
  if (!source) {
    source = id;
    document.querySelectorAll('.node').forEach((n) => n.classList.remove('edge-source'));
    el.classList.add('edge-source');
    return;
  }
  if (source === id) { source = null; el.classList.remove('edge-source'); return; }
  openRolePopover(source, id, el);
}

function openRolePopover(from, to, anchorEl) {
  document.getElementById('rel-pop')?.remove();
  const pop = document.createElement('div');
  pop.className = 'role-pop'; pop.id = 'rel-pop';
  const nm = (id) => NEW_CHARS.includes(id) && !S.flag('reveal:' + id)
    ? (id === 'talis' ? 'the stranger (?)' : 'the farcomer (?)') : DB.byPerson[id].given_name;
  pop.innerHTML = `<h4>${nm(from)} → ${nm(to)}</h4>
    <select id="rl-role">${FAMILY_ROLES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
    <button class="accent-btn" id="rl-add">PROPOSE TIE</button>
    <button class="ghost-btn" id="rl-cancel">cancel</button>`;
  document.body.appendChild(pop);
  const r = anchorEl.getBoundingClientRect();
  pop.style.left = Math.min(window.innerWidth - 260, r.right + 10) + 'px';
  pop.style.top = Math.max(70, r.top) + 'px';
  pop.querySelector('#rl-cancel').onclick = () => { source = null; pop.remove(); change(); };
  pop.querySelector('#rl-add').onclick = () => {
    S.addRelDraft({ from, to, role: pop.querySelector('#rl-role').value });
    source = null; pop.remove(); change();
  };
}

// remove a proposed (not yet locked) tie
export function dropDraft(tie) { S.removeRelDraft(tie); change(); }

// ---- locking: 4 correct (or the remainder), no false ties -------------------------------
export function attemptLockRelations() {
  const toast = window.__game.toast;
  const { draft, wrong, required } = relLockInfo();
  if (!draft.length) { toast('Draw the relationships the reverse reveals, then lock them.'); return; }
  if (wrong.length) { toast(`${draft.length - wrong.length} of ${draft.length} ties hold — none lock. Remove the false ones and try again.`); return; }
  if (draft.length < required) { toast(`Relationships lock four at a time — propose ${required - draft.length} more true tie${required - draft.length > 1 ? 's' : ''}.`); return; }

  S.lockRelations(draft.slice());
  // Talis & Dris step into the light together, the moment both are pinned
  let revealed = '';
  if (talisPinned() && drisPinned() && !S.flag('reveal:talis')) {
    S.setFlag('reveal:talis'); S.setFlag('reveal:dris');
    revealed = ' — and Talis & Dris step into the light together.';
  }
  toast(`⟡ ${draft.length} relationship${draft.length > 1 ? 's' : ''} lock into the Weave${revealed}`, 4200);
  change();
}
