// viewport.js — pan & zoom for the board: mouse drag, wheel, trackpad pinch (ctrl+wheel),
// iPad two-finger pinch, and the +/−/FIT buttons. Split out of tree.js.
import { BOARD_W, BOARD_H } from './tree.js';
import { isDrawMode } from './edges.js';
import { isRelMode } from './relationships.js';

export function initViewport() {
  const vp = document.getElementById('viewport');
  const board = document.getElementById('board');
  let tx = 0, ty = 0, scale = 0.62;
  const apply = () => { board.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
  const clampScale = (s) => Math.min(2.2, Math.max(0.28, s));

  function zoomAt(cx, cy, factor) {
    const rect = vp.getBoundingClientRect();
    const px = cx - rect.left, py = cy - rect.top;
    const ns = clampScale(scale * factor);
    // keep the point under the cursor fixed
    tx = px - (px - tx) * (ns / scale);
    ty = py - (py - ty) * (ns / scale);
    scale = ns; apply();
  }
  function fit() {
    const rect = vp.getBoundingClientRect();
    scale = clampScale(Math.min(rect.width / BOARD_W, rect.height / BOARD_H) * 1.5);
    tx = (rect.width - BOARD_W * scale) / 2;
    ty = 40;
    apply();
  }

  // wheel: ctrl/⌘ (and trackpad pinch) => zoom; otherwise pan
  vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    else { tx -= e.deltaX; ty -= e.deltaY; apply(); }
  }, { passive: false });

  // pointer drag to pan
  let dragging = false, lastX = 0, lastY = 0, pid = null;
  vp.addEventListener('pointerdown', (e) => {
    if (e.target.closest('select') || e.target.closest('.rel-chip')
        || (e.target.closest('.node') && (isDrawMode() || isRelMode()))) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY; pid = e.pointerId;
    vp.classList.add('grabbing'); vp.setPointerCapture(pid);
  });
  vp.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    tx += e.clientX - lastX; ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; apply();
  });
  const endDrag = () => { dragging = false; vp.classList.remove('grabbing'); };
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);

  // touch pinch (iPad / phones)
  let pinchDist = 0;
  vp.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      if (pinchDist) zoomAt(mid.x, mid.y, d / pinchDist);
      pinchDist = d;
    }
  }, { passive: false });
  vp.addEventListener('touchend', () => { pinchDist = 0; });

  const center = (factor) => { const r = vp.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor); };
  document.getElementById('btn-zoom-in').addEventListener('click', () => center(1.2));
  document.getElementById('btn-zoom-out').addEventListener('click', () => center(1 / 1.2));
  document.getElementById('btn-zoom-reset').addEventListener('click', fit);
  fit();
}
