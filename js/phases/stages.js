// stages.js — phase display, progress, objectives, and the gates between the three phases
// (the Turn, the cords hand-over, the frame reversal, and the finale).
import { DB } from '../core/data.js';
import * as S from '../core/state.js';
import { graphProgress, clusterProgress } from '../board/edges.js';
import { showFinale } from './finale.js';
import { turnTransition, cordsTransition, frameReversal } from './transitions.js';
import { relationProgress, relLockInfo } from '../board/relationships.js';

const PHASE_NAME = {
  1: 'THE FRONT · read the Weave',
  2: 'THE REVERSE · invert the signal',
  3: 'THE CORDS · read the knots',
};

function placeableUpTo(stage) {
  return DB.people.filter((p) => p.generation != null && DB.solution.tree[p.id] && p.stage_introduced <= stage);
}
const allLocked = (people) => people.every((p) => S.isLocked(p.id));
const reversesRead = () => DB.documents.filter((d) => d.type === 'reverse' && d.stage === 2 && S.isRead(d.id));
const letteredCords = () => DB.documents.filter((d) => d.cipher?.type === 'lettered' && !d.is_forgery);

// ---- objectives per phase ---------------------------------------------------------------
function objectives() {
  const st = S.get();
  if (st.stage === 1) {
    const s1 = placeableUpTo(1);
    const locked = s1.filter((p) => S.isLocked(p.id)).length;
    return [
      [`Name & title every figure on the front (${locked}/${s1.length})`, locked === s1.length],
      ['Follow the ward’s thread that runs off the edge (read “The Ward’s Vael”)', S.isRead('d4')],
      ['Find the cloth that turns — and invert the signal', S.flag('rosettaSeen')],
    ];
  }
  if (st.stage === 2) {
    const rr = reversesRead().length;
    const rp = relationProgress();
    return [
      ['Restore her name from the reverse (read “The Reverse of the Ward’s Vael”)', S.isRead('r1')],
      ['Prove the venn-vau (Talis) and the true firstborn (read r2, r3)', S.isRead('r2') && S.isRead('r3')],
      [`Read all the reverses (${rr}/7)`, rr >= 7],
      [`Draw the hidden relationships — locking four at a time (${rp.done}/${rp.total})`, rp.done === rp.total],
      ['Reveal Talis & Dris together (lock their ties)', S.flag('reveal:talis')],
      ['Take both keys (read “The Name the Vael Denied”)', S.isRead('r7')],
    ];
  }
  const gp = graphProgress();
  const cp = clusterProgress();
  const cordsDone = letteredCords().filter((d) => S.isDecoded(d.id)).length;
  return [
    [`Decode the Counter’s cords (${cordsDone}/${letteredCords().length})`, cordsDone >= letteredCords().length - 1],
    ['Catch the false-karn (clear Avesa)', S.flag('forgeryCaught')],
    ['Assemble the second key and name the Outloom (decode c8)', S.isDecoded('c8')],
    ['Reread the Charge — see whose seal commissioned you', S.flag('frameReread')],
    [`Lock the conspiracy, cluster by cluster (${cp.done}/${cp.total}) — ${gp.done}/${gp.total} threads`, cp.done === cp.total],
  ];
}

