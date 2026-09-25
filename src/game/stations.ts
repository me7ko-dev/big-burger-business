// Кухненските станции: скара, фритюрник, витрина, автомат за напитки, сглобяване, дъска за рязане, кофа.

import Phaser from 'phaser';
import { dishKey, type Dish, type Flavor, type Topping, FLAVOR_NAME, FLAVOR_COLOR } from '../config/game';
import { upValue } from '../data/save';
import { img, mkImg, txt, bounce, shake, floatText, sparkles, roundRect, C } from '../ui/kit';
import { sfx } from '../audio/sfx';
import { buildBurger, burgerHeight, type Layer } from './food';
import type { GameScene } from '../scenes/GameScene';

export interface ReadyItem {
  dish: Dish;
  key: string;
  quality: 'perfect' | 'ok';
  salted: boolean;
  x: number;
  y: number;
  take: () => void;
  ghost: () => Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;
  reserved?: boolean;
}

function bar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, f: number, color: number): void {
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, (h + 4) / 2);
  g.fillStyle(0xffffff, 0.9);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, h / 2);
  if (f > 0) {
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, Math.max(h, w * Math.min(1, f)), h, h / 2);
  }
}

// ======================================================================= СКАРА
type PattyState = 'empty' | 'A' | 'B' | 'done' | 'burnt';
interface PattySlot {
  x: number;
  y: number;
  state: PattyState;
  t: number;
  raw: Phaser.GameObjects.Image;
  cooked: Phaser.GameObjects.Image;
  burnt: Phaser.GameObjects.Image;
  flip: Phaser.GameObjects.Image;
  bar: Phaser.GameObjects.Graphics;
  smokeT: number;
}

export class Grill {
  g: GameScene;
  slots: PattySlot[] = [];
  side: number;
  burnAfter: number;
  tray: Phaser.GameObjects.Image;
  cx: number;

  constructor(g: GameScene, cx: number) {
    this.g = g;
    this.cx = cx;
    this.side = upValue('grill_speed');
    this.burnAfter = 5 + this.side;
    img(g, cx, 468, 'grill', 1).setDepth(40);
    txt(g, cx, 398, 'СКАРА', 17, { color: '#ffe0b2' }).setDepth(41);
    const n = upValue('grill_slots');
    const pos: [number, number][] = n <= 2 ? [[cx - 46, 468], [cx + 46, 468]] : [[cx - 46, 446], [cx + 46, 446], [cx - 46, 500], [cx + 46, 500]];
    for (let i = 0; i < n; i++) {
      const [x, y] = pos[i];
      const s: PattySlot = {
        x, y, state: 'empty', t: 0, smokeT: 0,
        raw: img(g, x, y, 'patty_raw', 0.82).setDepth(42).setVisible(false),
        cooked: img(g, x, y, 'patty_cooked', 0.82).setDepth(43).setVisible(false),
        burnt: img(g, x, y, 'patty_burnt', 0.82).setDepth(44).setVisible(false),
        flip: img(g, x, y - 34, 'flip', 0.8).setDepth(46).setVisible(false),
        bar: g.add.graphics().setDepth(45),
      };
      this.slots.push(s);
      g.hot(x, y, 88, n <= 2 ? 90 : 52, {
        tap: () => this.tapSlot(s),
        drag: () => (s.state === 'done' ? { ghost: () => img(g, 0, 0, 'patty_cooked', 0.82), drop: (px, py) => this.dropPatty(s, px, py) } : null),
      });
    }
    this.tray = img(g, cx, 636, 'patty_tray', 1.2).setDepth(40);
    for (let i = 0; i < 3; i++) img(g, cx - 36 + i * 36, 640 - (i % 2) * 6, 'patty_raw', 0.42).setDepth(41).setAngle(i * 8 - 8);
    txt(g, cx, 684, 'КЮФТЕТА', 17, { color: '#ffffff' }).setDepth(41);
    g.hot(cx, 640, 150, 110, { tap: () => this.addPatty() });
  }

  addPatty(): boolean {
    const s = this.slots.find((x) => x.state === 'empty');
    if (!s) {
      shake(this.g, this.tray);
      this.g.hint('Скарата е пълна!', this.cx, 560);
      return false;
    }
    s.state = 'A';
    s.t = 0;
    s.raw.setVisible(true).setAlpha(1);
    s.cooked.setVisible(false);
    s.burnt.setVisible(false).setAlpha(0);
    const b = s.raw.getData('bs') as number;
    s.raw.setScale(b * 0.3);
    this.g.tweens.add({ targets: s.raw, scale: b, duration: 220, ease: 'Back.Out' });
    sfx.sizzleHit();
    bounce(this.g, this.tray, 1.08);
    this.g.stat('pattyPlaced');
    return true;
  }

  tapSlot(s: PattySlot): void {
    switch (s.state) {
      case 'empty':
        this.addPatty();
        break;
      case 'A':
        if (s.t >= this.side * 0.85) this.flip(s);
        else this.g.hint('Още се пече...', s.x, s.y - 40);
        break;
      case 'B':
        this.g.hint('Още малко...', s.x, s.y - 40);
        break;
      case 'done':
        if (this.g.assembly.addLayer('patty')) this.clear(s);
        break;
      case 'burnt':
        this.g.trashFx(s.x, s.y, 'patty_burnt');
        this.clear(s);
        break;
    }
  }

  flip(s: PattySlot): void {
    s.state = 'B';
    s.t = 0;
    sfx.flip();
    const b = s.raw.getData('bs') as number;
    this.g.tweens.add({
      targets: [s.raw, s.cooked, s.burnt],
      scaleY: 0.05,
      y: s.y - 26,
      duration: 110,
      yoyo: true,
      onYoyo: () => {
        s.raw.setVisible(false);
        s.cooked.setVisible(true);
        s.burnt.setVisible(true).setAlpha(0);
      },
      onComplete: () => {
        for (const o of [s.raw, s.cooked, s.burnt]) { o.setScale(b); o.y = s.y; }
      },
    });
    s.flip.setVisible(false);
    this.g.stat('flip');
  }

