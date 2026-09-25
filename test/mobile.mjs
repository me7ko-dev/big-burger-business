// Телефон в хоризонтален режим с докосване.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'] });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 });
const vp = page.viewportSize();
console.log('viewport', JSON.stringify(vp));
// координати от играта (1280x720) към екрана
const map = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1280 }; });
const tap = async (gx, gy) => { await page.touchscreen.tap(map.x + gx * map.s, map.y + gy * map.s); await page.waitForTimeout(300); };
await page.waitForTimeout(800);
await page.screenshot({ path: 'test/out/m_menu.png' });
await tap(640, 520); // ВЗЕМИ дневна награда
await page.waitForTimeout(800);
await tap(640, 580); // ИГРАЙ
await page.waitForTimeout(800);
await page.screenshot({ path: 'test/out/m_map.png' });
await tap(150, 270); // ниво 1
await page.waitForTimeout(500);
await tap(750, 550); // ИГРАЙ в прозореца
await page.waitForTimeout(3800);
await tap(685, 640); // кюфтета
await page.waitForTimeout(400);
await page.screenshot({ path: 'test/out/m_game.png' });
console.log(JSON.stringify(await page.evaluate(() => { const g = window.__game.scene.getScene('Game'); return { active: window.__game.scene.getScenes(true).map((s) => s.scene.key), grill: g.grill?.slots.map((s) => s.state) }; })));
console.log(errs.filter((e) => !e.includes('MIME')).join('\n') || 'no errors');
await browser.close();
