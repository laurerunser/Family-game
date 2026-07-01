// cords.js — the Stage-3 cord workspace dock: decode lettered cords with a player-supplied
// key, read numeric ledgers, match naels to people, and expose the forged cord's tell.
import { DB } from '../core/data.js';
import * as S from '../core/state.js';
import { decode, decodePlainCount, decodeNumeric, letterIndex } from '../core/cipher.js';

const change = () => document.dispatchEvent(new CustomEvent('game:change'));
let active = null;
let validWords = null;

function buildValidWords() {
  validWords = new Set();
  for (const t of DB.lexicon) validWords.add(t.threnne.toUpperCase().replace(/[^A-Z]/g, ''));
  for (const p of DB.people) validWords.add(p.given_name.toUpperCase().replace(/[^A-Z]/g, ''));
  for (const d of DB.documents) {
    if (d.cipher?.plain) validWords.add(d.cipher.plain.toUpperCase().replace(/[^A-Z]/g, ''));
    if (d.cipher?.plain_teach) validWords.add(d.cipher.plain_teach.toUpperCase().replace(/[^A-Z]/g, ''));
  }
  // command words the cords legitimately spell
  validWords.add('CUTWARD');
}
const isWord = (s) => { if (!validWords) buildValidWords(); return validWords.has(s.replace(/[^A-Z]/g, '')); };

function cordList() {
  return DB.documents.filter((d) => d.type === 'cord' && d.stage <= S.get().stage);
}

function sigilPatternHTML(pattern) {
  return `<span class="sigil-pattern">${pattern.map((k) =>
    `<span class="knot" style="height:${4 + k * 2}px"></span>`).join('')}</span>`;
}
function matchNael(pattern) {
  const key = DB.byDoc['c3']?.sigil_key || [];
  const hit = key.find((k) => JSON.stringify(k.pattern) === JSON.stringify(pattern));
  return hit ? DB.byPerson[hit.person_id]?.given_name : null;
}

export function renderCordDock() {
  const dock = document.getElementById('cord-dock');
  if (S.get().stage < 3) { dock.hidden = true; return; }
  dock.hidden = false;
  if (!active) active = 'c_rosetta';
  const list = cordList();
  dock.innerHTML = `
    <div class="cd-head"><h3>⟡ THE COUNTER'S CORDS</h3>
      <button class="ghost-btn sq" id="cd-close" title="Hide">×</button></div>
    <div class="cd-body">
      <div class="doc-list" id="cord-tabs">${list.map((c) => {
        const done = S.isDecoded(c.id) || S.flag('read:' + c.id) || (c.id === 'c7' && S.flag('forgeryCaught'));
        return `<li data-cord="${c.id}" class="${c.id === active ? 'active' : ''} ${done ? 'read' : ''}">
          <span class="badge cord">${done ? '✓' : '?'}</span><span class="dtitle">${c.title}</span></li>`;
      }).join('')}</div>
      <div id="cord-work"></div>
    </div>`;
  dock.querySelector('#cd-close').addEventListener('click', () => { dock.hidden = true; });
  dock.querySelectorAll('#cord-tabs li').forEach((li) =>
    li.addEventListener('click', () => { active = li.dataset.cord; renderCordDock(); }));
  renderWork();
}