  dropPatty(s: PattySlot, x: number, y: number): boolean {
    const p = this.g.assembly.plateAt(x, y);
    if (p >= 0 && this.g.assembly.addLayer('patty', p)) {
      this.clear(s);
      return true;
    }
    return false;
  }

  clear(s: PattySlot): void {
    s.state = 'empty';
    s.raw.setVisible(false);
    s.cooked.setVisible(false);
    s.burnt.setVisible(false);
    s.flip.setVisible(false);
    s.bar.clear();
  }

  get cooking(): number {
    return this.slots.filter((s) => s.state === 'A' || s.state === 'B' || s.state === 'done').length;
  }

  update(dt: number): void {
    for (const s of this.slots) {
      if (s.state === 'empty' || s.state === 'burnt') { s.bar.clear(); continue; }
      s.t += dt;
      s.bar.clear();
      if (s.state === 'A') {
        const f = s.t / this.side;
        bar(s.bar, s.x, s.y + 24, 70, 8, f, 0xffb300);
        if (f >= 1 && !s.flip.visible) {
          s.flip.setVisible(true);
          const b = s.flip.getData('bs') as number;
          this.g.tweens.add({ targets: s.flip, scale: { from: b * 0.6, to: b }, duration: 250, ease: 'Back.Out' });
          sfx.pop();
        }
        if (s.flip.visible) s.flip.y = s.y - 34 + Math.sin(this.g.time.now / 120) * 4;
        if (s.t > this.side) {
          const burn = (s.t - this.side) / this.burnAfter;
          s.burnt.setVisible(true).setAlpha(Math.min(1, burn * 0.8));
          if (burn >= 1) this.burn(s);
        }
      } else if (s.state === 'B') {
        const f = s.t / this.side;
        bar(s.bar, s.x, s.y + 24, 70, 8, f, 0x43a047);
        if (f >= 1) {
          s.state = 'done';
          s.t = 0;
          sfx.ding();
          sparkles(this.g, s.x, s.y, 6, 'spark', 40);
          this.g.stat('pattyCooked');
        }
      } else if (s.state === 'done') {
        const f = s.t / this.burnAfter;
        bar(s.bar, s.x, s.y + 24, 70, 8, 1 - f, f > 0.6 ? 0xe53935 : 0x43a047);
        s.burnt.setAlpha(Math.max(0, (f - 0.3) * 1.2));
        if (f >= 1) this.burn(s);
      }
      s.smokeT -= dt;
      if (s.smokeT <= 0) {
        s.smokeT = 0.25 + Math.random() * 0.3;
        const dark = s.burnt.alpha > 0.4;
        const p = img(this.g, s.x + Phaser.Math.Between(-30, 30), s.y - 6, 'smoke', 0.35).setDepth(47).setAlpha(0.5);
        if (!dark) p.setTint(0xffffff);
        this.g.tweens.add({ targets: p, y: p.y - 40, alpha: 0, scale: p.scale * 1.8, duration: 800, onComplete: () => p.destroy() });
      }
    }
  }

  burn(s: PattySlot): void {
    s.state = 'burnt';
    s.burnt.setVisible(true).setAlpha(1);
    s.flip.setVisible(false);
    s.bar.clear();
    sfx.fail();
    floatText(this.g, s.x, s.y - 30, 'ИЗГОРЯ!', '#ff5252', 24);
    this.g.stat('burnt');
  }

  // за персонала
  autoTick(level: number): void {
    for (const s of this.slots) {
      if (s.state === 'A' && s.t >= this.side) this.flip(s);
      if (s.state === 'burnt') { this.g.trashFx(s.x, s.y, 'patty_burnt'); this.clear(s); }
      if (level >= 2 && s.state === 'done' && this.g.assembly.canTake('patty')) this.tapSlot(s);
    }
    if (level >= 2) {
      const want = this.g.demand('burger') - this.g.assembly.pattiesOnPlates() - this.cooking;
      if (want > 0 && this.slots.some((s) => s.state === 'empty')) this.addPatty();
    }
  }
}

// ======================================================================= ФРИТЮРНИК
interface Basket {
  x: number;
  y: number;
  state: 'up' | 'cook';
  t: number;
  basket: Phaser.GameObjects.Image;
  fries: Record<'pale' | 'golden' | 'brown' | 'burnt', Phaser.GameObjects.Image>;
  bar: Phaser.GameObjects.Graphics;
  bubbleT: number;
}

export class Fryer {
  g: GameScene;
  baskets: Basket[] = [];
  T: number;
  G: number;
  B = 2.4;
  sack: Phaser.GameObjects.Image;
  cx: number;

