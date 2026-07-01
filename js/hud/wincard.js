// wincard.js — the victory card shown on winning: a no-spoiler canvas graphic with the
// player's finish time and whether they used hints, plus social sharing. Everything is
// client-side (works on GitHub Pages): a generated PNG + the Web Share API where available,
// with Twitter / WhatsApp / Facebook intent links and a Download fallback (for Instagram).
import * as S from '../core/state.js';
import { formatMs } from './timer.js';

function shareUrl() { return location.origin + location.pathname; }
function shareText() {
  const t = formatMs(S.get().playMs);
  const h = S.get().usedHints ? ' (with hints)' : ' — no hints';
  return `I restored the fallen Loomhouse of Oramei in ${t}${h}. Can you read the reverse of the cloth?`;
}

// ---- the no-spoiler card image (1200×630, OG ratio) ------------------------------------
function drawCard() {
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  // background
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#150b26'); g.addColorStop(0.55, '#0a0712'); g.addColorStop(1, '#1a1030');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // soft glows
  for (const [cx, cy, r, col] of [[180, 120, 320, 'rgba(255,154,60,0.12)'], [1040, 540, 360, 'rgba(123,63,228,0.18)']]) {
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, col); rg.addColorStop(1, 'transparent');
    x.fillStyle = rg; x.fillRect(0, 0, W, H);
  }
  // scanlines
  x.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 2);

  // holographic emblem (concentric rings + a knot lattice) — decorative, no solution shown
  x.save();
  x.translate(W / 2, 196);
  x.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    x.strokeStyle = ['#54ffb0', '#4fd6ff', '#b06cff', '#ff9a3c'][i];
    x.globalAlpha = 0.85 - i * 0.12;
    x.shadowColor = x.strokeStyle; x.shadowBlur = 16;
    x.beginPath(); x.arc(0, 0, 44 + i * 16, 0, Math.PI * 2); x.stroke();
  }
  x.globalAlpha = 1; x.shadowBlur = 0;
  // little knot marks around the ring
  x.fillStyle = '#ffd56b';
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    x.beginPath(); x.arc(Math.cos(ang) * 118, Math.sin(ang) * 118, 3.5, 0, Math.PI * 2); x.fill();
  }
  x.restore();

  const text = (s, y, font, color, glow, align = 'center') => {
    x.font = font; x.fillStyle = color; x.textAlign = align;
    x.shadowColor = glow || 'transparent'; x.shadowBlur = glow ? 18 : 0;
    x.fillText(s, align === 'center' ? W / 2 : 60, y);
    x.shadowBlur = 0;
  };
  text('THE REVERSE OF THE CLOTH', 360, '700 46px Space Grotesk, sans-serif', '#ffb866', 'rgba(255,154,60,0.6)');
  text('· SIGNAL-WEAVE ·', 398, '500 20px monospace', '#b06cff', 'rgba(176,108,255,0.5)');
  text('SOLVED IN ' + formatMs(S.get().playMs), 478, '700 60px monospace', '#54ffb0', 'rgba(84,255,176,0.7)');
  text(S.get().usedHints ? 'with hints' : 'no hints — unaided', 516, '400 22px monospace',
    S.get().usedHints ? '#ffd56b' : '#4fd6ff', 'rgba(79,214,255,0.4)');
  text('restore the genealogy of the fallen Loomhouse of Oramei', 575, '400 22px monospace', '#b39bd4');

  return c;
}

async function cardBlob(canvas) {
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
}

// reusable share button row (no image) — used by the Phase-1 transition milestone
export function milestoneShareHTML() {
  return `<div class="share-row">
    <button class="accent-btn" data-share="native">📡 Share…</button>
    <button class="ghost-btn" data-share="twitter">𝕏 / Twitter</button>
    <button class="ghost-btn" data-share="whatsapp">WhatsApp</button>
    <button class="ghost-btn" data-share="facebook">Facebook</button>
  </div>`;
}

// wire any [data-share] buttons inside `scope` to share `text` (+ optional image canvas)
export function wireShare(scope, text, canvas) {
  const url = shareUrl();
  const open = (u) => window.open(u, '_blank', 'noopener');
  scope.querySelector('[data-share="twitter"]') && (scope.querySelector('[data-share="twitter"]').onclick = () =>
    open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`));
  scope.querySelector('[data-share="whatsapp"]') && (scope.querySelector('[data-share="whatsapp"]').onclick = () =>
    open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`));
  scope.querySelector('[data-share="facebook"]') && (scope.querySelector('[data-share="facebook"]').onclick = () =>
    open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`));
  const nb = scope.querySelector('[data-share="native"]');
  if (nb) {
    nb.onclick = async () => {
      try {
        if (canvas && navigator.canShare) {
          const file = new File([await cardBlob(canvas)], 'reverse-of-the-cloth.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, url, title: 'The Reverse of the Cloth' }); return; }
        }
        if (navigator.share) await navigator.share({ text, url, title: 'The Reverse of the Cloth' });
        else open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
      } catch (e) { /* cancelled */ }
    };
    if (!navigator.share) nb.style.display = 'none';
  }
}

// ---- the victory panel rendered into the finale overlay --------------------------------
export function renderVictory(container) {
  if (!container) return;
  const canvas = drawCard();
  const dataURL = canvas.toDataURL('image/png');
  container.innerHTML = `
    <div class="victory">
      <img class="victory-img" alt="Your result card" src="${dataURL}" />
      <p class="victory-line">Solved in <b>${formatMs(S.get().playMs)}</b> ·
        <span class="${S.get().usedHints ? 'with' : 'without'}">${S.get().usedHints ? 'with hints' : 'no hints'}</span></p>
      <div class="share-row">
        <button class="accent-btn" data-share="native">📡 Share…</button>
        <button class="ghost-btn" data-share="twitter">𝕏 / Twitter</button>
        <button class="ghost-btn" data-share="whatsapp">WhatsApp</button>
        <button class="ghost-btn" data-share="facebook">Facebook</button>
        <a class="ghost-btn" data-share="download" download="reverse-of-the-cloth.png" href="${dataURL}">⤓ Save image</a>
      </div>
      <p class="hint share-note">Tip: on a phone, “Share…” opens your apps (Instagram, Messages, …) with the card attached.
        Elsewhere, “Save image” downloads the card to post anywhere.</p>
    </div>`;

  wireShare(container, shareText(), canvas);
}