function renderWork() {
  const d = DB.byDoc[active];
  const box = document.getElementById('cord-work');
  if (!d) { box.innerHTML = ''; return; }
  let html = `<h4 style="color:var(--orange-bright);margin:14px 0 4px">${d.title}</h4>`;
  html += `<p class="hint">${d.body.replace(/^\[|\]$/g, '')}</p>`;

  if (d.is_sigil_key) {
    html += `<table style="width:100%;border-collapse:collapse;margin-top:10px">`;
    for (const k of d.sigil_key) {
      html += `<tr><td style="padding:4px;color:var(--green)">${DB.byPerson[k.person_id]?.given_name}</td>
        <td style="padding:4px">${sigilPatternHTML(k.pattern)}</td>
        <td style="padding:4px;font-family:var(--mono);font-size:11px;color:var(--ink-dim)">[${k.pattern.join(',')}]</td></tr>`;
    }
    html += `</table>`;
    box.innerHTML = html;
    S.setFlag('read:c3'); return;
  }

  const c = d.cipher;
  if (c?.type === 'numeric') {
    html += `<div style="margin-top:10px">`;
    for (const e of c.entries) {
      const amt = decodeNumeric(e.amount_clusters);
      const date = e.date_clusters ? decodeNumeric(e.date_clusters) : null;
      const sigId = e.recipient_sigil_id || e.sender_sigil_id;
      const pat = sigId ? DB.bySigil[sigId]?.pattern : null;
      const who = pat ? matchNael(pat) : (e.recipient_person_id ? DB.byPerson[e.recipient_person_id]?.given_name : null);
      const dir = e.direction === 'in' ? 'IN ←' : 'OUT →';
      html += `<div class="cord-status" style="border:1px solid var(--line);color:var(--ink)">
        <b style="color:var(--orange-bright);font-family:var(--crt);font-size:20px">${amt}</b> ${dir}
        ${date ? `· turning ${date}` : ''}<br>
        ${pat ? `nael ${sigilPatternHTML(pat)} → <b style="color:${who ? 'var(--green)' : 'var(--red)'}">${who || 'outside the house (unknown nael)'}</b>` : (who ? `to ${who}` : '')}
        ${e.label ? `<span class="hint"> — ${e.label}</span>` : ''}</div>`;
    }
    html += `</div>`;
    box.innerHTML = html;
    S.setFlag('read:' + d.id); return;
  }

  if (c?.type === 'lettered') {
    const isAssembled = c.key === 'assembled';
    html += `<div class="cord-seg-row">${c.segments.map((s) =>
      s == null ? `<span class="cord-seg gap">/</span>` : `<span class="cord-seg">${s}</span>`).join('')}</div>`;
    if (c.sigil_id) {
      const pat = DB.bySigil[c.sigil_id]?.pattern;
      html += `<p class="hint">stamped nael ${sigilPatternHTML(pat)} → <b>${matchNael(pat) || 'outside the house'}</b>`;
      if (c.sender_sigil_id) { const sp = DB.bySigil[c.sender_sigil_id].pattern; html += ` · sender ${sigilPatternHTML(sp)} → <b>${matchNael(sp) || 'outside the house'}</b>`; }
      html += `</p>`;
    }
    html += `<div class="key-row"><input id="key-input" placeholder="${isAssembled ? 'twine two names…' : 'type the restored name…'}" value="${S.get().flags['key:' + d.id] || ''}"/>
      <button class="accent-btn" id="decode-btn">DECODE</button></div>`;
    if (isAssembled) html += `<p class="hint">These answer to two names twined. Interleave them, letter by letter.</p>`;
    html += `<div id="decode-out" class="decode-out"></div><div id="decode-msg"></div>`;
    box.innerHTML = html;

    const input = box.querySelector('#key-input');
    const out = box.querySelector('#decode-out');
    const msg = box.querySelector('#decode-msg');
    const runDecode = () => {
      const key = input.value.trim().toUpperCase().replace(/[^A-Z]/g, '');
      S.setFlag('key:' + d.id, key);
      if (!key) { out.innerHTML = ''; msg.innerHTML = ''; return; }
      const plain = decode(c.segments, key);
      const word = isWord(plain);
      out.className = 'decode-out' + (word ? '' : ' gibberish');
      out.innerHTML = plain.split('').map((ch) => `<span class="ltr${word ? ' word' : ''}">${ch}</span>`).join('');
      if (word) {
        msg.innerHTML = `<div class="cord-status good">✓ resolves to an Old-Tongue word — the key holds.</div>`;
        if (!S.isDecoded(d.id)) { S.setDecoded(d.id, plain); change(); }
      } else if (d.is_forgery) {
        const noKey = decodePlainCount(c.segments);
        msg.innerHTML = `<div class="cord-status bad">No Old-Tongue word. Under the true key this cord is noise —
          yet read with NO key it spells <b>${noKey}</b>. It was knotted in plain count to frame a name.</div>
          <button class="ghost-btn" id="mark-forgery" style="margin-top:8px">⚑ MARK AS FALSE-KARN (forgery)</button>`;
        box.querySelector('#mark-forgery').addEventListener('click', () => {
          S.setFlag('forgeryCaught'); window.__game.toast('You caught the forgery. Avesa was framed — the patsy.'); change();
        });
      } else {
        msg.innerHTML = `<div class="cord-status bad">Not a word. Wrong key, or this is no honest cord.</div>`;
      }
    };
    box.querySelector('#decode-btn').addEventListener('click', runDecode);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runDecode(); });
    if (input.value) runDecode();
    return;
  }
  box.innerHTML = html; // fallback (e.g. d1_reread routed elsewhere)
}

export function openCord(id) { active = id; renderCordDock(); document.getElementById('cord-dock').hidden = false; }