  constructor(g: GameScene, cx: number) {
    this.g = g;
    this.cx = cx;
    this.T = upValue('fryer_speed');
    this.G = upValue('fryer_safe');
    img(g, cx, 470, 'fryer', 1).setDepth(40);
    txt(g, cx + 20, 518, 'ФРИТЮРНИК', 17, { color: '#eceff1' }).setDepth(41);
    const n = upValue('fryer_baskets');
    const sp = n === 1 ? 0 : n === 2 ? 110 : 76;
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * sp;
      const y = 452;
      const fr = (k: string) => img(g, x - 4, y - 6, 'fries_' + k, 0.7).setDepth(43).setVisible(false);
      const b: Basket = {
        x, y, state: 'up', t: 0, bubbleT: 0,
        fries: { pale: fr('pale'), golden: fr('golden'), brown: fr('brown'), burnt: fr('burnt') },
        basket: img(g, x, y, 'basket', n === 3 ? 0.66 : 0.8).setDepth(44),
        bar: g.add.graphics().setDepth(46),
      };
      this.baskets.push(b);
      g.hot(x, y - 10, n === 3 ? 76 : 100, 100, { tap: () => this.tapBasket(b) });
    }
    this.sack = img(g, cx - 110, 640, 'sack', 0.92).setDepth(40);
    g.hot(cx - 110, 640, 96, 100, { tap: () => this.load() });
  }

  load(): boolean {
    const b = this.baskets.find((x) => x.state === 'up');
    if (!b) {
      shake(this.g, this.sack);
      this.g.hint('Всички кошници са заети!', this.cx, 570);
      return false;
    }
    b.state = 'cook';
    b.t = 0;
    b.fries.pale.setVisible(true).setAlpha(1);
    for (const k of ['golden', 'brown', 'burnt'] as const) b.fries[k].setVisible(true).setAlpha(0);
    // картофките летят от чувала
    const fly = img(this.g, this.sack.x, this.sack.y - 30, 'potato_sticks', 0.6).setDepth(60);
    this.g.tweens.add({ targets: fly, x: b.x, y: b.y - 20, duration: 260, ease: 'Quad.Out', onComplete: () => fly.destroy() });
    this.g.tweens.add({ targets: [b.basket, ...Object.values(b.fries)], y: '+=22', duration: 300, delay: 230, ease: 'Quad.In' });
    this.g.time.delayedCall(420, () => sfx.splash());
    bounce(this.g, this.sack, 1.08);
    return true;
  }

  quality(b: Basket): 'raw' | 'perfect' | 'ok' | 'burnt' {
    if (b.t < this.T * 0.8) return 'raw';
    if (b.t < this.T) return 'ok';
    if (b.t < this.T + this.G) return 'perfect';
    if (b.t < this.T + this.G + this.B) return 'ok';
    return 'burnt';
  }

  tapBasket(b: Basket): void {
    if (b.state === 'up') { this.load(); return; }
    const q = this.quality(b);
    if (q === 'raw') { this.g.hint('Още са сурови!', b.x, b.y - 60); return; }
    if (q === 'burnt') {
      this.lift(b);
      this.g.trashFx(b.x, b.y - 30, 'fries_burnt');
      return;
    }
    const free = this.g.warmer.free;
    if (free <= 0) {
      this.g.hint('Витрината е пълна!', this.g.warmer.cx, 600);
      shake(this.g, b.basket);
      return;
    }
    this.lift(b);
    this.g.warmer.add(q, b.x, b.y - 30);
    if (q === 'perfect') {
      floatText(this.g, b.x, b.y - 60, 'ЗЛАТИСТИ!', '#ffe14d', 26);
      this.g.stat('perfectFries', this.g.warmer.batch);
    }
  }

  lift(b: Basket): void {
    b.state = 'up';
    this.g.tweens.add({ targets: [b.basket, ...Object.values(b.fries)], y: '-=22', duration: 200, ease: 'Quad.Out', onComplete: () => {
      for (const f of Object.values(b.fries)) f.setVisible(false);
      b.basket.y = b.y;
    } });
    b.bar.clear();
    sfx.whoosh();
  }

  get cooking(): number {
    return this.baskets.filter((b) => b.state === 'cook').length;
  }

  update(dt: number): void {
    for (const b of this.baskets) {
      b.bar.clear();
      if (b.state !== 'cook') continue;
      b.t += dt;
      const T = this.T, G = this.G, B = this.B;
      b.fries.golden.setAlpha(Math.min(1, b.t / T));
      b.fries.pale.setAlpha(1 - Math.min(1, b.t / T));
      b.fries.brown.setAlpha(Phaser.Math.Clamp((b.t - T - G) / B, 0, 1));
      b.fries.burnt.setAlpha(Phaser.Math.Clamp((b.t - T - G - B) / 1.2, 0, 1));
      // лента със зони: сиво (сурови) → зелено (перфектни) → оранжево → червено
      const total = T + G + B + 1.2;
      const w = 90, x0 = b.x - w / 2, y = b.y - 66;
      const g = b.bar;
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(x0 - 3, y - 3, w + 6, 16, 8);
      const seg = (from: number, to: number, col: number) => {
        g.fillStyle(col, 1);
        g.fillRect(x0 + (from / total) * w, y, ((to - from) / total) * w, 10);
      };
      seg(0, T * 0.8, 0xbdbdbd);
      seg(T * 0.8, T, 0xffe082);
      seg(T, T + G, 0x43a047);
      seg(T + G, T + G + B, 0xff9800);
      seg(T + G + B, total, 0xe53935);
      const px = x0 + Math.min(1, b.t / total) * w;
      g.fillStyle(0xffffff, 1);
      g.lineStyle(2.5, C.brown, 1);
      g.fillTriangle(px - 7, y - 8, px + 7, y - 8, px, y + 3);
      g.strokeTriangle(px - 7, y - 8, px + 7, y - 8, px, y + 3);
      b.bubbleT -= dt;
      if (b.bubbleT <= 0) {
        b.bubbleT = 0.08;
        const d = img(this.g, b.x + Phaser.Math.Between(-40, 40), b.y + 8, 'dot', 0.5 + Math.random() * 0.4).setDepth(45).setTint(0xffe082).setAlpha(0.8);
        this.g.tweens.add({ targets: d, y: d.y - 12, alpha: 0, duration: 400, onComplete: () => d.destroy() });
      }
      if (b.t > T + G + B && b.t - dt <= T + G + B) { sfx.fail(); floatText(this.g, b.x, b.y - 80, 'ГОРЯТ!', '#ff5252', 24); }
      if (b.t > T + G + B + 3) {
        this.lift(b);
        this.g.trashFx(b.x, b.y - 30, 'fries_burnt');
        this.g.stat('burnt');
      }
    }
  }

  autoTick(level: number): void {
    for (const b of this.baskets) {
      if (b.state !== 'cook') continue;
      const q = this.quality(b);
      if (q === 'burnt' || (q === 'perfect' && b.t >= this.T + 0.3 && this.g.warmer.free > 0)) this.tapBasket(b);
    }
    if (level >= 2) {
      const have = this.g.warmer.count + this.cooking * this.g.warmer.batch;
      if (this.g.demand('fries') > have) this.load();
    }
  }
}

