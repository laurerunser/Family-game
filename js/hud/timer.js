// timer.js — accumulates ACTIVE play time (only while the tab is visible and the game is
// unsolved). Freezes at victory. Persisted via state.playMs so it survives reloads.
import * as S from '../core/state.js';

let lastTick = Date.now();

export function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hh ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}

export function renderTimer() {
  const el = document.getElementById('timer-val');
  if (!el) return;
  el.textContent = formatMs(S.get().playMs);
  el.classList.toggle('won', S.hasWon());
}

export function initTimer() {
  lastTick = Date.now();
  document.addEventListener('visibilitychange', () => { lastTick = Date.now(); });
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;
    if (document.visibilityState === 'visible' && !S.hasWon()) {
      S.addPlay(delta);
      renderTimer();
    }
  }, 1000);
  renderTimer();
}
