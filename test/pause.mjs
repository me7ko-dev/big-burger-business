import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGEERROR: ' + e.message));
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 });
await page.evaluate(() => { const G = window.__game; G.scene.stop('Menu'); G.scene.start('Game', { loc: 'stand', n: 3 }); });
const st = () => page.evaluate(() => { const G = window.__game; const g = G.scene.getScene('Game'); return { now: Math.round(g.time.now), el: g.elapsed.toFixed(1), active: G.scene.getScenes(true).map((x) => x.scene.key), status: g.sys.settings.status, paused: g.paused }; });
await page.waitForTimeout(4000); console.log('run', JSON.stringify(await st()));
await page.evaluate(() => window.__game.scene.getScene('Game').pause());
await page.waitForTimeout(1000); console.log('paused', JSON.stringify(await st()));
await page.mouse.click(640, 370 - 35); // ОТНАЧАЛО
await page.waitForTimeout(3000); console.log('restarted', JSON.stringify(await st()));
await page.waitForTimeout(3000); console.log('later', JSON.stringify(await st()));
await page.evaluate(() => window.__game.scene.getScene('Game').pause());
await page.waitForTimeout(500);
await page.mouse.click(640, 370 - 120); // ПРОДЪЛЖИ
await page.waitForTimeout(2000); console.log('resumed', JSON.stringify(await st()));
await browser.close();
