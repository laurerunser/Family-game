// notes.js — the two right-column pads: a free NOTES pad and a TRANSLATIONS pad that words
// can be dropped into from the reader's term hover-menu. Both persist to localStorage and
// stay fully editable (copy/paste/rearrange freely).
import * as S from './state.js';

export function initNotes() {
  const notes = document.getElementById('scratchpad');
  const trans = document.getElementById('transpad');
  notes.value = S.get().scratch || '';
  trans.value = S.get().transPad || '';
  notes.addEventListener('input', () => S.setScratch(notes.value));
  trans.addEventListener('input', () => S.setTransPad(trans.value));
}

// Drop a word into the translation pad and put the cursor there to type the gloss.
export function recordTranslation(word) {
  const trans = document.getElementById('transpad');
  if (!trans) return;
  const w = word.trim();
  const lineStart = new RegExp('(^|\\n)' + w.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\s*=');
  if (!lineStart.test(trans.value)) {
    const sep = trans.value && !trans.value.endsWith('\n') ? '\n' : '';
    trans.value = trans.value + sep + w + ' = ';
    S.setTransPad(trans.value);
  }
  // focus and place the caret at the end of that word's line
  trans.focus();
  const idx = trans.value.search(new RegExp(w.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\s*=\\s*[^\\n]*$'));
  const caret = idx >= 0 ? trans.value.length : trans.value.length;
  trans.setSelectionRange(caret, caret);
  trans.scrollIntoView({ block: 'nearest' });
  trans.scrollTop = trans.scrollHeight;
}
