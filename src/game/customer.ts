// Клиент: влиза, сяда, поръчва, чака (търпение), яде, плаща и си тръгва.

import Phaser from 'phaser';
import { dishKey, type CustType, type Dish } from '../config/game';
import { mkImg, img, txt, roundRect, C, sparkles, floatText } from '../ui/kit';
import { dishIcon } from './food';
import { sfx } from '../audio/sfx';
import type { GameScene, Table } from '../scenes/GameScene';

export const FLOOR_Y = 366;
export const SEAT_Y = 292;
export const DOOR_X = 62;
export const QUEUE_X = [165, 215];

// ширина на бургера в балончето: с един бургер има място за по-едри иконки на съставките
const burgerCellW = (burgers: number) => (burgers === 1 ? 80 : 62);

export type CState = 'walk' | 'queue' | 'toTable' | 'think' | 'order' | 'eat' | 'leave' | 'gone';

export interface OrderLine { dish: Dish; key: string; done: boolean; pending?: boolean; quality: 'perfect' | 'ok'; salted: boolean; icon: Phaser.GameObjects.Container; check?: Phaser.GameObjects.Image }

export class Customer {
  g: GameScene;
  type: CustType;
  c: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  face: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Container;
  bubbleBg: Phaser.GameObjects.Graphics;
  bar: Phaser.GameObjects.Graphics;
  order: OrderLine[] = [];
  state: CState = 'walk';
  table: Table | null = null;
  patienceMax: number;
  patience: number;
  s: number;
  mood = '';
  private bob?: Phaser.Tweens.Tween;
  private bw = 0;
  private bh = 0;
  queueIdx = -1;
  finishFrac = 1;
  arrived = 0;
  badge?: Phaser.GameObjects.Text;

  constructor(g: GameScene, type: CustType, look: number, dishes: Dish[], patience: number) {
    this.g = g;
    this.type = type;
    this.s = 0.85 * type.scale;
    this.patienceMax = patience;
    this.patience = patience;
    this.arrived = g.time.now;
    this.c = g.add.container(DOOR_X, FLOOR_Y).setDepth(15);
    this.body = mkImg(g, 0, 0, `cust_${type.id}_${look}`, this.s).setOrigin(0.5, 1);
    this.face = mkImg(g, 0, -(170 - 49) * this.s, 'face_happy', this.s);
    this.c.add([this.body, this.face]);
    if (type.id === 'vip' || type.id === 'critic') {
      this.badge = txt(g, 0, -178 * this.s, type.id === 'vip' ? 'VIP' : 'КРИТИК', 16, { color: '#ffe14d', add: false });
      this.c.add(this.badge);
    }
    // 'bs' = нормалният размер, за да не остане балончето смачкано, ако подскочи докато се появява
    this.bubble = g.add.container(0, 0).setDepth(300).setVisible(false).setData('bs', 1);
    this.bubbleBg = g.make.graphics({}, false);
    this.bar = g.make.graphics({}, false);
    this.bubble.add([this.bubbleBg, this.bar]);
    const nb = dishes.filter((d) => d.kind === 'burger').length;
    for (const d of dishes) {
      const icon = d.kind === 'burger' ? dishIcon(g, d, 1, burgerCellW(nb) - 6) : dishIcon(g, d, nb ? 0.8 : 1);
      this.bubble.add(icon);
      this.order.push({ dish: d, key: dishKey(d), done: false, quality: 'perfect', salted: false, icon });
    }
    this.layoutBubble();
    this.c.setAlpha(0);
    g.tweens.add({ targets: this.c, alpha: 1, duration: 250 });
    this.setMood('happy');
  }

  get frac(): number {
    return Phaser.Math.Clamp(this.patience / this.patienceMax, 0, 1);
  }

  private bubbleY = 0;