// ======================================================================= ВИТРИНА ЗА КАРТОФКИ
interface Box { q: 'perfect' | 'ok'; salted: boolean; img: Phaser.GameObjects.Image; salt: Phaser.GameObjects.Image }

export class Warmer {
  g: GameScene;
  cap: number;
  batch: number;
  boxes: Box[] = [];
  cx: number;
  y = 648;
  shaker: Phaser.GameObjects.Image;
  base: Phaser.GameObjects.Image;

  constructor(g: GameScene, cx: number, saltX: number) {
    this.g = g;
    this.cx = cx;
    this.cap = upValue('warmer');
    this.batch = this.cap;
    this.base = img(g, cx, this.y + 26, 'warmer', 0.78).setDepth(40);
    this.shaker = img(g, saltX, 640, 'salt', 1).setDepth(41);
    g.hot(cx, this.y, 190, 110, {
      tap: () => this.serveOne(),
      drag: () => {
        const it = this.items()[0];
        return it ? { ghost: it.ghost, drop: (x, y) => this.g.dropServe(it, x, y) } : null;
      },
    });
    g.hot(saltX, 640, 60, 100, { tap: () => this.salt() });
  }

  get free(): number {
    return this.cap - this.boxes.length;
  }
  get count(): number {
    return this.boxes.length;
  }

  slotX(i: number): number {
    const sp = Math.min(40, 170 / this.cap);
    return this.cx + (i - (this.cap - 1) / 2) * sp;
  }

  add(q: 'perfect' | 'ok', fx: number, fy: number): void {
    const n = Math.min(this.batch, this.free);
    for (let k = 0; k < n; k++) {
      const i = this.boxes.length;
      const b: Box = {
        q, salted: false,
        img: img(this.g, fx, fy, 'fries_box', 0.62).setDepth(42 + i),
        salt: img(this.g, this.slotX(i), this.y - 28, 'salted', 0.8).setDepth(50).setVisible(false),
      };
      this.boxes.push(b);
      this.g.tweens.add({ targets: b.img, x: this.slotX(i), y: this.y, duration: 300, delay: k * 70, ease: 'Back.Out' });
    }
    this.g.time.delayedCall(250, () => sfx.place());
  }

  layout(): void {
    this.boxes.forEach((b, i) => {
      this.g.tweens.add({ targets: b.img, x: this.slotX(i), duration: 150 });
      b.salt.x = this.slotX(i);
      b.img.setDepth(42 + i);
    });
  }

  salt(): void {
    const un = this.boxes.filter((b) => !b.salted);
    const s = this.shaker;
    this.g.tweens.add({ targets: s, angle: { from: -30, to: 30 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => s.setAngle(0) });
    if (!un.length) {
      this.g.hint(this.boxes.length ? 'Вече са солени' : 'Няма картофки за солене', s.x, s.y - 60);
      return;
    }
    sfx.salt();
    for (const b of un) {
      b.salted = true;
      b.salt.setVisible(true).setAlpha(0);
      this.g.tweens.add({ targets: b.salt, alpha: 1, duration: 300 });
      for (let k = 0; k < 5; k++) {
        const d = img(this.g, b.img.x + Phaser.Math.Between(-14, 14), b.img.y - 60, 'dot', 0.35).setDepth(60);
        this.g.tweens.add({ targets: d, y: b.img.y - 22, duration: 250 + k * 40, onComplete: () => d.destroy() });
      }
    }
    this.g.stat('salted', un.length);
  }

  items(): ReadyItem[] {
    // първо перфектните и солените
    const order = [...this.boxes].sort((a, b) => Number(b.q === 'perfect') + Number(b.salted) - (Number(a.q === 'perfect') + Number(a.salted)));
    return order.map((b) => ({
      dish: { kind: 'fries' },
      key: 'fries',
      quality: b.q,
      salted: b.salted,
      x: b.img.x,
      y: b.img.y,
      take: () => this.remove(b),
      ghost: () => img(this.g, 0, 0, 'fries_box', 0.62),
    }));
  }

  remove(b: Box): void {
    const i = this.boxes.indexOf(b);
    if (i < 0) return;
    this.boxes.splice(i, 1);
    b.img.destroy();
    b.salt.destroy();
    this.layout();
  }

  serveOne(): void {
    const it = this.items()[0];
    if (!it) {
      this.g.hint('Първо изпържи картофки', this.cx, 600);
      return;
    }
    this.g.serve(it);
  }
}

// ======================================================================= НАПИТКИ
interface Nozzle {
  flavor: Flavor;
  x: number;
  locked: boolean;
  state: 'empty' | 'fill' | 'ready';
  fill: number;
  holding: boolean;
  auto: boolean;
  cup: Phaser.GameObjects.Image;
  liq: Phaser.GameObjects.Image;
  lid: Phaser.GameObjects.Image;
  stream: Phaser.GameObjects.Rectangle;
  q: 'perfect' | 'ok';
}

interface TrayCup { flavor: Flavor; q: 'perfect' | 'ok'; img: Phaser.GameObjects.Image }

export class Soda {
  g: GameScene;
  nozzles: Nozzle[] = [];
  tray: (TrayCup | null)[] = [null, null, null];
  fillTime: number;
  autoMachine: boolean;
  cupY = 574;
  trayY = 676;
  cx: number;

