// stages.js — phase display, progress, objectives, and the gates between the three phases
// (the Turn, the cords hand-over, the frame reversal, and the finale).
import { DB } from './data.js';
import * as S from './state.js';
import { renderBoard, toast } from './tree.js';
import { setDrawMode, graphProgress, clusterProgress } from './edges.js';
import { showOverlay, hideOverlay } from './ui.js';
import { showFinale } from './finale.js';
import { formatMs } from './timer.js';
import { milestoneShareHTML, wireShare } from './wincard.js';
import { relationProgress, relLockInfo } from './relationships.js';

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

// ---- transition beats -------------------------------------------------------------------
function turnTransition() {
  const t = formatMs(S.get().flags.stage1Ms || S.get().playMs);
  showOverlay(`<span class="kicker">PHASE 1 COMPLETE · THE TURN</span>
    <h2>You read the front — in ${t}.</h2>
    <p>You placed every figure on the standing warp, followed the ward’s unterminated strand off the
    edge of the record, and inverted the signal. On the underside, in the tied-off threads, a hand has
    been speaking all along — from the <b>venn</b>, the reverse. The marked strands spell a name you
    already know: <b class="glow-g">SUVI</b>. <b>Phase 1 cleared in ${t}.</b> Share it, and dare a friend:</p>
    ${milestoneShareHTML()}
    <hr style="border-color:var(--line);margin:18px 0" />
    <h2 style="font-size:20px">The world is bigger than the front admits.</h2>
    <p>The reverse doesn’t hand you a pile of new names — it reveals hidden <b>relationships</b>: who was
    secretly wed, who was truly whose child, who loved whom. Your work now is to <b class="glow-o">draw
    those ties</b> on the tree — click one figure, then another, and name the bond. They lock <b>four at a
    time</b>, and only if every tie in the batch is true; one false tie and nothing locks.</p>
    <p>Two people the front never named sit greyed-out and unnamed — <b>the stranger</b> and <b>the
    farcomer</b>. You don’t pick their names from a list; you <b>pin them by their ties</b>. Once both are
    correctly tied in, <b class="glow-g">Talis</b> and <b class="glow-g">Dris</b> step into the light
    together, in colour.</p>
    <p class="hint">Tip: turn on <b>“Warn me when I’ve named too many”</b> in the right column for a
    heads-up when a batch won’t lock. (All help toggles are off by default.)</p>
    <div class="actions"><button class="accent-btn" id="ov-go">KEEP DIVING — ENTER THE REVERSE</button></div>`);
  wireShare(document.getElementById('overlay-card'),
    `I read the front of the fallen Loomhouse of Oramei and reached the hidden reverse in ${t}. Can you?`);
  document.getElementById('ov-go').addEventListener('click', () => {
    hideOverlay();
    S.discover(['venn']);
    document.dispatchEvent(new CustomEvent('game:change'));
    window.__game.openReader('r1');
  });
}

function cordsTransition() {
  showOverlay(`<span class="kicker">PHASE 2 → 3 · THE CORDS</span>
    <h2>“Set her name against the knots, and the knots will speak.”</h2>
    <p>Suvi’s reverse runs out of thread. She leaves you the locks: the cords answer to the name the
    record was made to deny — <b class="glow-g">NEMORA</b> — and the deepest cords, the ones that run
    outside the house, answer to two names twined: <b class="glow-g">NEMORA</b> and her father’s,
    <b class="glow-g">TALIS</b>.</p>
    <p>Dris carried the Counter’s cords off the reach. They are handed to you now. Open the workspace,
    type the key you restored, and read what the Loom dared not weave.</p>
    <div class="actions"><button class="accent-btn" id="ov-go">TAKE THE CORDS</button></div>`);
  document.getElementById('ov-go').addEventListener('click', () => {
    hideOverlay();
    document.dispatchEvent(new CustomEvent('game:change'));
    window.__game.openCord('c_rosetta');
    setDrawMode(false);
  });
}

function frameReversal() {
  S.setFlag('frameReread');
  S.setFlag('show:d1_reread', true);
  showOverlay(`<span class="kicker">STAGE 3 · THE FRAME REVERSAL</span>
    <h2>The Charge, read again.</h2>
    <p>${DB.byDoc['d1_reread'].body.replace(/^\[|\]$/g, '')}</p>
    <p class="hint">The border-nael on the very first vael — “the seal of our own order” — is the
    Outloom’s heir-nael <b>[${DB.sigilByOwner['outloom'].pattern.join(',')}]</b>. It matches. The order
    that hired you to restore the genealogy is the heir of the power that murdered her.</p>
    <div class="actions"><button class="accent-btn" id="ov-go">FINISH THE GRAPH</button></div>`);
  document.getElementById('ov-go').addEventListener('click', () => { hideOverlay(); document.dispatchEvent(new CustomEvent('game:change')); });
}

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
