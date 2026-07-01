// e2e.mjs — drive the real game in a headless browser through all three phases.
import { chromium } from 'playwright-core';

const URL = process.env.E2E_URL || 'http://localhost:8000/index.html';
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let failed = 0;
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) failed++; };

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
// ignore environmental network noise (blocked CDN fonts / favicon); only real JS errors count
const envNoise = (t) => /Failed to load resource|ERR_CONNECTION|net::|favicon|fonts\.g/i.test(t);
page.on('console', (m) => { if (m.type() === 'error' && !envNoise(m.text())) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// --- helpers that run in page context ---
const get = (fn, ...a) => page.evaluate(fn, ...a);
const flag = (k) => get((k) => window.__game && JSON.parse(localStorage.getItem('reverse-of-the-cloth.v1') || '{}').flags?.[k], k);
const stage = () => get(() => JSON.parse(localStorage.getItem('reverse-of-the-cloth.v1') || '{}').stage);
const overlayVisible = () => get(() => !document.getElementById('overlay').hidden);
const clickOverlayBtn = (id) => page.click(`#overlay #${id}`);

console.log('1. boots & renders');
ok(await get(() => document.querySelectorAll('#nodes .node').length) > 5, 'tree nodes rendered');
ok(await get(() => document.querySelectorAll('#doc-list li').length) >= 3, 'start docs listed');

console.log('2. Stage 1: read fronts, solve tree, lock, turn the cloth');
// open every listed stage-1 doc so they count as read (incl d4 hook)
await get(() => { document.querySelectorAll('#doc-list li').forEach((li) => li.click()); });
await get(() => window.__game.openReader('d4'));
await get(() => window.__solveTree());
async function lockLoop(max) {
  for (let i = 0; i < max; i++) {
    if (await overlayVisible()) break;
    await page.click('#btn-lock').catch(() => {});
    await page.waitForTimeout(40);
  }
}
// lock the tree (Phase 1 = gentle cadence)
await get(() => window.__dev.lockTreeWaves());
await page.waitForTimeout(260); // let the save debounce flush
ok(await get(() => Object.keys(JSON.parse(localStorage.getItem('reverse-of-the-cloth.v1')).locked).length) >= 14, 'stage-1 figures locked');
// invert the rosetta
await get(() => window.__game.openReader('turn_rosetta'));
await page.click('[data-invert]');
ok(await get(() => document.querySelector('.stego-read')?.textContent) === 'SUVI', 'rosetta reads SUVI');
await page.waitForTimeout(300);
ok(await overlayVisible(), 'Stage 1→2 turn overlay appeared');
await clickOverlayBtn('ov-go');
await page.waitForTimeout(200);
ok(await stage() === 2, 'advanced to stage 2');

console.log('3. Stage 2: read reverses, re-judge, take the cords');
for (const r of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']) {
  await get((r) => window.__game.openReader(r), r);
  await page.locator('#reader [data-invert]').click({ timeout: 5000 }); // reveal the hidden payload too
  await page.waitForTimeout(20);
}
await get(() => window.__dev.lockRelationships());
await page.waitForTimeout(300);
ok(await get(() => JSON.parse(localStorage.getItem('reverse-of-the-cloth.v1')).flags['reveal:talis']) === true, 'Talis & Dris revealed by their ties');
ok(await overlayVisible(), 'Stage 2→3 cords overlay appeared');
await clickOverlayBtn('ov-go');
await page.waitForTimeout(200);
ok(await stage() === 3, 'advanced to stage 3');
ok(await get(() => !document.getElementById('cord-dock').hidden), 'cord dock visible');

console.log('4. Stage 3: decode cords via the workspace UI');
async function decodeCord(id, key) {
  await get((id) => window.__game.openCord(id), id);
  await page.fill('#cord-dock #key-input', key);
  await page.click('#cord-dock #decode-btn');
  await page.waitForTimeout(120);
  return get(() => document.querySelector('#cord-dock #decode-out')?.textContent);
}
ok(await decodeCord('c_rosetta', 'NEMORA') === 'KARNA', 'c_rosetta decodes to KARNA');
ok(await decodeCord('c2', 'NEMORA') === 'CALETH', 'c2 decodes to CALETH (the assassin)');
ok(await decodeCord('c5', 'NEMORA') === 'SURIEN', 'c5 decodes to SURIEN');
ok(await decodeCord('c6', 'NEMORA') === 'CUTWARD', 'c6 decodes to CUTWARD');
ok(await decodeCord('c9', 'NEMORA') === 'DRIS', 'c9 decodes to DRIS');
// the forgery: wrong-looking under the true key
const c7out = await decodeCord('c7', 'NEMORA');
ok(c7out !== 'AVESA' && c7out.length === 5, `c7 under true key is gibberish (${c7out})`);
await page.click('#cord-dock #mark-forgery');
await page.waitForTimeout(260); // let the save debounce flush before reading localStorage
ok(await flag('forgeryCaught'), 'forgery caught (Avesa cleared)');
// the assembled-key cord -> triggers the frame reversal
const c8out = await decodeCord('c8', 'NTEAMLOIRSA');
ok(c8out === 'SHENLOOM', 'c8 decodes to SHENLOOM (the Outloom)');
await page.waitForTimeout(300);
ok(await overlayVisible(), 'frame-reversal overlay appeared');
await clickOverlayBtn('ov-go');
await page.waitForTimeout(150);
ok(await flag('frameReread'), 'frame reversal recorded');

console.log('5. Stage 3: draw one edge via UI, then complete the graph');
// enable draw mode, click source then target -> popover
await page.click('#btn-lock'); // toggles draw mode in stage 3
await page.waitForTimeout(200);
await page.locator('#nodes .node[data-id="caleth"]').click();
await page.waitForTimeout(120);
await page.locator('#nodes .node[data-id="nemora"]').click();
await page.waitForTimeout(200);
ok(await get(() => !!document.getElementById('role-pop')), 'edge role popover opened');
await page.selectOption('#role-pop #rp-role', 'assassin');
await page.selectOption('#role-pop #rp-cord', 'c2');
await page.click('#role-pop #rp-submit');
await page.waitForTimeout(120);
ok(await get(() => JSON.parse(localStorage.getItem('reverse-of-the-cloth.v1')).edges.some((e) => e.from === 'caleth' && e.to === 'nemora' && e.role === 'assassin')), 'caleth→nemora assassin edge accepted via UI');
// finish the remaining edges (dev) -> finale
await get(() => window.__dev.addAllEdges());
await page.waitForTimeout(300);
ok(await overlayVisible(), 'finale overlay appeared');
ok(await get(() => !!document.querySelector('[data-ending="reverse"]')), 'three medium-choices offered');
await page.click('[data-ending="reverse"]');
await page.waitForTimeout(150);
ok(await get(() => document.querySelector('#overlay-card p')?.textContent.includes('threa-kept')), 'reverse ending prose shown');
ok(await flag('finaleDone'), 'finale recorded');

console.log('\nconsole errors:', errors.length);
errors.slice(0, 10).forEach((e) => console.log('  ⚠', e));
console.log(`\n${failed === 0 && errors.length === 0 ? 'ALL GOOD' : 'PROBLEMS'}: ${failed} failed checks, ${errors.length} console errors.`);
await browser.close();
process.exit(failed === 0 && errors.length === 0 ? 0 : 1);