  /** Бургерите са в ред отляво, картофките и напитките — на колонки по две до тях.
   *  Балончето е тясно (да не пречи на съседната маса) и никога не влиза под горната лента. */
  private layoutBubble(): void {
    const burgers = this.order.filter((o) => o.dish.kind === 'burger');
    const sides = this.order.filter((o) => o.dish.kind !== 'burger');
    const hOf = (o: OrderLine) => (o.icon.getData('h') as number) ?? 40;
    const BW = burgerCellW(burgers.length), SW = burgers.length ? 36 : 48, SH = 37;
    const cols = burgers.length ? Math.ceil(sides.length / 2) : sides.length;
    const contentW = burgers.length * BW + cols * SW;
    const contentH = burgers.length
      ? Math.max(...burgers.map(hOf), Math.min(2, sides.length) * SH)
      : Math.max(...sides.map(hOf));
    this.bw = Math.max(90, contentW + 20);
    this.bh = contentH + 34;
    const cy = -this.bh / 2 + 9 + contentH / 2;
    const x0 = -contentW / 2;
    burgers.forEach((o, i) => { o.icon.x = x0 + BW * (i + 0.5); o.icon.y = cy; });
    sides.forEach((o, i) => {
      if (!burgers.length) { o.icon.x = x0 + SW * (i + 0.5); o.icon.y = cy; return; }
      const col = Math.floor(i / 2), inCol = Math.min(2, sides.length - col * 2);
      o.icon.x = x0 + burgers.length * BW + SW * (col + 0.5);
      o.icon.y = inCol === 2 ? cy + (i % 2 === 0 ? -SH / 2 : SH / 2) : cy;
    });
    // над главата; ако няма място — по-ниско (върху косата), с по-къса опашчица
    const want = SEAT_Y - 162 * this.s - this.bh / 2 - 8;
    this.bubbleY = Math.max(62 + this.bh / 2, want);
    const tail = Phaser.Math.Clamp(14 - (this.bubbleY - want), 6, 14);
    const g = this.bubbleBg;
    g.clear();
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(-this.bw / 2 + 3, -this.bh / 2 + 5, this.bw, this.bh, 18);
    roundRect(g, -this.bw / 2, -this.bh / 2, this.bw, this.bh, 18, 0xffffff, C.brown, 3.5);
    g.fillStyle(0xffffff, 1);
    g.lineStyle(3.5, C.brown, 1);
    g.beginPath();
    g.moveTo(-10, this.bh / 2 - 2);
    g.lineTo(0, this.bh / 2 + tail);
    g.lineTo(10, this.bh / 2 - 2);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillRect(-9, this.bh / 2 - 5, 18, 6);
    this.drawBar();
  }

  private lastBarW = -1;

  drawBar(): void {
    const w = this.bw - 28, x = -w / 2, y = this.bh / 2 - 16;
    const px = Math.round(w * this.frac);
    if (px === this.lastBarW) return;
    this.lastBarW = px;
    const g = this.bar;
    g.clear();
    g.fillStyle(0x4a2c17, 0.25);
    g.fillRoundedRect(x, y, w, 9, 4.5);
    const f = this.frac;
    const col = f > 0.55 ? 0x43a047 : f > 0.28 ? 0xffb300 : 0xe53935;
    if (f > 0.01) {
      g.fillStyle(col, 1);
      g.fillRoundedRect(x, y, Math.max(9, w * f), 9, 4.5);
    }
  }

  bubblePos(i: number): { x: number; y: number } {
    const o = this.order[i];
    return { x: this.bubble.x + o.icon.x, y: this.bubble.y + o.icon.y };
  }

  setMood(m: string): void {
    if (m === this.mood) return;
    this.mood = m;
    this.face.setTexture('face_' + m);
  }

  private startBob(): void {
    this.bob?.stop();
    this.body.y = 0;
    this.bob = this.g.tweens.add({ targets: [this.body, this.face], y: '-=5', duration: 170, yoyo: true, repeat: -1 });
  }

  private stopBob(): void {
    this.bob?.stop();
    this.bob = undefined;
    this.body.y = 0;
    this.face.y = -(170 - 49) * this.s;
    if (this.badge) this.badge.y = -178 * this.s;
  }

  walkTo(x: number, then: () => void): void {
    this.startBob();
    this.c.setScale(x < this.c.x ? -1 : 1, 1);
    this.face.setScale(this.face.getData('bs') as number);
    const dist = Math.abs(x - this.c.x);
    this.g.tweens.add({
      targets: this.c,
      x,
      duration: Math.max(200, dist * 3.2),
      onComplete: () => {
        this.c.setScale(1, 1);
        this.stopBob();
        then();
      },
    });
    // лицето и надписът не трябва да са огледални
    if (this.badge) this.badge.setScale(x < this.c.x ? -1 : 1, 1);
  }

  goQueue(idx: number): void {
    this.state = 'queue';
    this.queueIdx = idx;
    this.walkTo(QUEUE_X[idx], () => { /* чака */ });
  }

  goToTable(t: Table): void {
    this.table = t;
    t.cust = this;
    this.queueIdx = -1;
    this.state = 'toTable';
    this.walkTo(t.x, () => {
      this.c.setDepth(11);
      this.startBob();
      this.g.tweens.add({
        targets: this.c,
        y: SEAT_Y,
        duration: 380,
        ease: 'Quad.Out',
        onComplete: () => {
          this.stopBob();
          this.state = 'think';
          const dots = txt(this.g, this.c.x, SEAT_Y - 175 * this.s, '...', 34, { color: '#4a2c17', stroke: '#ffffff' }).setDepth(300);
          this.g.time.delayedCall(700, () => {
            dots.destroy();
            if (this.state !== 'think') return;
            this.showOrder();
          });
        },
      });
    });
  }

  private showOrder(): void {
    this.state = 'order';
    this.bubble.setPosition(this.c.x, this.bubbleY);
    this.bubble.setVisible(true);
    this.bubble.setScale(0.2);
    this.g.tweens.add({ targets: this.bubble, scale: 1, duration: 300, ease: 'Back.Out' });
    sfx.bell();
    this.g.onOrder(this);
  }

  /** Коя позиция от поръчката би приела това ястие. */
  needs(key: string): number {
    return this.order.findIndex((o) => !o.done && !o.pending && o.key === key);
  }

