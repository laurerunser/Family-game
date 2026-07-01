// ui.js — shared overlay helpers for transition beats and the finale.
export function showOverlay(html, { dismissable = true } = {}) {
  const ov = document.getElementById('overlay');
  const card = document.getElementById('overlay-card');
  card.innerHTML = html;
  ov.hidden = false;
  if (dismissable) {
    const close = (e) => { if (e.target === ov) hideOverlay(); };
    ov.onclick = close;
  } else {
    ov.onclick = null;
  }
  return card;
}
export function hideOverlay() {
  document.getElementById('overlay').hidden = true;
}