  constructor(g: GameScene, cx: number, flavors: Flavor[], unlocked: Flavor[]) {
    this.g = g;
    this.cx = cx;
    this.fillTime = upValue('soda_speed');
    this.autoMachine = upValue('soda_auto') > 0;
    img(g, cx, 500, 'soda_machine', 0.88).setDepth(40);
    const tray = g.add.graphics().setDepth(40);
    roundRect(tray, cx - 110, this.trayY - 44, 220, 72, 14, 0xcfd8dc, C.brown, 3);
    txt(g, cx, this.trayY + 18, 'ГОТОВИ НАПИТКИ', 13, { color: '#546e7a', stroke: '#ffffff', strokeW: 3 }).setDepth(41);
    flavors.forEach((f, i) => {
      const x = cx + (i - 1) * 70;
      const locked = !unlocked.includes(f);
      const lbl = g.add.graphics().setDepth(41);
      roundRect(lbl, x - 31, 424, 62, 34, 10, locked ? 0x9e9e9e : FLAVOR_COLOR[f], C.brown, 3);
      txt(g, x, 441, FLAVOR_NAME[f].toUpperCase(), 13).setDepth(42);
      img(g, x, 488, 'nozzle', 0.9).setDepth(42);
      const n: Nozzle = {
        flavor: f, x, locked, state: 'empty', fill: 0, holding: false, auto: false, q: 'ok',
        cup: img(g, x, this.cupY, 'cup_empty', 0.72).setOrigin(0.5, 1).setDepth(44).setVisible(false),
        liq: img(g, x, this.cupY - 3, 'liq_' + f, 0.72).setOrigin(0.5, 1).setDepth(43).setVisible(false),
        lid: img(g, x, this.cupY, 'drink_' + f, 0.72).setOrigin(0.5, 1).setDepth(45).setVisible(false),
        stream: g.add.rectangle(x, 500, 7, 60, 0x000000).setOrigin(0.5, 0).setDepth(43).setVisible(false),
      };
      n.stream.setFillStyle(Phaser.Display.Color.HexStringToColor(f === 'cola' ? '#5a2a0c' : f === 'fanta' ? '#ff8a1c' : '#b9ee7a').color);
      if (locked) img(g, x, 540, 'lock', 0.7).setDepth(45);
      this.nozzles.push(n);
      g.hot(x, 530, 68, 120, {
        hold: {
          start: () => this.holdStart(n),
          end: () => this.holdEnd(n),
        },
        tap: () => this.tapNozzle(n),
        drag: () => (n.state === 'ready' ? { ghost: () => img(g, 0, 0, 'drink_' + n.flavor, 0.72), drop: (px, py) => this.g.dropServe(this.nozzleItem(n), px, py) } : null),
      });
    });
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * 70;
      g.hot(x, this.trayY - 10, 68, 80, {
        tap: () => { const t = this.tray[i]; if (t) this.g.serve(this.trayItem(i)); },
        drag: () => (this.tray[i] ? { ghost: () => img(g, 0, 0, 'drink_' + this.tray[i]!.flavor, 0.72), drop: (px, py) => this.g.dropServe(this.trayItem(i), px, py) } : null),
      });
    }
  }

  holdStart(n: Nozzle): boolean {
    if (n.locked) { this.g.hint('Отключва се на по-късно ниво', n.x, 560); return true; }
    if (n.state === 'ready' || this.autoMachine) return false;
    if (n.state === 'empty') {
      n.state = 'fill';
      n.fill = 0;
      n.cup.setVisible(true).setAlpha(1);
      n.liq.setVisible(true);
      n.lid.setVisible(false);
      sfx.place();
    }
    n.holding = true;
    n.stream.setVisible(true);
    return true;
  }

  holdEnd(n: Nozzle): void {
    if (!n.holding) return;
    n.holding = false;
    n.stream.setVisible(false);
    if (n.fill >= 0.8) this.finish(n);
  }

  tapNozzle(n: Nozzle): void {
    if (n.state === 'ready') { this.g.serve(this.nozzleItem(n)); return; }
    if (this.autoMachine && !n.locked && n.state === 'empty') this.autoFill(n);
  }

  autoFill(n: Nozzle): void {
    n.state = 'fill';
    n.fill = 0;
    n.auto = true;
    n.cup.setVisible(true);
    n.liq.setVisible(true);
    n.lid.setVisible(false);
    n.stream.setVisible(true);
  }

  finish(n: Nozzle): void {
    n.q = n.fill >= 0.86 && n.fill <= 1.0 ? 'perfect' : 'ok';
    n.state = 'ready';
    n.auto = false;
    n.stream.setVisible(false);
    n.lid.setVisible(true);
    n.cup.setVisible(false);
    n.liq.setVisible(false);
    const b = n.lid.getData('bs') as number;
    n.lid.setScale(b * 1.3);
    this.g.tweens.add({ targets: n.lid, scale: b, duration: 200, ease: 'Back.Out' });
    sfx.pop();
    if (n.q === 'perfect') {
      floatText(this.g, n.x, this.cupY - 90, 'ПЕРФЕКТНО!', '#9cff57', 20);
      this.g.stat('perfectDrinks');
    }
    this.g.stat('drinks');
    // към подноса, ако има място
    this.g.time.delayedCall(250, () => this.toTray(n));
  }