  get remaining(): number {
    return this.order.filter((o) => !o.done).length;
  }

  deliver(i: number, quality: 'perfect' | 'ok', salted: boolean): void {
    const o = this.order[i];
    o.done = true;
    o.quality = quality;
    o.salted = salted;
    o.icon.setAlpha(0.45);
    o.check = mkImg(this.g, o.icon.x + 14, o.icon.y + 12, 'check', 0.55);
    this.bubble.add(o.check);
    this.g.tweens.add({ targets: o.check, scale: { from: 0, to: o.check.scale }, duration: 250, ease: 'Back.Out' });
    this.patience = Math.min(this.patienceMax, this.patience + this.patienceMax * 0.12);
    this.drawBar();
    if (this.remaining === 0) this.startEating();
  }

  private startEating(): void {
    this.state = 'eat';
    const frac = this.frac;
    this.g.onOrderComplete(this, frac);
    this.g.tweens.add({ targets: this.bubble, scale: 0, duration: 200, onComplete: () => this.bubble.setVisible(false) });
    const t = this.table!;
    t.food.removeAll(true);
    this.order.forEach((o, i) => {
      const ic = dishIcon(this.g, o.dish, 0.9);
      ic.setPosition((i - (this.order.length - 1) / 2) * 34, 0);
      t.food.add(ic);
    });
    this.setMood(frac > 0.55 ? 'love' : 'happy');
    this.g.time.delayedCall(350, () => {
      if (this.state !== 'eat') return;
      this.setMood('eat');
      sfx.eat();
    });
    const eatTime = 1800;
    this.g.tweens.add({ targets: this.face, scaleY: this.face.scaleY * 0.9, duration: 180, yoyo: true, repeat: 4, delay: 400 });
    this.g.time.delayedCall(eatTime, () => {
      t.food.removeAll(true);
      this.g.pay(this);
      this.setMood(frac > 0.5 ? 'love' : 'happy');
      if (frac > 0.5) for (let k = 0; k < 3; k++) this.heart(k * 120);
      this.leave(true);
    });
  }

  private heart(delay: number): void {
    const h = img(this.g, this.c.x + Phaser.Math.Between(-20, 20), this.c.y - 150, 'heart', 0.8).setDepth(310).setAlpha(0);
    this.g.tweens.add({ targets: h, alpha: 1, y: h.y - 60, delay, duration: 600, onComplete: () => this.g.tweens.add({ targets: h, alpha: 0, duration: 300, onComplete: () => h.destroy() }) });
  }

  angryLeave(): void {
    if (this.state === 'leave' || this.state === 'gone') return;
    const wasSeated = this.state !== 'queue' && this.state !== 'walk';
    this.setMood('angry');
    sfx.angry();
    floatText(this.g, this.c.x, this.c.y - 180, 'Отивам си!', '#ff5252', 26);
    const puff = img(this.g, this.c.x + 30, this.c.y - 160, 'smoke', 0.8).setTint(0xff5252).setDepth(310);
    this.g.tweens.add({ targets: puff, y: puff.y - 40, alpha: 0, scale: puff.scale * 1.6, duration: 700, onComplete: () => puff.destroy() });
    this.bubble.setVisible(false);
    if (wasSeated && this.table && this.order.some((o) => o.done)) this.table.dirty = true;
    this.g.onLost(this);
    this.leave(false);
  }

  leave(happy: boolean): void {
    const prev = this.state;
    this.state = 'leave';
    this.bubble.setVisible(false);
    const t = this.table;
    const go = () => this.walkTo(DOOR_X, () => {
      this.g.tweens.add({ targets: this.c, alpha: 0, duration: 250, onComplete: () => this.destroy() });
    });
    if (t && prev !== 'queue' && prev !== 'walk') {
      if (happy) t.dirty = true;
      this.g.time.delayedCall(happy ? 250 : 0, () => {
        this.c.setDepth(15);
        this.startBob();
        this.g.tweens.add({
          targets: this.c,
          y: FLOOR_Y,
          duration: 330,
          onComplete: () => {
            this.stopBob();
            t.cust = null;
            this.g.onTableChanged(t);
            go();
          },
        });
      });
    } else {
      if (t) { t.cust = null; this.g.onTableChanged(t); }
      go();
    }
    if (happy) sparkles(this.g, this.c.x, this.c.y - 120, 5, 'spark', 50);
  }

  update(dt: number): void {
    if (this.state === 'order' || this.state === 'queue') {
      const rate = this.state === 'queue' ? 0.6 : 1;
      if (!this.g.patienceFrozen) this.patience -= dt * rate;
      const f = this.frac;
      this.setMood(f > 0.6 ? 'happy' : f > 0.3 ? 'neutral' : f > 0.12 ? 'worried' : 'angry');
      if (this.state === 'order') this.drawBar();
      if (this.patience <= 0) this.angryLeave();
    }
  }

  destroy(): void {
    this.state = 'gone';
    this.bob?.stop();
    this.c.destroy();
    this.bubble.destroy();
    this.g.onGone(this);
  }
}
