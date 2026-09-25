import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', '1'); localStorage.setItem('bbb-save-v1', JSON.stringify({ seenTips: ['stand:basics', 'stand:fries', 'stand:cheese', 'stand:tomato', 'stand:lettuce'] })); } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR: ' + e.message + '\n' + e.stack));
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 });
await page.evaluate(() => { const G = window.__game; G.scene.stop('Menu'); G.scene.start('Game', { loc: 'stand', n: +(new URLSearchParams(location.search).get('n') || 3) }); });
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(4000);
  console.log(JSON.stringify(await page.evaluate(() => { const g = window.__game.scene.getScene('Game'); return { heap: Math.round(performance.memory.usedJSHeapSize / 1e6), children: g.children.length, tweens: g.tweens.getTweens().length, timers: g.time._active?.length, tex: Object.keys(window.__game.textures.list).length, cust: g.customers.length, tut: g.tutor ? g.tutor.i : null, hold: g.holdSpawns }; })));
}
await browser.close();