// ---- progress bar (global across the whole game) ----------------------------------------
function progressFraction() {
  const st = S.get();
  const s1 = placeableUpTo(1);
  const cp = clusterProgress();
  const rp = relationProgress();
  const parts = [
    frac(s1.filter((p) => S.isLocked(p.id)).length, s1.length),
    st.flags.rosettaSeen ? 1 : 0,
    frac(reversesRead().length, 7),
    frac(rp.done, rp.total),
    frac(letteredCords().filter((d) => S.isDecoded(d.id)).length, letteredCords().length),
    st.flags.forgeryCaught ? 1 : 0,
    st.flags.frameReread ? 1 : 0,
    frac(cp.done, cp.total),
    st.flags.finaleDone ? 1 : 0,
  ];
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
const frac = (a, b) => (b ? Math.min(1, a / b) : 0);

// ---- the gates --------------------------------------------------------------------------
function checkGates() {
  const st = S.get();

  // Stage 1 -> 2: the front is placed, the hook is read, the cloth has turned.
  if (st.stage === 1 && allLocked(placeableUpTo(1)) && S.isRead('d4') && S.flag('rosettaSeen') && !S.flag('turned')) {
    S.setFlag('turned'); S.setFlag('stage1Ms', st.playMs); S.setStage(2);
    S.discover(['venn', 'venn_vau', 'veresh', 'mis_shorn', 'threa_kept']);
    turnTransition();
    return;
  }
  // Stage 2 -> 3: the reverses are read, every hidden relationship drawn (Talis & Dris
  // revealed), and both keys taken.
  if (st.stage === 2 && reversesRead().length >= 7 && relationProgress().done === relationProgress().total
      && S.flag('reveal:talis') && S.isRead('r7') && !S.flag('cordsHandover')) {
    S.setFlag('cordsHandover'); S.setStage(3);
    S.discover(['karna', 'karn', 'shoran', 'vara_set', 'karn_held', 'karn_pass', 'false_karn', 'offer_threa', 'shen_karn', 'shen_loom', 'vell']);
    cordsTransition();
    return;
  }
  // Stage 3: the Outloom named -> frame reversal.
  if (st.stage === 3 && S.isDecoded('c8') && !S.flag('frameReread')) {
    S.setFlag('reveal:outloom'); S.setFlag('reveal:factor');
    frameReversal();
    return;
  }
  // Stage 3: every evidence cluster locked + forgery caught + frame seen -> finale.
  const cp = clusterProgress();
  if (st.stage === 3 && cp.done === cp.total && S.flag('forgeryCaught') && S.flag('frameReread') && !S.flag('finaleDone')) {
    S.setFlag('show:c_final', true);
    showFinale();
  }
}

// transition beats live in ./transitions.js

// ---- the main refresh (called on every game:change) -------------------------------------
export function refresh() {
  const st = S.get();
  document.getElementById('phase-num').innerHTML = `${st.stage}<span class="of">/3</span>`;
  document.getElementById('phase-name').textContent = PHASE_NAME[st.stage];

  const pct = Math.round(progressFraction() * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';

  const ul = document.getElementById('objectives');
  ul.innerHTML = objectives().map(([t, done]) => `<li class="${done ? 'done' : ''}">${t}</li>`).join('');

  // opt-in warning when a lock won't go through (Phase 2 relationship drafting)
  const warnEl = document.getElementById('pair-warning');
  warnEl.hidden = true;
  if (S.get().warnPairs && st.stage === 2) {
    const ri = relLockInfo();
    if (ri.wrong.length) {
      warnEl.hidden = false;
      warnEl.innerHTML = `⚠ <b>${ri.wrong.length}</b> of your proposed ties don’t hold — nothing will lock until you remove the false one${ri.wrong.length > 1 ? 's' : ''}.`;
    } else if (ri.draft.length && ri.draft.length < ri.required) {
      warnEl.hidden = false;
      warnEl.innerHTML = `⚠ Relationships lock four at a time — you have <b>${ri.draft.length}</b>, need <b>${ri.required}</b> before any lock.`;
    }
  }

  // Stage-3: swap the LOCK button for a DRAW toggle
  const lockBtn = document.getElementById('btn-lock');
  if (st.stage >= 3) {
    lockBtn.textContent = window.__drawToggle ? '✦ DRAWING — click to stop' : '✎ DRAW EDGE';
    lockBtn.classList.toggle('accent-btn', !!window.__drawToggle);
  } else if (st.stage === 2) {
    lockBtn.textContent = 'LOCK RELATIONSHIPS';
    lockBtn.classList.add('accent-btn');
  } else {
    lockBtn.textContent = 'LOCK ANSWERS';
  }
  document.getElementById('board-title').textContent =
    st.stage === 3 ? 'THE CONSPIRACY · draw the cords'
      : (st.stage === 2 ? 'THE REVERSE · draw the hidden ties' : 'THE STANDING WARP');

  checkGates();
}
