// search.js — the emergent discovery gate. A term is searchable only once discovered;
// search returns documents containing it (within the unlocked stage), date-sorted, capped.
import { DB, termByThrenne } from './data.js';
import * as S from './state.js';
import { openReader } from './reader.js';

const CAP = 3;

export function searchDocsForTerm(termId) {
  const st = S.get();
  return DB.documents
    .filter((d) => (d.searchable_terms || []).includes(termId)
      && d.stage <= st.stage
      && !d.is_finale && !d.is_frame_reversal)
    .sort((a, b) => a.date - b.date)
    .slice(0, CAP);
}

function renderResults(box, termId, label) {
  if (!termId || !S.isDiscovered(termId)) {
    box.hidden = false;
    box.innerHTML = `<div class="sr-empty">“${label}” is not a word you have learned yet.</div>`;
    return;
  }
  const hits = searchDocsForTerm(termId);
  box.hidden = false;
  if (!hits.length) { box.innerHTML = `<div class="sr-empty">Nothing in the recovered records answers to that word — yet.</div>`; return; }
  box.innerHTML = '';
  for (const d of hits) {
    const row = document.createElement('div');
    row.className = 'sr';
    row.innerHTML = `<span class="t"><span class="badge ${d.type}">${d.type}</span> ${d.title}</span><span class="d">turning ${d.date}</span>`;
    row.addEventListener('click', () => { box.hidden = true; openReader(d.id); });
    box.appendChild(row);
  }
}

// programmatic search (used when a term is clicked in prose)
export function searchTerm(termId) {
  const input = document.getElementById('search-input');
  const box = document.getElementById('search-results');
  const entry = DB.byTerm[termId];
  if (entry) input.value = entry.threnne;
  renderResults(box, termId, entry ? entry.threnne : termId);
}

export function wireSearch() {
  const input = document.getElementById('search-input');
  const box = document.getElementById('search-results');
  const run = () => {
    const text = input.value.trim();
    if (!text) { box.hidden = true; return; }
    const entry = termByThrenne(text);
    renderResults(box, entry ? entry.term_id : null, text);
  };
  input.addEventListener('input', run);
  input.addEventListener('focus', () => { if (input.value.trim()) run(); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) box.hidden = true;
  });
}
