// Снимки на екраните: node test/shot.mjs <сцена> [ниво] [секунди] [изходна папка]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const scene = process.argv[2] || 'Menu';
const n = +(process.argv[3] || 1);
const secs = +(process.argv[4] || 6);
const out = process.argv[5] || 'test/out';
const url = process.env.URL || 'http://localhost:4173/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
if (process.env.SAVE) await ctx.addInitScript((s) => { localStorage.setItem('bbb-save-v1', s); }, process.env.SAVE);
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('MIME')) errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
await page.goto(url);
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 }).catch(() => errs.push('TIMEOUT'));
if (scene !== 'Menu') {
  await page.evaluate(([s, n]) => { const g = window.__game; g.scene.getScenes(true).forEach((x) => g.scene.stop(x.scene.key)); g.scene.start(s, { loc: 'stand', n }); }, [scene, n]);
}
for (let i = 0; i < 3; i++) {
  await page.waitForTimeout((secs * 1000) / 3);
  await page.screenshot({ path: `${out}/${scene}${n}_${i}.png` });
}
console.log(errs.slice(0, 20).join('\n') || 'no errors');
await browser.close();
