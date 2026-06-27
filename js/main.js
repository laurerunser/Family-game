// main.js — boot + wiring. Loads content, seeds the start state, renders every panel, and
// routes UI events. Exposes a small window.__game bridge so modules can call across cleanly.
import { loadData, DB } from './data.js';
import * as S from './state.js';
import { wireSearch, searchTerm } from './search.js';
import { openReader, renderDocList } from './reader.js';
import { renderLexicon } from './lexicon.js';
import { renderBoard, initViewport, attemptLock, toast } from './tree.js';
import { setDrawMode, isDrawMode } from './edges.js';
import { renderCordDock, openCord } from './cords.js';
import { refresh } from './stages.js';
import { initNotes } from './notes.js';
import { initTimer, renderTimer } from './timer.js';
import { showFinale } from './finale.js';

function seedStart() {
  const st = S.get();
  if (st.opened.length) return; // already started
  const starts = DB.documents.filter((d) => d.is_start && d.stage === 1);
  for (const d of starts) {
    S.openDoc(d.id);
    S.discover(d.searchable_terms || []);
  }
  S.save();
}

function renderAll() {
  renderDocList();
  renderLexicon(document.getElementById('lexicon-list'));
  renderBoard();
  renderCordDock();
  renderTimer();
  document.getElementById('hints-toggle').checked = S.get().hintsOn;
  refresh();
}

function wireChrome() {
  // tabs
  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  }));

  // lock / draw button (context-sensitive by stage)
  document.getElementById('btn-lock').addEventListener('click', () => {
    if (S.get().stage >= 3) {
      window.__drawToggle = !isDrawMode();
      setDrawMode(window.__drawToggle);
      toast(window.__drawToggle ? 'Edge-draw on: click a source, then a target.' : 'Edge-draw off.');
    } else {
      attemptLock();
    }
  });

  // notes pads (free notes + translations)
  initNotes();

  // extra-hints toggle (off by default)
  const hints = document.getElementById('hints-toggle');
  hints.checked = S.get().hintsOn;
  hints.addEventListener('change', () => { S.setHints(hints.checked); document.dispatchEvent(new CustomEvent('game:change')); });

  // reset
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Wipe all local progress and start over?')) { S.reset(); location.reload(); }
  });
}

async function boot() {
  try {
    await loadData();
  } catch (e) {
    document.getElementById('reader').hidden = false;
    document.getElementById('reader').innerHTML =
      `<div class="r-body" style="color:var(--red)">Failed to load game content.<br>${e.message}<br><br>
      Serve this folder over HTTP (e.g. <code>python3 -m http.server</code>) — file:// blocks fetch().</div>`;
    return;
  }

  // bridge used by reader/cords/edges/stages/finale
  window.__game = { openReader, openCord, searchTerm, toast, refresh };

  seedStart();
  wireChrome();
  wireSearch();
  initViewport();
  initTimer();
  renderAll();

  // central refresh on any state change
  document.addEventListener('game:change', renderAll);

  // returning winner: re-show their ending + result card (they can share again)
  if (S.flag('finaleDone') && S.get().finale) showFinale();

  // dev helper (not surfaced in UI): window.__solveTree() to auto-fill correct names
  window.__solveTree = () => {
    for (const [id, sol] of Object.entries(DB.solution.tree)) {
      if (DB.byPerson[id]?.generation == null) continue;
      if (DB.byPerson[id].stage_introduced > S.get().stage) continue;
      S.setSlot(id, 'name', sol.given_name); S.setSlot(id, 'title', sol.title);
    }
    document.dispatchEvent(new CustomEvent('game:change'));
  };

  // dev hooks for automated testing only (not surfaced in the UI)
  window.__dev = {
    addAllEdges() {
      for (const e of DB.solution.stage3_graph) S.addEdge({ from: e.from, to: e.to, role: e.role });
      S.setFlag('reveal:factor'); S.setFlag('reveal:outloom');
      document.dispatchEvent(new CustomEvent('game:change'));
    },
  };

  // open the charge to begin
  if (!S.get().read.length) openReader('d1');
}

boot();
