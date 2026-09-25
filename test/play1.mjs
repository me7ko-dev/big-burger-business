// Изиграва обучението на ниво 1 с кликове и прави снимки.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const out = 'test/out';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
await page.goto(process.env.URL || 'http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 });
await page.evaluate(() => { localStorage.clear(); const g = window.__game; g.scene.stop('Menu'); g.scene.start('Game', { loc: 'stand', n: 1 }); });
const W = (ms) => page.waitForTimeout(ms);
const click = async (x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await W(40); await page.mouse.up(); await W(120); };
const state = () => page.evaluate(() => { const g = window.__game.scene.getScene('Game'); const c = g.customers[0]; return { earned: g.earned, tut: g.tutor ? g.tutor.i : -1, cust: c ? { state: c.state, order: c.order.map((o) => o.done) } : null, grill: g.grill.slots.map((s) => s.state + ':' + s.t.toFixed(1)), plates: g.assembly.plates.map((p) => p.layers.join('+') + (p.closed ? '#' : '')), soda: g.soda.nozzles.map((n) => n.state + ':' + n.fill.toFixed(2)), tray: g.soda.tray.map((t) => t && t.flavor), dirty: g.tables.map((t) => t.dirty) }; });
await W(3500);
console.log('start', JSON.stringify(await state()));
await click(685, 640); // кюфтета
await W(3700);
await page.screenshot({ path: `${out}/p1_flip.png` });
console.log('before flip', JSON.stringify(await state()));
await click(639, 468); // обръщане
await W(3700);
console.log('before take', JSON.stringify(await state()));
await click(639, 468); // към чинията
await W(300);
await click(848, 456); // питки
await W(300);
await page.screenshot({ path: `${out}/p1_burger.png` });
console.log('burger', JSON.stringify(await state()));
await click(893, 628); // сервиране
await W(600);
// кола: задържане
await page.mouse.move(60, 530); await page.mouse.down(); await W(1720);
await page.screenshot({ path: `${out}/p1_pour.png` });
await page.mouse.up();
await W(700);
console.log('drink', JSON.stringify(await state()));
await click(60, 666);
await W(700);
await page.screenshot({ path: `${out}/p1_served.png` });
await W(2200);
await page.screenshot({ path: `${out}/p1_paid.png` });
console.log('paid', JSON.stringify(await state()));
await W(800);
await click(290, 290); // почистване
await W(1500);
console.log('cleaned', JSON.stringify(await state()));
await W(7000);
await page.screenshot({ path: `${out}/p1_after.png` });
console.log('after', JSON.stringify(await state()));
console.log(errs.slice(0, 10).join('\n') || 'no errors');
await browser.close();
