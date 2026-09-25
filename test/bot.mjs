// Робот, който играе нива през вътрешното API: node test/bot.mjs <от> <до> [скорост] [реакция-сек]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const from = +(process.argv[2] || 1), to = +(process.argv[3] || from);
const speed = +(process.argv[4] || 4);
const react = +(process.argv[5] || 0.35);
const ONE_MODE = !!process.env.ONE;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript((up) => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', '1'); localStorage.setItem('bbb-save-v1', JSON.stringify({ seenTips: ['stand:basics', 'stand:fries', 'stand:cheese', 'stand:tomato', 'stand:lettuce'], locs: { stand: { unlocked: true, stars: new Array(20).fill(0), up: up ? JSON.parse(up) : {} } } })); } }, process.env.UP || '');
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('MIME')) { console.log('CONSOLE: ' + m.text()); errs.push(m.text()); } });
page.on('pageerror', (e) => { console.log('PAGEERROR: ' + e.message + ' ' + e.stack); errs.push(e.message); });
await page.goto(process.env.URL || 'http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 });
for (let n = from; n <= to; n++) {
  await page.evaluate(([n, speed, react, ONE_MODE]) => { window.__botRes = null; (async () => { window.__botRes = await (async () => {
    window.__speed = speed; window.__one = ONE_MODE;
    const G = window.__game;
    if (G.scene.isActive('Result')) G.scene.getScene('Result').go('Game', { loc: 'stand', n });
    else { G.scene.getScenes(true).forEach((x) => G.scene.stop(x.scene.key)); G.scene.start('Game', { loc: 'stand', n }); }
    await new Promise((r) => setTimeout(r, 300));
    const g = G.scene.getScene('Game');
    return await new Promise((resolve) => {
      const iv = setInterval(() => {
        if (G.scene.isActive('Result')) {
          clearInterval(iv);
          const r = G.scene.getScene('Result');
          resolve({ n, earned: g.earned, goals: g.level.goals, served: g.served, lost: g.lost, combo: g.maxCombo, stats: g.stats, stars: g.lost >= 0 ? g.level.goals.filter((x) => g.earned >= x).length : 0 });
          return;
        }
        if (!g.running || g.paused) return;
        const ONE = window.__one;
        let acted = false;
        const A = (fn) => { if (ONE && acted) return false; const r = fn(); if (r !== false) acted = true; return r; };
        // сервиране първо (човек вижда готовото)
        for (const it of [...g.warmer.items(), ...g.soda.items(), ...g.assembly.items()]) if (g.bestCustomer(it.key)) { A(() => g.serve(it)); break; }
        // скара
        for (const s of g.grill.slots) {
          if (s.state === 'A' && s.t >= g.grill.side) A(() => g.grill.tapSlot(s));
          else if (s.state === 'done' && g.assembly.canTake('patty')) A(() => g.grill.tapSlot(s));
          else if (s.state === 'burnt') A(() => g.grill.tapSlot(s));
        }
        // картофки навреме
        if (g.level.fries) for (const b of g.fryer.baskets) if (b.state === 'cook') { const q = g.fryer.quality(b); if ((q === 'perfect' && b.t > g.fryer.T + 0.2) || q === 'burnt') A(() => g.fryer.tapBasket(b)); }
        // напитки
        for (const nz of g.soda.nozzles) {
          if (nz.locked) continue;
          // човек държи пръста и пуска навреме — моделираме го с автоматично пълнене (заема ръцете ~1.9 с)
          if (nz.state === 'empty' && g.demand('drink:' + nz.flavor) > g.soda.count(nz.flavor) && !g.soda.nozzles.some((x) => x.auto)) A(() => g.soda.autoFill(nz));
        }
        // сглобяване
        const lines = [];
        for (const c of g.customers) if (c.state === 'order') for (const o of c.order) if (!o.done && !o.pending && o.dish.kind === 'burger') lines.push(o.dish.top);
        for (const p of g.assembly.items()) { const i = lines.findIndex((t) => [...t].sort().join() === p.key.split(':')[1]); if (i >= 0) lines.splice(i, 1); }
        g.assembly.plates.forEach((p, pi) => {
          if (p.closed || !p.layers.includes('patty')) return;
          const top = lines.shift();
          if (!top) return;
          const miss = top.filter((t) => !p.layers.includes(t));
          if (miss.length) { if (miss[0] !== 'tomato' || g.assembly.tomatoes > 0) A(() => g.assembly.addLayer(miss[0], pi)); }
          else if (p.layers.length - 1 === top.length) A(() => g.assembly.close(p));
        });
        const wantB = g.demand('burger') - g.assembly.items().length - g.assembly.pattiesOnPlates() - g.grill.cooking;
        if (wantB > 0) A(() => g.grill.addPatty());
        if (g.level.fries && g.demand('fries') > g.warmer.count + g.fryer.cooking * g.warmer.batch) A(() => g.fryer.load());
        if (g.level.fries && g.warmer.boxes.some((b) => !b.salted)) A(() => g.warmer.salt());
        if (g.prep.enabled && g.assembly.tomatoes < 3) A(() => { if (!g.prep.item) g.prep.takeTomato(); else g.prep.cut(); });
        for (const t of g.tables) if (t.dirty && !t.cust && !t.cleaning) { A(() => g.cleanTable(t)); break; }
      }, (react * 1000) / speed);
    });
  })(); })(); }, [n, speed, react, ONE_MODE]);
  let res = null;
  for (let k = 0; k < 400 && !res; k++) {
    await page.waitForTimeout(3000);
    if (process.env.SHOTS && k < 6) await page.screenshot({ path: `test/out/bot_L${n}_${k}.png` });
    res = await page.evaluate(() => window.__botRes);
    if (!res && k % 5 === 4) console.log('  …', JSON.stringify(await page.evaluate(() => { const g = window.__game.scene.getScene('Game'); return { now: Math.round(g.time.now), tw: g.tweens.getTweens().length, ts: [g.time.timeScale, g.tweens.timeScale, g.time.paused, g.tweens.paused], paused: g.paused, active: window.__game.scene.getScenes(true).map((x) => x.scene.key), sys: g.sys.settings.status, run: g.running, left: g.spawnLeft, cust: g.customers.map((c) => c.state + ':' + c.frac.toFixed(2) + ':' + c.order.map((o) => o.key + (o.done ? '✓' : '')).join('|')), earned: g.earned, grill: g.grill.slots.map((x) => x.state), plates: g.assembly.plates.map((p) => p.layers.join('+') + (p.closed ? '#' : '')), q: g.queue.length, tables: g.tables.map((t) => (t.cust ? 'C' : '') + (t.dirty ? 'D' : '')) }; })));
  }
  if (!res) { console.log('STUCK'); break; }
  console.log(`L${res.n}: earned ${res.earned} goals ${res.goals.join('/')} → ${res.stars}★ served ${res.served} lost ${res.lost} combo ${res.combo} burnt ${res.stats.burnt ?? 0} wasted ${res.stats.wasted ?? 0}`);
}
console.log(errs.slice(0, 10).join('\n') || 'no errors');
await browser.close();