  toTray(n: Nozzle): void {
    if (n.state !== 'ready') return;
    const i = this.tray.findIndex((t) => t === null);
    if (i < 0) return;
    const x = this.cx + (i - 1) * 70;
    const t: TrayCup = { flavor: n.flavor, q: n.q, img: img(this.g, n.x, this.cupY, 'drink_' + n.flavor, 0.72).setOrigin(0.5, 1).setDepth(46) };
    this.tray[i] = t;
    this.g.tweens.add({ targets: t.img, x, y: this.trayY + 10, duration: 250, ease: 'Quad.Out' });
    this.resetNozzle(n);
  }

  resetNozzle(n: Nozzle): void {
    n.state = 'empty';
    n.fill = 0;
    n.lid.setVisible(false);
    n.cup.setVisible(false);
    n.liq.setVisible(false);
  }

  nozzleItem(n: Nozzle): ReadyItem {
    return {
      dish: { kind: 'drink', flavor: n.flavor }, key: 'drink:' + n.flavor, quality: n.q, salted: false,
      x: n.x, y: this.cupY - 30,
      take: () => this.resetNozzle(n),
      ghost: () => img(this.g, 0, 0, 'drink_' + n.flavor, 0.72),
    };
  }

  trayItem(i: number): ReadyItem {
    const t = this.tray[i]!;
    return {
      dish: { kind: 'drink', flavor: t.flavor }, key: 'drink:' + t.flavor, quality: t.q, salted: false,
      x: t.img.x, y: t.img.y - 30,
      take: () => { t.img.destroy(); this.tray[i] = null; this.pull(); },
      ghost: () => img(this.g, 0, 0, 'drink_' + t.flavor, 0.72),
    };
  }

  pull(): void {
    for (const n of this.nozzles) if (n.state === 'ready') this.toTray(n);
  }

  items(): ReadyItem[] {
    const out: ReadyItem[] = [];
    this.tray.forEach((t, i) => { if (t) out.push(this.trayItem(i)); });
    for (const n of this.nozzles) if (n.state === 'ready') out.push(this.nozzleItem(n));
    return out;
  }

  get pouring(): boolean {
    return this.nozzles.some((n) => n.stream.visible);
  }

  update(dt: number): void {
    for (const n of this.nozzles) {
      if (n.state !== 'fill') continue;
      if (n.holding || n.auto) {
        n.fill += dt / this.fillTime;
        if (n.auto && n.fill >= 0.95) { n.fill = 0.95; this.finish(n); continue; }
      }
      const f = Math.min(1, n.fill);
      const fr = n.liq.frame;
      const h = fr.height * f;
      n.liq.setCrop(0, fr.height - h, fr.width, h);
      const surface = this.cupY - 3 - 66 * 0.72 * f;
      n.stream.height = Math.max(0, surface - 500);
      if (n.fill > 1.08) this.spill(n);
    }
  }

  spill(n: Nozzle): void {
    n.holding = false;
    n.stream.setVisible(false);
    sfx.splash();
    this.g.vibe(80);
    floatText(this.g, n.x, this.cupY - 100, 'ПРЕЛЯ!', '#ff5252', 22);
    const p = img(this.g, n.x, this.cupY + 4, 'puddle', 0.7).setDepth(42).setAlpha(0.9).setTint(FLAVOR_COLOR[n.flavor]);
    this.g.tweens.add({ targets: p, alpha: 0, delay: 900, duration: 600, onComplete: () => p.destroy() });
    this.g.tweens.add({ targets: [n.cup, n.liq], alpha: 0, duration: 300, onComplete: () => { this.resetNozzle(n); n.cup.setAlpha(1); n.liq.setAlpha(1); } });
    n.state = 'empty';
    this.g.stat('spilled');
  }

  autoTick(level: number): void {
    for (const n of this.nozzles) {
      if (n.locked || n.state !== 'empty') continue;
      const want = this.g.demand('drink:' + n.flavor) - this.count(n.flavor);
      if (want > 0) this.autoFill(n);
      if (level < 2) break; // ниво 1: една чаша наведнъж
    }
  }

  count(f: Flavor): number {
    return this.tray.filter((t) => t && t.flavor === f).length + this.nozzles.filter((n) => n.flavor === f && n.state !== 'empty').length;
  }
}

// ======================================================================= СГЛОБЯВАНЕ НА БУРГЕРИ
interface Plate {
  x: number;
  y: number;
  layers: Layer[];
  closed: boolean;
  c: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Image;
}

const BIN_ICON: Record<string, string> = { bun_top: 'bun_top', cheese: 'cheese', lettuce: 'lettuce_layer', tomato: 'tomato_slices', onion: 'onion_layer', pickle: 'pickle_layer' };

export class Assembly {
  g: GameScene;
  plates: Plate[] = [];
  tomatoes = 0;
  tomatoTxt?: Phaser.GameObjects.Text;
  bins: Record<string, Phaser.GameObjects.Container> = {};
  allowed: Topping[];
  scale: number;

