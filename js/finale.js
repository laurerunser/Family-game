// finale.js — the medium-choice ending: front / reverse / cords. The medium is the meaning.
import { DB } from './data.js';
import * as S from './state.js';
import { showOverlay } from './ui.js';
import { renderVictory } from './wincard.js';

export function showFinale() {
  const d = DB.byDoc['c_final'];
  if (S.get().finale) return showEnding(S.get().finale);
  showOverlay(`<span class="kicker">PHASE 3 · THE THREE FACES</span>
    <h2>The charge is answered. Now — what becomes of the truth?</h2>
    <p>${d.body.replace(/^\[|\]$/g, '')}</p>
    <p>You hold a truth that destroys the order that holds your leash. You must commit it to one of
    three media. <b>The medium is the meaning.</b></p>
    <div class="actions">
      ${d.endings.map((e) => `<button class="choice" data-ending="${e.id}">
        <h3>${e.label}</h3><p>${e.meaning}</p></button>`).join('')}
    </div>`, { dismissable: false });
  document.querySelectorAll('[data-ending]').forEach((b) =>
    b.addEventListener('click', () => { S.setFinale(b.dataset.ending); showEnding(b.dataset.ending); }));
}

function showEnding(id) {
  const d = DB.byDoc['c_final'];
  const e = d.endings.find((x) => x.id === id);
  const titleMap = { front: 'WEAVE IT INTO THE FRONT', reverse: 'HIDE IT IN A NEW REVERSE', cords: 'KNOT IT INTO CORDS' };
  showOverlay(`<span class="kicker">ENDING · ${titleMap[id]}</span>
    <h2>${e.label}</h2>
    <p style="white-space:pre-wrap">${(e.text || e.meaning)}</p>
    <p class="hint">Nemora — veresh, renthed, the warp — is restored. The cloth is closed the way you chose to close it.</p>
    <div id="victory-card"></div>
    <div class="actions">
      <button class="ghost-btn" id="ov-reflect">REFLECT (keep reading)</button>
      <button class="accent-btn" id="ov-again">BEGIN AGAIN</button>
    </div>`, { dismissable: false });
  renderVictory(document.getElementById('victory-card'));
  document.getElementById('ov-reflect').addEventListener('click', () => { document.getElementById('overlay').hidden = true; });
  document.getElementById('ov-again').addEventListener('click', () => { S.reset(); location.reload(); });
}
