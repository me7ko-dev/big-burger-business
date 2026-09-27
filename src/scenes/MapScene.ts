import Phaser from 'phaser';
import { W, H, LOCATIONS, levelDef } from '../config/game';
import { S, save, loc, totalStars, bestDay, dayStars } from '../data/save';
import { button, txt, mkImg, img, C, panel, dim, roundRect, sparkles, shade, fmt } from '../ui/kit';
import { menuBg } from '../ui/bg';
import { TopBar } from '../ui/topbar';
import { sfx } from '../audio/sfx';
import { ensureTasks, claimableCount } from './TasksScene';

export class MapScene extends Phaser.Scene {
  bar!: TopBar;
  li = 0;
  layer?: Phaser.GameObjects.Container;

  constructor() {
    super('Map');
  }

  create(): void {
    const sv = S();
    this.li = Math.max(0, LOCATIONS.findIndex((l) => l.id === sv.current));
    menuBg(this, 0x81d4fa, 0x4fc3f7, false);
    this.bar = new TopBar(this);
    const stars = img(this, W - 140, 32, 'star', 0.6).setDepth(901);
    txt(this, W - 110, 32, String(totalStars()), 26, { color: '#ffe14d' }).setOrigin(0, 0.5).setDepth(901);
    void stars;
    button(this, 110, H - 50, 180, 70, 'МЕНЮ', C.orange, () => this.scene.start('Menu'), { size: 26 });
    button(this, W - 130, H - 50, 220, 70, 'МАГАЗИН', C.purple, () => this.scene.start('Shop', { back: 'Map' }), { size: 26 });
    ensureTasks();
    const tb = button(this, W / 2, H - 50, 240, 70, 'ЗАДАЧИ', C.green, () => this.scene.start('Tasks'), { size: 26 });
    const ready = claimableCount();
    if (ready > 0) {
      const dot = this.add.circle(W / 2 + 108, H - 80, 18, C.red).setStrokeStyle(3, C.brown);
      txt(this, W / 2 + 108, H - 81, String(ready), 20);
      this.tweens.add({ targets: [dot, tb], scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
    }
    this.draw();
    sfx.startMusic('menu');
    this.events.once('shutdown', () => sfx.stopMusic());
  }

  draw(): void {
    this.layer?.destroy();
    const L = LOCATIONS[this.li];
    const ls = loc(L.id);
    const layer = this.add.container(0, 0);
    this.layer = layer;
    // заглавие на локацията
    const g = this.make.graphics({}, false);
    roundRect(g, W / 2 - 300, 78, 600, 76, 26, L.floorB, C.brown, 5);
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(W / 2 - 290, 84, 580, 18, 9);
    layer.add(g);
    layer.add(txt(this, W / 2, 106, `${this.li + 1}. ${L.name}`, 32, { add: false }));
    layer.add(txt(this, W / 2, 138, L.desc, 17, { color: '#fff8e1', add: false }));
    if (this.li > 0) layer.add(button(this, W / 2 - 360, 116, 70, 70, '<', C.blue, () => { this.li--; this.draw(); }, { size: 40 }));
    if (this.li < LOCATIONS.length - 1) layer.add(button(this, W / 2 + 360, 116, 70, 70, '>', C.blue, () => { this.li++; this.draw(); }, { size: 40 }));

    if (!ls.unlocked || !L.ready) {
      this.lockedView(layer);
      return;
    }
    S().current = L.id;
    save();
    // пътека с нивата
    const pos = (i: number) => {
      const row = Math.floor(i / 10), col = i % 10;
      const x = 150 + (row % 2 === 0 ? col : 9 - col) * 109;
      const y = 270 + row * 200 + Math.sin(col * 1.1) * 18;
      return { x, y };
    };
    const road = this.make.graphics({}, false);
    road.lineStyle(26, 0x000000, 0.12);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < L.levels; i++) { const p = pos(i); pts.push(new Phaser.Math.Vector2(p.x, p.y)); }
    // завой между двата реда
    const curve = new Phaser.Curves.Spline([...pts.slice(0, 10), new Phaser.Math.Vector2(1230, 370), ...pts.slice(10)]);
    curve.draw(road, 200);
    road.lineStyle(10, 0xffffff, 0.7);
    curve.draw(road, 200);
    layer.add(road);
    const next = ls.stars.findIndex((s) => s === 0);
    for (let i = 0; i < L.levels; i++) {
      const { x, y } = pos(i);
      const open = i === 0 || ls.stars[i - 1] > 0;
      const st = ls.stars[i];
      const color = !open ? 0x9e9e9e : st === 3 ? 0xffb300 : st > 0 ? C.green : C.red;
      const b = button(this, x, y, 84, 84, open ? String(i + 1) : '', color, () => {
        if (!open) { sfx.nope(); return; }
        this.levelPopup(L.id, i + 1);
      }, { size: 36, icon: open ? undefined : 'lock', iconScale: 0.6 });
      layer.add(b);
      if (open) for (let k = 0; k < 3; k++) {
        const s = mkImg(this, x + (k - 1) * 24, y + 50 + (k === 1 ? 4 : 0), k < st ? 'star' : 'star_empty', 0.4);
        layer.add(s);
      }
      if (i === next && open) {
        this.tweens.add({ targets: b, scale: 1.12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        const hand = mkImg(this, x + 30, y + 20, 'hand', 0.6).setOrigin(0.47, 0.03).setAngle(-30);
        layer.add(hand);
        this.tweens.add({ targets: hand, x: x + 38, y: y + 28, duration: 400, yoyo: true, repeat: -1 });
      }
    }
    this.endlessBar(layer, L.id, L.levels, ls.stars[L.levels - 1] > 0);
  }

  // безкрайните дни след последното ниво
  endlessBar(layer: Phaser.GameObjects.Container, locId: string, levels: number, open: boolean): void {
    const y = 598;
    const best = bestDay(locId);
    const next = Math.max(levels + 1, best + 1);
    const g = this.make.graphics({}, false);
    roundRect(g, W / 2 - 360, y - 30, 720, 60, 22, open ? 0x6a1b9a : 0x9e9e9e, C.brown, 5);
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(W / 2 - 350, y - 25, 700, 12, 6);
    layer.add(g);
    if (!open) {
      layer.add(mkImg(this, W / 2 - 320, y, 'lock', 0.5));
      layer.add(txt(this, W / 2 + 10, y, `БЕЗКРАЙНИ ДНИ — спечели ден ${levels}`, 24, { add: false }));
      return;
    }
    layer.add(txt(this, W / 2 - 336, y - 11, 'БЕЗКРАЙНИ ДНИ', 24, { color: '#ffe14d', add: false }).setOrigin(0, 0.5));
    const rec = best > levels ? `Рекорд: ден ${best}` : 'Още няма рекорд';
    const coins = S().stats.bestDayCoins ?? 0;
    layer.add(txt(this, W / 2 - 336, y + 15, coins > 0 ? `${rec} · най-много за ден: ${fmt(coins)} €` : rec, 16, { color: '#f3e5f5', add: false }).setOrigin(0, 0.5));
    const b = button(this, W / 2 + 240, y, 220, 48, `ДЕН ${next}`, C.green, () => this.levelPopup(locId, next), { size: 26 });
    layer.add(b);
    this.tweens.add({ targets: b, scale: 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  lockedView(layer: Phaser.GameObjects.Container): void {
    const L = LOCATIONS[this.li];
    const ls = loc(L.id);
    const p = panel(this, W / 2, 400, 620, 360, C.cream);
    layer.add(p);
    p.add(mkImg(this, 0, -100, 'lock', 1.8));
    if (!L.ready) {
      p.add(txt(this, 0, 10, 'ОЧАКВАЙ СКОРО!', 40, { color: '#ff7043', add: false }));
      p.add(txt(this, 0, 70, `Тук ще има: ${L.desc.toLowerCase()}`, 22, { color: '#6d4c41', stroke: '#fff', strokeW: 0, wrap: 540, add: false }));
      return;
    }
    const have = totalStars();
    p.add(txt(this, 0, 0, `Нужни: ${L.unlockStars} звезди и ${fmt(L.unlockCost)} €`, 28, { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false }));
    p.add(txt(this, 0, 45, `Имаш: ${have} звезди и ${fmt(S().coins)} €`, 22, { color: '#6d4c41', stroke: '#fff', strokeW: 0, add: false }));
    const can = have >= L.unlockStars && S().coins >= L.unlockCost;
    p.add(button(this, 0, 120, 300, 76, 'ОТКЛЮЧИ', C.green, () => {
      if (!can) { sfx.nope(); return; }
      S().coins -= L.unlockCost;
      ls.unlocked = true;
      save();
      sfx.fanfare();
      sparkles(this, W / 2, 400, 30, 'star', 200, 1000);
      this.bar.refresh();
      this.draw();
    }, { disabled: !can, size: 30 }));
  }

  levelPopup(locId: string, n: number): void {
    const def = levelDef(locId, n);
    const st = dayStars(n, locId);
    const layer = this.add.container(0, 0).setDepth(1000);
    layer.add(dim(this));
    const p = panel(this, W / 2, 390, 560, 470, C.cream, `ДЕН ${n}`, C.red);
    layer.add(p);
    for (let k = 0; k < 3; k++) p.add(mkImg(this, (k - 1) * 80, -150, k < st ? 'star' : 'star_empty', 1));
    const dark = { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false } as const;
    p.add(txt(this, 0, -80, `Цели: ${def.goals[0]} / ${def.goals[1]} / ${def.goals[2]} €`, 26, dark));
    p.add(txt(this, 0, -40, `${def.customers} клиента`, 22, { ...dark, weight: 700 }));
    const menu = ['бургери', ...def.toppings.map((t) => ({ cheese: 'кашкавал', tomato: 'домати', lettuce: 'маруля', onion: 'лук', pickle: 'краставички' }[t])), def.fries ? 'картофки' : '', ...def.drinks.map((d) => ({ cola: 'кола', fanta: 'фанта', sprite: 'спрайт' }[d]))].filter(Boolean);
    p.add(txt(this, 0, 5, `Меню: ${menu.join(', ')}`, 19, { ...dark, weight: 700, wrap: 480 }));
    if (def.challenge) p.add(txt(this, 0, 60, `★ ${def.challenge.text}`, 22, { color: '#8e24aa', stroke: '#fff', strokeW: 0, add: false }));
    p.add(button(this, -130, 160, 200, 76, 'НАЗАД', C.gray, () => layer.destroy(), { size: 28 }));
    p.add(button(this, 110, 160, 240, 76, 'ИГРАЙ', C.green, () => this.scene.start('Game', { loc: locId, n }), { size: 34 }));
    p.setScale(0.5);
    this.tweens.add({ targets: p, scale: 1, duration: 250, ease: 'Back.Out' });
    void shade;
  }
}