  constructor(g: GameScene, x0: number, x1: number, allowed: Topping[], shown: Topping[]) {
    this.g = g;
    this.allowed = allowed;
    const n = upValue('plates');
    this.scale = n <= 2 ? 1 : n === 3 ? 0.9 : 0.76;
    const cx = (x0 + x1) / 2;
    const w = x1 - x0;
    const bins = ['bun_top', ...shown];
    bins.forEach((k, i) => {
      const x = x0 + (w / bins.length) * (i + 0.5);
      const locked = k !== 'bun_top' && !allowed.includes(k as Topping);
      const c = g.add.container(x, 452).setDepth(40);
      const bg = mkImg(g, 0, 8, k === 'bun_top' ? 'bun_bag' : 'bin', 0.78);
      c.add(bg);
      const icon = mkImg(g, 0, k === 'bun_top' ? -6 : 0, BIN_ICON[k], k === 'tomato' ? 0.72 : 0.6);
      c.add(icon);
      if (locked) { icon.setAlpha(0.3); c.add(mkImg(g, 0, 4, 'lock', 0.6)); }
      const label = k === 'bun_top' ? 'ПИТКИ' : { cheese: 'СИРЕНЕ', tomato: 'ДОМАТИ', lettuce: 'МАРУЛЯ', onion: 'ЛУК', pickle: 'КРАСТАВ.' }[k as Topping];
      c.add(txt(g, 0, 40, label, 14, { add: false }));
      if (k === 'tomato') {
        this.tomatoTxt = txt(g, 30, -18, '0', 20, { color: '#ffe14d', add: false });
        c.add(this.tomatoTxt);
      }
      this.bins[k] = c;
      g.hot(x, 456, Math.min(90, w / bins.length), 96, {
        tap: () => {
          if (locked) { this.g.hint('Отключва се на по-късно ниво', x, 400); return; }
          if (k === 'bun_top') this.closeFirst();
          else this.addLayer(k as Topping);
        },
        drag: () => {
          if (locked || k === 'bun_top') return null;
          if (k === 'tomato' && this.tomatoes <= 0) return null;
          return { ghost: () => img(g, 0, 0, BIN_ICON[k], 0.6), drop: (px, py) => { const p = this.plateAt(px, py); return p >= 0 && this.addLayer(k as Topping, p); } };
        },
      });
    });
    const sp = n <= 2 ? 160 : n === 3 ? 118 : 88;
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * sp;
      const y = 668;
      const plate = img(g, x, y + 4, 'plate', this.scale).setDepth(40);
      const c = g.add.container(x, y).setDepth(41);
      const p: Plate = { x, y, layers: [], closed: false, c, plate };
      this.plates.push(p);
      this.freshBun(p, 0);
      g.hot(x, y - 40, sp - 6, 130, {
        tap: () => this.tapPlate(p),
        drag: () => (p.closed ? { ghost: () => buildBurger(g, p.layers, true, this.scale * 0.9, g.add.container(0, 0)), drop: (px, py) => this.g.dropServe(this.item(p), px, py) } : null),
      });
    }
    this.updateTomatoes();
  }

  freshBun(p: Plate, delay = 250): void {
    p.layers = [];
    p.closed = false;
    p.c.removeAll(true);
    this.g.time.delayedCall(delay, () => {
      buildBurger(this.g, p.layers, false, this.scale, p.c);
      p.c.setScale(0.3);
      this.g.tweens.add({ targets: p.c, scale: 1, duration: 200, ease: 'Back.Out' });
    });
  }

  redraw(p: Plate): void {
    buildBurger(this.g, p.layers, p.closed, this.scale, p.c);
  }

  plateAt(x: number, y: number): number {
    return this.plates.findIndex((p) => Math.abs(p.x - x) < 70 * this.scale + 10 && y > p.y - 140 && y < p.y + 40);
  }

  private target(kind: Layer): Plate | undefined {
    const open = this.plates.filter((p) => !p.closed && !p.layers.includes(kind));
    if (kind === 'patty') return open[0];
    // първо чиния с кюфте, на която липсва тази съставка — и то такава, чиято поръчка я иска
    const withPatty = open.filter((p) => p.layers.includes('patty'));
    const wanted = withPatty.find((p) => this.g.burgerWants(p.layers, kind));
    return wanted ?? withPatty[0] ?? open[0];
  }

  canTake(kind: Layer): boolean {
    return !!this.target(kind);
  }

  pattiesOnPlates(): number {
    return this.plates.filter((p) => p.layers.includes('patty')).length;
  }

  addLayer(kind: Layer, plateIdx?: number): boolean {
    const p = plateIdx !== undefined ? this.plates[plateIdx] : this.target(kind);
    if (!p || p.closed) {
      this.g.hint(kind === 'patty' ? 'Няма свободна чиния!' : 'Няма отворен бургер', 972, 560);
      return false;
    }
    if (p.layers.includes(kind)) { this.g.hint('Вече има!', p.x, p.y - 100); return false; }
    if (kind === 'tomato') {
      if (this.tomatoes <= 0) {
        this.g.hint('Първо нарежи домат!', 1212, 480);
        this.g.pointAtPrep();
        return false;
      }
      this.tomatoes--;
      this.updateTomatoes();
    }
    p.layers.push(kind);
    this.redraw(p);
    const top = p.c.list[p.c.list.length - 1] as Phaser.GameObjects.Image;
    const ty = top.y;
    top.y -= 40;
    top.setAlpha(0);
    this.g.tweens.add({ targets: top, y: ty, alpha: 1, duration: 160, ease: 'Quad.In' });
    sfx.place();
    return true;
  }

  closeFirst(): void {
    const p = this.plates.find((x) => !x.closed && x.layers.includes('patty'));
    if (!p) {
      this.g.hint('Първо сложи кюфте!', this.bins.bun_top.x, 400);
      return;
    }
    this.close(p);
  }

  close(p: Plate): void {
    p.closed = true;
    this.redraw(p);
    const top = p.c.list[p.c.list.length - 1] as Phaser.GameObjects.Image;
    const ty = top.y;
    top.y -= 60;
    this.g.tweens.add({ targets: top, y: ty, duration: 180, ease: 'Bounce.Out' });
    sfx.pop();
    sparkles(this.g, p.x, p.y - 50, 5, 'spark', 50);
    this.g.stat('burgers');
  }

  tapPlate(p: Plate): void {
    if (p.closed) { this.g.serve(this.item(p)); return; }
    if (p.layers.includes('patty')) { this.close(p); return; }
    this.g.hint('Сложи кюфте от скарата', p.x, p.y - 90);
  }

  dish(p: Plate): Dish {
    return { kind: 'burger', top: p.layers.filter((l) => l !== 'patty') as Topping[] };
  }

  item(p: Plate): ReadyItem {
    const d = this.dish(p);
    return {
      dish: d, key: dishKey(d), quality: 'perfect', salted: false,
      x: p.x, y: p.y - 50,
      take: () => this.freshBun(p),
      ghost: () => buildBurger(this.g, p.layers, true, this.scale * 0.9, this.g.add.container(0, 0)),
    };
  }

  items(): ReadyItem[] {
    return this.plates.filter((p) => p.closed).map((p) => this.item(p));
  }

  addTomatoes(n: number): void {
    this.tomatoes = Math.min(12, this.tomatoes + n);
    this.updateTomatoes();
    if (this.bins.tomato) bounce(this.g, this.bins.tomato, 1.1);
  }

  updateTomatoes(): void {
    this.tomatoTxt?.setText(String(this.tomatoes));
    this.tomatoTxt?.setColor(this.tomatoes > 0 ? '#ffe14d' : '#ff6b6b');
  }

  plateHeight(p: Plate): number {
    return burgerHeight(p.layers) * this.scale;
  }

  /** За персонала/помощника: нужно ли още домати. */
  get tomatoLow(): boolean {
    return this.tomatoes < 3;
  }
}

