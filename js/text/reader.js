// reader.js — the document reader: prose, term highlighting, and the "invert the signal"
// reverse-channel toggle with its steganography grid.
import { DB } from '../core/data.js';
import * as S from '../core/state.js';
import { highlightBody } from './lexicon.js';
import { reachableUndiscovered } from './search.js';
import { recordTranslation } from './notes.js';

const change = () => document.dispatchEvent(new CustomEvent('game:change'));
let activeDoc = null;
let inverted = false;

export function activeDocId() { return activeDoc; }

// Re-render the open document (used when translations / show-translations change).
export function rerenderReader() { if (activeDoc) render(); }

export function openReader(id) {
  const d = DB.byDoc[id];
  if (!d) return;
  activeDoc = id;
  inverted = false;
  S.openDoc(id);
  S.markRead(id);
  S.discover(d.searchable_terms || []);
  // reverses also plant their hidden-payload words into play once read in Stage 2+
  render();
  change();
}

function render() {
  const d = DB.byDoc[activeDoc];
  const reader = document.getElementById('reader');
  reader.hidden = false;
  const typeClass = d.type;
  let html = `<div class="r-head">
      <h2>${d.title}</h2>
      <span class="r-meta"><span class="badge ${typeClass}">${d.type}</span><br>turning ${d.date}</span>
    </div>`;

  if (d.hidden_payload && inverted) {
    html += `<button class="ghost-btn invert-btn on" data-invert>◐ SIGNAL INVERTED — show front</button>`;
    html += stegoHTML(d.hidden_payload);
  } else {
    html += `<div class="r-body">${highlightBody(d.body)}</div>`;
    if (d.hidden_payload) {
      html += `<button class="ghost-btn invert-btn" data-invert>◑ INVERT THE SIGNAL — read the reverse</button>`;
    }
  }
  if (S.get().hintsOn) {
    const n = reachableUndiscovered(d);
    html += `<p class="reach-hint">↳ ${n} undiscovered ${n === 1 ? 'record is' : 'records are'} reachable by searching this one's words.</p>`;
  }
  reader.innerHTML = html;

  reader.querySelectorAll('.term').forEach((el) => attachTermMenu(el));
  const invertBtn = reader.querySelector('[data-invert]');
  if (invertBtn) invertBtn.addEventListener('click', () => {
    inverted = !inverted;
    if (inverted && d.hidden_payload) {
      S.discover(d.searchable_terms || []);
      if (d.is_turn_rosetta) S.setFlag('rosettaSeen');
      S.setFlag('inverted:' + d.id);
    }
    render();
    change();
  });

  // reflect active state in the doc list
  document.querySelectorAll('#doc-list li').forEach((li) =>
    li.classList.toggle('active', li.dataset.id === activeDoc));
}

// --- term hover menu: Search | Record translation --------------------------------------
let termPop = null;
let popHideTimer = null;
function ensurePop() {
  if (termPop) return termPop;
  termPop = document.createElement('div');
  termPop.className = 'term-pop';
  termPop.hidden = true;
  termPop.addEventListener('mouseenter', () => clearTimeout(popHideTimer));
  termPop.addEventListener('mouseleave', () => scheduleHidePop());
  document.body.appendChild(termPop);
  return termPop;
}
function scheduleHidePop() { popHideTimer = setTimeout(() => { if (termPop) termPop.hidden = true; }, 180); }

function attachTermMenu(el) {
  const tid = el.dataset.term;
  if (!tid) return;
  const entry = DB.byTerm[tid];
  const showPop = () => {
    clearTimeout(popHideTimer);
    const pop = ensurePop();
    const gloss = entry ? entry.english : '';
    pop.innerHTML = `<div class="tp-word">${el.textContent}</div>` +
      (gloss ? `<div class="tp-gloss">${gloss.replace(/</g, '&lt;')}</div>` : '') +
      `<button class="ghost-btn" data-act="search">🔍 Search records</button>` +
      `<button class="ghost-btn" data-act="record">✎ Record translation</button>`;
    const r = el.getBoundingClientRect();
    pop.style.left = Math.min(window.innerWidth - 222, r.left) + 'px';
    pop.style.top = (r.bottom + 6) + 'px';
    pop.hidden = false;
    pop.querySelector('[data-act="search"]').onclick = (ev) => {
      ev.stopPropagation(); // don't let the global handler close the results box
      S.discover([tid]); window.__game?.searchTerm?.(tid); pop.hidden = true; change();
    };
    pop.querySelector('[data-act="record"]').onclick = (ev) => {
      ev.stopPropagation();
      recordTranslation(el.textContent, gloss); pop.hidden = true;
    };
  };
  el.addEventListener('mouseenter', showPop);
  el.addEventListener('mouseleave', scheduleHidePop);
  el.addEventListener('click', showPop); // tap support on touch devices
}

function stegoHTML(payload) {
  const { cells, marked_indices, grid_w, text } = payload;
  const markedSet = new Set(marked_indices);
  let grid = `<div class="stego" style="grid-template-columns: repeat(${grid_w}, 1fr)">`;
  cells.forEach((c, i) => {
    grid += `<div class="cell${markedSet.has(i) ? ' marked' : ''}">${c}</div>`;
  });
  grid += `</div>`;
  const reading = marked_indices.map((i) => cells[i]).join('');
  grid += `<p class="hint">Most strands are carried (noise); the tied-off strands glow. Read them in order:</p>`;
  grid += `<div class="stego-read">${reading}</div>`;
  return grid;
}

// Render the left-column document list (everything the player has opened / can open).
export function renderDocList() {
  const st = S.get();
  const ul = document.getElementById('doc-list');
  // a doc is listed if opened, is_start, or (for its stage) already unlocked via search index
  const visible = DB.documents.filter((d) => {
    if (d.is_finale || d.is_frame_reversal) return st.flags['show:' + d.id];
    return S.isOpen(d.id) || (d.is_start && d.stage <= st.stage);
  });
  visible.sort((a, b) => a.stage - b.stage || a.date - b.date);
  ul.innerHTML = '';
  for (const d of visible) {
    const li = document.createElement('li');
    li.dataset.id = d.id;
    if (S.isRead(d.id)) li.classList.add('read');
    if (d.id === activeDoc) li.classList.add('active');
    li.innerHTML = `<span class="badge ${d.type}">${d.type[0].toUpperCase()}</span>` +
      `<span class="dtitle">${d.title}</span><span class="ddate">T${d.date}</span>`;
    li.addEventListener('click', () => openReader(d.id));
    ul.appendChild(li);
  }
}
