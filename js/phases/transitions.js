// transitions.js — the full-screen beats between phases: the Turn (1→2, with the Phase-1
// time + share), the cords hand-over (2→3), and the frame reversal. Split out of stages.js.
import { DB } from '../core/data.js';
import * as S from '../core/state.js';
import { showOverlay, hideOverlay } from '../hud/ui.js';
import { formatMs } from '../hud/timer.js';
import { milestoneShareHTML, wireShare } from '../hud/wincard.js';
import { setDrawMode } from '../board/edges.js';

const change = () => document.dispatchEvent(new CustomEvent('game:change'));

export function turnTransition() {
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
    change();
    window.__game.openReader('r1');
  });
}

export function cordsTransition() {
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
    change();
    window.__game.openCord('c_rosetta');
    setDrawMode(false);
  });
}

export function frameReversal() {
  S.setFlag('frameReread');
  S.setFlag('show:d1_reread', true);
  showOverlay(`<span class="kicker">STAGE 3 · THE FRAME REVERSAL</span>
    <h2>The Charge, read again.</h2>
    <p>${DB.byDoc['d1_reread'].body.replace(/^\[|\]$/g, '')}</p>
    <p class="hint">The border-nael on the very first vael — “the seal of our own order” — is the
    Outloom’s heir-nael <b>[${DB.sigilByOwner['outloom'].pattern.join(',')}]</b>. It matches. The order
    that hired you to restore the genealogy is the heir of the power that murdered her.</p>
    <div class="actions"><button class="accent-btn" id="ov-go">FINISH THE GRAPH</button></div>`);
  document.getElementById('ov-go').addEventListener('click', () => { hideOverlay(); change(); });
}
