// stages.js — phase display, progress, objectives, and the gates between the three phases
// (the Turn, the cords hand-over, the frame reversal, and the finale).
import { DB } from './data.js';
import * as S from './state.js';
import { renderBoard, toast } from './tree.js';
import { setDrawMode, graphProgress } from './edges.js';
import { showOverlay, hideOverlay } from './ui.js';
import { showFinale } from './finale.js';

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
    const s2 = placeableUpTo(2);
    const locked = s2.filter((p) => S.isLocked(p.id)).length;
    const rr = reversesRead().length;
    return [
      ['Restore her name from the reverse (read “The Reverse of the Ward’s Vael”)', S.isRead('r1')],
      ['Prove the venn-vau (Talis) and the true firstborn (read r2, r3)', S.isRead('r2') && S.isRead('r3')],
      [`Read all the reverses (${rr}/7)`, rr >= 7],
      ['Re-judge the standing warp — place every figure (' + locked + '/' + s2.length + ')', locked === s2.length],
      ['Take both keys (read “The Name the Vael Denied”)', S.isRead('r7')],
    ];
  }
  const gp = graphProgress();
  const cordsDone = letteredCords().filter((d) => S.isDecoded(d.id)).length;
  return [
    [`Decode the Counter’s cords (${cordsDone}/${letteredCords().length})`, cordsDone >= letteredCords().length - 1],
    ['Catch the false-karn (clear Avesa)', S.flag('forgeryCaught')],
    ['Assemble the second key and name the Outloom (decode c8)', S.isDecoded('c8')],
    ['Reread the Charge — see whose seal commissioned you', S.flag('frameReread')],
    [`Draw the conspiracy (${gp.done}/${gp.total} edges)`, gp.done === gp.total],
  ];
}

// ---- progress bar (global across the whole game) ----------------------------------------
function progressFraction() {
  const st = S.get();
  const s1 = placeableUpTo(1), s2 = placeableUpTo(2);
  const gp = graphProgress();
  const parts = [
    frac(s1.filter((p) => S.isLocked(p.id)).length, s1.length),
    st.flags.rosettaSeen ? 1 : 0,
    frac(reversesRead().length, 7),
    frac(s2.filter((p) => S.isLocked(p.id)).length, s2.length),
    frac(letteredCords().filter((d) => S.isDecoded(d.id)).length, letteredCords().length),
    st.flags.forgeryCaught ? 1 : 0,
    st.flags.frameReread ? 1 : 0,
    frac(gp.done, gp.total),
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
    S.setFlag('turned'); S.setStage(2);
    S.discover(['venn', 'venn_vau', 'veresh', 'mis_shorn', 'threa_kept']);
    turnTransition();
    return;
  }
  // Stage 2 -> 3: the reverses are read, the warp re-judged, both keys taken.
  if (st.stage === 2 && reversesRead().length >= 7 && allLocked(placeableUpTo(2))
      && S.isRead('r7') && !S.flag('cordsHandover')) {
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
  // Stage 3: graph complete + forgery caught + frame seen -> finale.
  const gp = graphProgress();
  if (st.stage === 3 && gp.done === gp.total && S.flag('forgeryCaught') && S.flag('frameReread') && !S.flag('finaleDone')) {
    S.setFlag('show:c_final', true);
    showFinale();
  }
}

// ---- transition beats -------------------------------------------------------------------
function turnTransition() {
  showOverlay(`<span class="kicker">PHASE 1 → 2 · THE TURN</span>
    <h2>The thread runs off the edge — and does not end.</h2>
    <p>You followed the ward’s unterminated strand off the selvage of the record and inverted the
    signal. On the underside, in the tied-off threads, a hand has been speaking all along — from the
    <b>venn</b>, the reverse. The marked strands spell a name you already know: <b class="glow-g">SUVI</b>.</p>
    <p>The front was the medium of the lie. The reverse is where the silenced weaver hid the truth,
    against the day a reader would turn the cloth. Read her reverses now. Search the Old Tongue she
    teaches — begin with <b>venn</b>.</p>
    <div class="actions"><button class="accent-btn" id="ov-go">ENTER THE REVERSE</button></div>`);
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
  document.getElementById('board-title').textContent =
    st.stage === 3 ? 'THE CONSPIRACY · draw the cords' : (st.stage === 2 ? 'THE REVERSE · re-judge the warp' : 'THE STANDING WARP');

  const pct = Math.round(progressFraction() * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';

  const ul = document.getElementById('objectives');
  ul.innerHTML = objectives().map(([t, done]) => `<li class="${done ? 'done' : ''}">${t}</li>`).join('');

  // Stage-3: swap the LOCK button for a DRAW toggle
  const lockBtn = document.getElementById('btn-lock');
  if (st.stage >= 3) {
    lockBtn.textContent = window.__drawToggle ? '✦ DRAWING — click to stop' : '✎ DRAW EDGE';
    lockBtn.classList.toggle('accent-btn', !!window.__drawToggle);
  } else {
    lockBtn.textContent = 'LOCK ANSWERS';
  }

  checkGates();
}