// ======================================================================= ДЪСКА ЗА РЯЗАНЕ
export class Prep {
  g: GameScene;
  cx: number;
  crate: Phaser.GameObjects.Container;
  board: Phaser.GameObjects.Image;
  item: Phaser.GameObjects.Image | null = null;
  cuts = 0;
  need: number;
  knife: Phaser.GameObjects.Image;
  busy = false;
  enabled: boolean;

  constructor(g: GameScene, cx: number, enabled: boolean) {
    this.g = g;
    this.cx = cx;
    this.enabled = enabled;
    this.need = upValue('knife');
    this.crate = g.add.container(cx, 438).setDepth(40);
    this.crate.add(mkImg(g, 0, 6, 'crate', 1));
    for (let i = 0; i < 4; i++) this.crate.add(mkImg(g, -33 + i * 22, -6 - (i % 2) * 5, 'tomato', 0.55));
    this.crate.add(mkImg(g, 0, 6, 'crate', 1).setCrop(0, 48, 220, 64)); // предната дъска закрива долната част на доматите
    this.crate.add(txt(g, 0, 36, 'ДОМАТИ', 14, { add: false }));
    if (!enabled) { this.crate.setAlpha(0.45); this.crate.add(mkImg(g, 0, 0, 'lock', 0.7)); }
    this.board = img(g, cx, 556, 'board', 0.85).setDepth(40);
    this.knife = img(g, cx + 40, 520, 'knife', 0.8).setDepth(52).setAngle(-20);
    g.hot(cx, 438, 116, 90, { tap: () => this.takeTomato() });
    g.hot(cx, 556, 120, 80, { tap: () => this.cut(), swipe: () => this.cut() });
  }

  takeTomato(): boolean {
    if (!this.enabled) { this.g.hint('Отключва се на ниво 4', this.cx, 400); return false; }
    if (this.item) { this.g.hint('Първо нарежи този!', this.cx, 500); return false; }
    this.cuts = 0;
    this.item = img(this.g, this.cx - 20, 440, 'tomato', 0.9).setDepth(50);
    this.g.tweens.add({ targets: this.item, x: this.cx - 10, y: 552, duration: 260, ease: 'Bounce.Out' });
    sfx.place();
    return true;
  }

  cut(): void {
    if (!this.item) {
      if (this.enabled) this.takeTomato();
      return;
    }
    if (this.busy) return;
    this.cuts++;
    sfx.chop();
    this.g.vibe(15);
    this.busy = true;
    this.g.tweens.add({ targets: this.knife, x: this.cx - 10, y: 556, angle: 10, duration: 70, yoyo: true, onComplete: () => { this.busy = false; } });
    for (let k = 0; k < 4; k++) {
      const d = img(this.g, this.cx - 10, 550, 'dot', 0.4).setDepth(55).setTint(0xff5a4d);
      this.g.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-40, 40), y: d.y - Phaser.Math.Between(10, 40), alpha: 0, duration: 350, onComplete: () => d.destroy() });
    }
    bounce(this.g, this.item, 0.9);
    if (this.cuts >= this.need) {
      const it = this.item;
      this.item = null;
      it.setTexture('tomato_slices');
      const target = this.g.assembly.bins.tomato;
      this.g.time.delayedCall(180, () => {
        this.g.tweens.add({
          targets: it,
          x: target ? target.x : this.cx,
          y: target ? target.y : 450,
          scale: (it.getData('bs') as number) * 0.6,
          duration: 380,
          ease: 'Quad.InOut',
          onComplete: () => {
            it.destroy();
            this.g.assembly.addTomatoes(4);
            sfx.pop();
          },
        });
      });
      this.g.stat('tomatoesCut');
    }
  }

  autoTick(): void {
    if (!this.enabled) return;
    if (this.g.assembly.tomatoLow && !this.item) this.takeTomato();
    else if (this.item && !this.busy) this.cut();
  }
}

// ======================================================================= КОФА
export class Trash {
  g: GameScene;
  x: number;
  y: number;
  can: Phaser.GameObjects.Image;
  constructor(g: GameScene, x: number, y: number) {
    this.g = g;
    this.x = x;
    this.y = y;
    this.can = img(g, x, y, 'trash', 0.8).setDepth(40);
    g.hot(x, y, 80, 90, { tap: () => g.hint('Завлечи тук сгрешена храна', x - 60, y - 70) });
  }
  hit(x: number, y: number): boolean {
    return Math.abs(x - this.x) < 55 && Math.abs(y - this.y) < 60;
  }
}
