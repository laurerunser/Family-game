// lexicon.js — the discovered-words glossary + in-body term highlighting.
import { DB } from './data.js';
import * as S from './state.js';

// Parse the player's translation pad into a map: lowercased word -> their gloss text.
// A word "appears" in the pad once recorded (any line "word = ...", gloss may be empty).
export function parseTranslations() {
  const map = new Map();
  for (const line of (S.get().transPad || '').split('\n')) {
    const m = line.match(/^\s*(.+?)\s*=\s*(.*)$/);
    if (m) map.set(m[1].trim().toLowerCase(), m[2].trim());
  }
  return map;
}

let termRegex = null;
function buildRegex() {
  // non-affix threnne forms, longest first so compounds win (suri-shen before suri)
  const forms = DB.lexicon
    .filter((t) => !t.affix)
    .map((t) => t.threnne)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  termRegex = new RegExp(`(?<![A-Za-z])(${forms.join('|')})(?![A-Za-z])`, 'gi');
}

// Wrap every threnne occurrence in a clickable span. Returns HTML (input is plain text).
// Untranslated words (not yet recorded in the translation pad) get a subtle shine; recorded
// words are muted, and — when "show my translations" is on — show the player's gloss faintly.
export function highlightBody(text) {
  if (!termRegex) buildRegex();
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const trans = parseTranslations();
  const showTrans = S.get().showTrans;
  let html = esc(text);
  html = html.replace(termRegex, (m) => {
    const entry = DB.lexicon.find((t) => t.threnne.toLowerCase() === m.toLowerCase());
    const tid = entry ? entry.term_id : '';
    const gloss = entry ? entry.english.replace(/"/g, '&quot;') : '';
    const recorded = trans.has(m.toLowerCase());
    const cls = recorded ? 'term translated' : 'term untranslated';
    let out = `<span class="${cls}" data-term="${tid}" title="${gloss}">${m}</span>`;
    if (showTrans && recorded && trans.get(m.toLowerCase())) {
      out += `<span class="gloss-inline">(${esc(trans.get(m.toLowerCase()))})</span>`;
    }
    return out;
  });
  // dim bracketed archivist notes
  html = html.replace(/(\[[^\]]*\])/g, '<span class="note">$1</span>');
  return html;
}

export function renderLexicon(ul) {
  const st = S.get();
  const discovered = DB.lexicon.filter((t) => st.discovered.includes(t.term_id) && !t.affix);
  // always show the affix key at the top once any term known
  const affixes = st.discovered.length ? DB.lexicon.filter((t) => t.affix) : [];
  ul.innerHTML = '';
  if (!discovered.length && !affixes.length) {
    ul.innerHTML = '<li class="hint">No words yet. Open a record to learn the Old Tongue.</li>';
    return;
  }
  const li = (t) => {
    const el = document.createElement('li');
    el.innerHTML = `<span class="lx-term">${t.threnne}</span>` +
      `<span class="lx-gloss">${t.english}</span>` +
      `<span class="lx-tier">T${t.tier ?? '·'}</span>`;
    return el;
  };
  discovered.sort((a, b) => (a.tier - b.tier) || a.threnne.localeCompare(b.threnne)).forEach((t) => ul.appendChild(li(t)));
  if (affixes.length) {
    const head = document.createElement('li');
    head.innerHTML = '<span class="lx-gloss" style="color:var(--purple)">— affixes (combine freely) —</span>';
    ul.appendChild(head);
    affixes.forEach((t) => ul.appendChild(li(t)));
  }
}
