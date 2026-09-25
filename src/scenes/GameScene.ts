// Основната сцена: зала с маси и клиенти горе, кухня долу.

import Phaser from 'phaser';
import {
  W, H, CUST_TYPES, LOCATIONS, levelDef, makeOrder, dishPrice, rng, type LevelDef, type Dish, type Flavor, type CustType,
} from '../config/game';
import { S, loc, upValue, save, addStat } from '../data/save';
import { img, mkImg, txt, button, roundRect, C, floatText, sparkles, bounce, fmt, shade } from '../ui/kit';
import { sfx } from '../audio/sfx';
import { Customer, QUEUE_X } from '../game/customer';
import { Grill, Fryer, Warmer, Soda, Assembly, Prep, Trash, type ReadyItem } from '../game/stations';
import { Tutor, type Step } from '../game/tutor';
import type { Layer } from '../game/food';

export interface Table {
  idx: number;
  x: number;
  img: Phaser.GameObjects.Image;
  chair: Phaser.GameObjects.Image;
  dirtyImg: Phaser.GameObjects.Image;
  food: Phaser.GameObjects.Container;
  cust: Customer | null;
  dirty: boolean;
  cleaning: boolean;
}

export interface DragSpec {
  ghost: () => Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;
  drop: (x: number, y: number) => boolean;
}

export interface Handlers {
  tap?: () => void;
  drag?: () => DragSpec | null;
  hold?: { start: () => boolean; end: () => void };
  swipe?: () => void;
}

interface Press {
  h: Handlers;
  zone: Phaser.GameObjects.Zone;
  x0: number;
  y0: number;
  lx: number;
  ly: number;
  acc: number;
  moved: boolean;
  holding: boolean;
  ghost?: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;
  spec?: DragSpec;
}

export interface LevelResult {
  loc: string;
  n: number;
  earned: number;
  tips: number;
  served: number;
  lost: number;
  total: number;
  stars: number;
  prevStars: number;
  goals: [number, number, number];
  challenge?: { text: string; ok: boolean };
  maxCombo: number;
  perfect: number;
}

export const TABLE_X = [290, 474, 658, 842, 1026, 1210];
const TABLE_Y = 300;

type Stats = Record<string, number>;

export class GameScene extends Phaser.Scene {
  level!: LevelDef;
  locId = 'stand';
  tables: Table[] = [];
  customers: Customer[] = [];
  queue: Customer[] = [];
  grill!: Grill;
  fryer!: Fryer;
  warmer!: Warmer;
  soda!: Soda;
  assembly!: Assembly;
  prep!: Prep;
  trash!: Trash;
  tutor?: Tutor;
  stats: Stats = {};
  earned = 0;
  tips = 0;
  combo = 0;
  maxCombo = 0;
  lastComplete = -99999;
  gameT = 0;
  served = 0;
  lost = 0;
  spawnLeft = 0;
  nextSpawn = 2;
  elapsed = 0;
  dayLen = 120;
  running = false;
  ended = false;
  paused = false;
  freezeT = 0;
  tipsBoost = false;
  holdSpawns = false;
  rand!: () => number;
  private presses = new Map<number, Press>();
  private hintCool = 0;
  private staffT = 0;
  // HUD
  private moneyTxt!: Phaser.GameObjects.Text;
  private goalBar!: Phaser.GameObjects.Graphics;
  private goalStars: Phaser.GameObjects.Image[] = [];
  private clockTxt!: Phaser.GameObjects.Text;
  private custTxt!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private freezeBtn?: ReturnType<typeof button>;
  private tipsBtn?: ReturnType<typeof button>;
  private freezeOverlay!: Phaser.GameObjects.Rectangle;
  private coinIcon!: Phaser.GameObjects.Image;
  private shownMoney = 0;
  private lastBarPx = -1;
  private waiter?: Phaser.GameObjects.Container;
  private waiterBusy = false;
  private cleaner?: Phaser.GameObjects.Container;
  private cleanerBusy = false;
  private staffBadges: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('Game');
  }

  init(data: { loc?: string; n?: number }): void {
    this.locId = data.loc ?? S().current;
    this.level = levelDef(this.locId, data.n ?? 1);
    this.tables = [];
    this.customers = [];
    this.queue = [];
    this.stats = {};
    this.earned = 0;
    this.tips = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastComplete = -99999;
    this.gameT = 0;
    this.served = 0;
    this.lost = 0;
    this.spawnLeft = this.level.customers;
    this.nextSpawn = 2.5;
    this.elapsed = 0;
    this.running = false;
    this.ended = false;
    this.paused = false;
    this.freezeT = 0;
    this.tipsBoost = false;
    this.holdSpawns = false;
    this.presses = new Map();
    this.shownMoney = 0;
    this.lastBarPx = -1;
    this.goalStars = [];
    this.staffBadges = [];
    this.waiterBusy = false;
    this.cleanerBusy = false;
    this.tutor = undefined;
    this.rand = rng(Date.now() & 0xffffff);
    const avgGap = (this.level.gap[0] + this.level.gap[1]) / 2;
    this.dayLen = this.level.customers * avgGap + 4;
  }

  create(): void {
    this.input.addPointer(2);
    this.drawRoom();
    this.drawKitchen();
    this.buildStations();
    this.buildHud();
    this.buildStaff();
    this.setupInput();
    this.introBanner();
    sfx.startMusic('game');
    const onHidden = () => this.pause();
    this.game.events.on('hidden', onHidden);
    this.events.on('resume', () => this.resumeGame());
    this.events.once('shutdown', () => {
      this.game.events.off('hidden', onHidden);
      sfx.stopLoops();
      sfx.stopMusic();
    });
  }

  // ================================================================== ЗАЛА
  private drawRoom(): void {
    const L = LOCATIONS.find((l) => l.id === this.locId)!;
    const g = this.add.graphics().setDepth(0);
    // стена
    g.fillStyle(L.wall, 1);
    g.fillRect(0, 0, W, 215);
    for (let x = 0; x < W; x += 64) {
      g.fillStyle(L.wall2, 0.5);
      g.fillRect(x, 52, 32, 163);
    }
    g.fillStyle(shade(L.wall2, -0.2), 1);
    g.fillRect(0, 196, W, 22);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(0, 198, W, 5);
    // под — шахматно
    const tile = 46;
    for (let y = 218, r = 0; y < 380; y += tile / 1.6, r++) {
      for (let x = -tile, c = 0; x < W + tile; x += tile, c++) {
        g.fillStyle((r + c) % 2 ? L.floorA : L.floorB, 1);
        g.fillRect(x + (r % 2) * 0, y, tile, tile / 1.6 + 1);
      }
    }
    g.fillStyle(0x000000, 0.08);
    g.fillRect(0, 218, W, 14);
    img(this, 420, 118, 'window', 0.72).setDepth(1);
    img(this, 1000, 118, 'window', 0.72).setDepth(1);
    img(this, 62, 292, 'door', 0.72).setDepth(2);
    // табела
    const sign = this.add.graphics().setDepth(2);
    roundRect(sign, 560, 70, 200, 56, 16, C.red, C.brown, 4);
    txt(this, 660, 98, L.name.toUpperCase(), L.name.length > 14 ? 16 : 20).setDepth(3);
    // декорации от подобренията
    const pl = upValue('plants', this.locId);
    if (pl > 0) img(this, 138, 372, 'plant', 0.9).setOrigin(0.5, 1).setDepth(16);
    if (pl > 8) img(this, 1262, 372, 'plant', 0.9).setOrigin(0.5, 1).setDepth(16);
    const pc = upValue('pictures', this.locId);
    if (pc > 0) img(this, 240, 120, 'picture', 0.8).setDepth(1);
    if (pc > 8) img(this, 810, 120, 'picture', 0.8).setDepth(1);
    if (upValue('jukebox', this.locId) > 0) img(this, 1180, 200, 'jukebox', 0.85).setOrigin(0.5, 1).setDepth(2);
    if (upValue('neon', this.locId) > 0) {
      const n = img(this, 660, 172, 'neon', 0.62).setDepth(3);
      this.tweens.add({ targets: n, alpha: 0.75, duration: 900, yoyo: true, repeat: -1 });
    }
    // маси
    const nt = upValue('tables', this.locId);
    for (let i = 0; i < nt; i++) {
      const x = TABLE_X[i];
      const t: Table = {
        idx: i,
        x,
        chair: img(this, x, 262, 'chair', 0.8).setDepth(10),
        img: img(this, x, TABLE_Y, 'table', 0.95).setDepth(12),
        dirtyImg: img(this, x, TABLE_Y - 20, 'dirty', 0.8).setDepth(13).setVisible(false),
        food: this.add.container(x, TABLE_Y - 30).setDepth(13),
        cust: null,
        dirty: false,
        cleaning: false,
      };
      this.tables.push(t);
      this.hot(x, TABLE_Y - 10, 170, 120, { tap: () => this.tapTable(t) }, 150);
    }
  }

  private drawKitchen(): void {
    const g = this.add.graphics().setDepth(30);
    // плочки на задната стена
    g.fillStyle(0xeceff1, 1);
    g.fillRect(0, 372, W, H - 372);
    g.lineStyle(2, 0xcfd8dc, 1);
    for (let y = 372; y < H; y += 28) g.lineBetween(0, y, W, y);
    for (let y = 372, r = 0; y < H; y += 28, r++) for (let x = (r % 2) * 28; x < W; x += 56) g.lineBetween(x, y, x, y + 28);
    // плот
    g.fillStyle(0xb0bec5, 1);
    g.fillRect(0, 392, W, H - 392);
    g.fillStyle(0xcfd8dc, 1);
    g.fillRect(0, 392, W, 8);
    for (const x of [252, 566, 800, 1146]) {
      g.fillStyle(0x90a4ae, 1);
      g.fillRect(x - 2, 400, 4, H - 400);
    }
    // тезгях (разделя залата и кухнята)
    g.fillStyle(0x8d5a2b, 1);
    g.fillRect(0, 366, W, 26);
    g.fillStyle(0xa1683a, 1);
    g.fillRect(0, 366, W, 8);
    g.lineStyle(3, C.brown, 1);
    g.lineBetween(0, 366, W, 366);
    g.lineBetween(0, 392, W, 392);
  }

  private buildStations(): void {
    const lv = this.level;
    const flavors: Flavor[] = ['cola', 'fanta', 'sprite'];
    this.soda = new Soda(this, 130, flavors, lv.drinks);
    this.fryer = new Fryer(this, 410);
    if (!lv.fries) this.lockArea(256, 562, 'Картофки — от ниво 2');
    this.warmer = new Warmer(this, 440, 548);
    this.grill = new Grill(this, 685);
    this.assembly = new Assembly(this, 806, 1140, lv.toppings, ['cheese', 'tomato', 'lettuce']);
    this.prep = new Prep(this, 1212, lv.toppings.includes('tomato'));
    this.trash = new Trash(this, 1222, 668);
  }

  private lockArea(x0: number, x1: number, text: string): void {
    const r = this.add.rectangle(x0, 396, x1 - x0, H - 396, 0x37474f, 0.72).setOrigin(0).setDepth(190).setInteractive();
    r.on('pointerdown', () => this.hint(text, (x0 + x1) / 2, 520));
    img(this, (x0 + x1) / 2, 520, 'lock', 1.1).setDepth(191);
    txt(this, (x0 + x1) / 2, 590, text, 20, { wrap: x1 - x0 - 20 }).setDepth(191);
  }

  // ================================================================== ПЕРСОНАЛ
  private buildStaff(): void {
    const badge = (x: number, y: number, key: string) => {
      const b = img(this, x, y, key, 0.42).setOrigin(0.5, 1).setDepth(48);
      this.tweens.add({ targets: b, y: y - 4, duration: 300 + Math.random() * 100, yoyo: true, repeat: -1 });
      this.staffBadges.push(b);
    };
    if (upValue('grill_cook', this.locId) > 0) badge(770, 470, 'staff_cook');
    if (upValue('fry_cook', this.locId) > 0 && this.level.fries) badge(540, 470, 'staff_cook2');
    if (upValue('barista', this.locId) > 0) badge(232, 470, 'staff_barista');
    if (upValue('prep', this.locId) > 0 && this.prep.enabled) badge(1262, 600, 'staff_prep');
    if (upValue('waiter', this.locId) > 0) {
      this.waiter = this.add.container(40, 380).setDepth(17);
      this.waiter.add(mkImg(this, 0, 0, 'staff_waiter', 0.72).setOrigin(0.5, 1));
    }
    if (upValue('cleaner', this.locId) > 0) {
      this.cleaner = this.add.container(150, 380).setDepth(17);
      this.cleaner.add(mkImg(this, 0, 0, 'staff_cleaner', 0.72).setOrigin(0.5, 1));
      this.cleaner.add(mkImg(this, 24, -40, 'broom', 0.7));
    }
  }

  private staffTick(dt: number): void {
    this.staffT -= dt;
    if (this.staffT > 0) return;
    this.staffT = 0.35;
    const gc = upValue('grill_cook', this.locId);
    if (gc) this.grill.autoTick(gc);
    const fc = upValue('fry_cook', this.locId);
    if (fc && this.level.fries) this.fryer.autoTick(fc);
    const ba = upValue('barista', this.locId);
    if (ba) this.soda.autoTick(ba);
    if (upValue('prep', this.locId)) this.prep.autoTick();
    this.waiterTick();
    this.cleanerTick();
  }

  private waiterTick(): void {
    if (!this.waiter || this.waiterBusy) return;
    const lvl = upValue('waiter', this.locId);
    const items = [...this.warmer.items(), ...this.soda.items(), ...this.assembly.items()];
    for (const it of items) {
      const c = this.bestCustomer(it.key);
      if (!c) continue;
      const idx = c.needs(it.key);
      c.order[idx].pending = true;
      this.waiterBusy = true;
      const speed = [0, 1.7, 2.4, 3.2][lvl];
      const w = this.waiter;
      const walk = (x: number, cb: () => void) => {
        const d = Math.abs(w.x - x);
        (w.list[0] as Phaser.GameObjects.Image).setFlipX(x < w.x);
        this.tweens.add({ targets: w, x, duration: Math.max(150, d / speed), onComplete: cb });
        this.tweens.add({ targets: w.list[0], y: -6, duration: 140, yoyo: true, repeat: Math.floor(d / speed / 280) });
      };
      walk(it.x, () => {
        if (c.state !== 'order') { c.order[idx].pending = false; this.waiterBusy = false; return; }
        it.take();
        const carry = it.ghost();
        this.children.remove(carry);
        carry.setPosition(0, -90);
        w.add(carry);
        walk(c.c.x, () => {
          carry.destroy();
          c.order[idx].pending = false;
          if (c.state === 'order') {
            c.deliver(idx, it.quality, it.salted);
            sfx.serve();
            this.stat('served_items');
          }
          this.waiterBusy = false;
        });
      });
      return;
    }
  }

  private cleanerTick(): void {
    if (!this.cleaner || this.cleanerBusy) return;
    const t = this.tables.find((x) => x.dirty && !x.cust && !x.cleaning);
    if (!t) return;
    this.cleanerBusy = true;
    t.cleaning = true;
    const lvl = upValue('cleaner', this.locId);
    const c = this.cleaner;
    const d = Math.abs(c.x - t.x);
    (c.list[0] as Phaser.GameObjects.Image).setFlipX(t.x < c.x);
    this.tweens.add({
      targets: c,
      x: t.x,
      duration: d / (lvl >= 2 ? 2.4 : 1.5),
      onComplete: () => {
        this.tweens.add({ targets: c.list[1], angle: { from: -25, to: 25 }, duration: 120, yoyo: true, repeat: lvl >= 2 ? 2 : 4, onComplete: () => {
          this.cleanTable(t);
          this.cleanerBusy = false;
        } });
      },
    });
  }

  // ================================================================== HUD
  private buildHud(): void {
    const g = this.add.graphics().setDepth(500);
    g.fillStyle(0x3e2112, 0.88);
    g.fillRoundedRect(8, 6, W - 16, 44, 16);
    this.coinIcon = img(this, 34, 28, 'coin', 0.72).setDepth(501);
    this.moneyTxt = txt(this, 60, 28, '0', 26, { color: '#ffe14d' }).setOrigin(0, 0.5).setDepth(501);
    // лента на целта
    this.goalBar = this.add.graphics().setDepth(501);
    const gx = 170, gw = 330;
    const max = this.level.goals[2] * 1.08;
    this.level.goals.forEach((v, i) => {
      const x = gx + (v / max) * gw;
      const s = img(this, x, 28, 'star_empty', 0.48).setDepth(503);
      this.goalStars.push(s);
      txt(this, x, 48, String(v), 11, { color: '#ffffff' }).setDepth(503);
      void i;
    });
    img(this, 560, 28, 'clock', 0.6).setDepth(501);
    this.clockTxt = txt(this, 584, 28, '09:00', 22).setOrigin(0, 0.5).setDepth(501);
    this.custTxt = txt(this, 760, 28, '', 20, { color: '#ffffff' }).setDepth(501);
    this.comboTxt = txt(this, 900, 28, '', 24, { color: '#ff6bd6' }).setDepth(501);
    const b = S().boosters;
    this.freezeBtn = button(this, 1046, 28, 96, 38, `${b.freeze ?? 0}`, C.blue, () => this.useFreeze(), { icon: 'snow', iconScale: 0.55, size: 20 }).setDepth(502);
    this.tipsBtn = button(this, 1150, 28, 96, 38, `${b.tips ?? 0}`, C.green, () => this.useTips(), { icon: 'coin', iconScale: 0.55, size: 20 }).setDepth(502);
    button(this, 1238, 28, 52, 40, '', C.orange, () => this.pause(), { icon: 'pause', iconScale: 0.6 }).setDepth(502);
    this.freezeOverlay = this.add.rectangle(0, 52, W, 318, 0x81d4fa, 0.18).setOrigin(0).setDepth(299).setVisible(false);
    this.updateHud(0);
  }

  private updateHud(dt: number): void {
    this.shownMoney += (this.earned - this.shownMoney) * Math.min(1, dt * 8);
    if (Math.abs(this.earned - this.shownMoney) < 0.5) this.shownMoney = this.earned;
    this.moneyTxt.setText(fmt(Math.round(this.shownMoney)));
    const gx = 170, gw = 330;
    const max = this.level.goals[2] * 1.08;
    const g = this.goalBar;
    const barPx = Math.round(gw * Math.min(1, this.shownMoney / max));
    if (barPx !== this.lastBarPx) {
    this.lastBarPx = barPx;
    g.clear();
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(gx - 4, 18, gw + 8, 20, 10);
    const f = Math.min(1, this.shownMoney / max);
    if (f > 0) {
      g.fillStyle(0x7cb342, 1);
      g.fillRoundedRect(gx, 21, Math.max(14, gw * f), 14, 7);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(gx + 3, 22, Math.max(8, gw * f - 6), 4, 2);
    }
    }
    this.level.goals.forEach((v, i) => {
      const s = this.goalStars[i];
      if (this.earned >= v && s.texture.key !== 'star') {
        s.setTexture('star');
        bounce(this, s, 1.6);
        sfx.star(i);
        sparkles(this, s.x, s.y, 8, 'spark', 40, 600);
      }
    });
    const hours = 9 + Math.min(1, this.elapsed / this.dayLen) * 12;
    const hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60 / 10) * 10;
    this.clockTxt.setText(this.spawnLeft === 0 && this.running ? 'Затваряме' : `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    this.clockTxt.setColor(this.spawnLeft === 0 ? '#ffab91' : '#ffffff');
    this.custTxt.setText(`Клиенти ${this.level.customers - this.spawnLeft}/${this.level.customers}`);
    this.comboTxt.setText(this.combo >= 2 ? `КОМБО x${this.combo}` : '');
    const b = S().boosters;
    this.freezeBtn?.setLabel(this.freezeT > 0 ? `${Math.ceil(this.freezeT)}с` : `${b.freeze ?? 0}`);
    this.tipsBtn?.setLabel(this.tipsBoost ? 'x2' : `${b.tips ?? 0}`);
  }

  private useFreeze(): void {
    const b = S().boosters;
    if (this.freezeT > 0 || !this.running) return;
    if ((b.freeze ?? 0) <= 0) { this.hint('Нямаш „Замразяване“ — вземи от магазина', 1000, 90); return; }
    b.freeze--;
    save();
    this.freezeT = 15;
    this.freezeOverlay.setVisible(true);
    floatText(this, 640, 200, 'ВРЕМЕТО Е ЗАМРАЗЕНО!', '#81d4fa', 34);
    sfx.levelUp();
  }

  private useTips(): void {
    const b = S().boosters;
    if (this.tipsBoost || !this.running) return;
    if ((b.tips ?? 0) <= 0) { this.hint('Нямаш „Двоен бакшиш“ — вземи от магазина', 1100, 90); return; }
    b.tips--;
    save();
    this.tipsBoost = true;
    floatText(this, 640, 200, 'ДВОЙНИ БАКШИШИ!', '#9cff57', 34);
    sfx.levelUp();
  }

  get patienceFrozen(): boolean {
    return this.freezeT > 0 || (!!this.tutor && this.tutor.active) || this.paused;
  }

  // ================================================================== ВХОД (докосване, влачене, задържане, плъзгане)
  hot(x: number, y: number, w: number, h: number, handlers: Handlers, depth = 200): Phaser.GameObjects.Zone {
    const z = this.add.zone(x, y, w, h).setInteractive().setDepth(depth);
    z.on('pointerdown', (p: Phaser.Input.Pointer) => this.pdown(z, handlers, p));
    return z;
  }

  private setupInput(): void {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.pmove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.pup(p));
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.pup(p));
    this.input.on('gameout', () => {
      for (const [id, pr] of this.presses) if (pr.holding) { pr.h.hold!.end(); this.presses.delete(id); }
    });
  }

  private pdown(zone: Phaser.GameObjects.Zone, h: Handlers, p: Phaser.Input.Pointer): void {
    sfx.unlock();
    if (this.paused || this.ended) return;
    const pr: Press = { h, zone, x0: p.x, y0: p.y, lx: p.x, ly: p.y, acc: 0, moved: false, holding: false };
    if (h.hold && h.hold.start()) pr.holding = true;
    this.presses.set(p.id, pr);
  }

  private pmove(p: Phaser.Input.Pointer): void {
    const pr = this.presses.get(p.id);
    if (!pr || pr.holding) return;
    const d = Phaser.Math.Distance.Between(p.x, p.y, pr.x0, pr.y0);
    if (pr.h.swipe) {
      pr.acc += Phaser.Math.Distance.Between(p.x, p.y, pr.lx, pr.ly);
      pr.lx = p.x;
      pr.ly = p.y;
      const b = pr.zone.getBounds();
      if (pr.acc > 60 && Phaser.Geom.Rectangle.Inflate(b, 30, 30).contains(p.x, p.y)) {
        pr.acc = 0;
        pr.moved = true;
        pr.h.swipe();
      }
      return;
    }
    if (!pr.ghost && pr.h.drag && d > 16) {
      const spec = pr.h.drag();
      pr.moved = true;
      if (spec) {
        pr.spec = spec;
        pr.ghost = spec.ghost();
        (pr.ghost as unknown as Phaser.GameObjects.Components.Depth).setDepth(650);
        (pr.ghost as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0.92);
      }
    }
    if (d > 30) pr.moved = true;
    if (pr.ghost) pr.ghost.setPosition(p.x, p.y - 30);
  }

  private pup(p: Phaser.Input.Pointer): void {
    const pr = this.presses.get(p.id);
    if (!pr) return;
    this.presses.delete(p.id);
    if (pr.holding) { pr.h.hold!.end(); return; }
    if (pr.ghost && pr.spec) {
      const gh = pr.ghost;
      const ok = !this.ended && pr.spec.drop(p.x, p.y - 30);
      if (ok) gh.destroy();
      else this.tweens.add({ targets: gh, x: pr.x0, y: pr.y0, alpha: 0, duration: 220, onComplete: () => gh.destroy() });
      return;
    }
    if (!pr.moved && pr.h.tap && !this.paused && !this.ended) pr.h.tap();
  }

  // ================================================================== СЕРВИРАНЕ
  bestCustomer(key: string): Customer | undefined {
    return this.customers
      .filter((c) => c.state === 'order' && c.needs(key) >= 0)
      .sort((a, b) => a.frac - b.frac)[0];
  }

  serve(item: ReadyItem, target?: Customer, from?: { x: number; y: number }): boolean {
    const c = target ?? this.bestCustomer(item.key);
    if (!c || c.state !== 'order' || c.needs(item.key) < 0) {
      if (target) this.hint('Не е поръчал това!', target.c.x, 200);
      else this.hint(item.dish.kind === 'burger' ? 'Никой не иска такъв бургер — хвърли го в кофата' : 'Никой не е поръчал това', item.x, item.y - 70);
      sfx.nope();
      return false;
    }
    const idx = c.needs(item.key);
    c.order[idx].pending = true;
    item.take();
    const fly = item.ghost();
    fly.setPosition(from?.x ?? item.x, from?.y ?? item.y);
    (fly as unknown as Phaser.GameObjects.Components.Depth).setDepth(650);
    const to = c.bubblePos(idx);
    const midY = Math.min(fly.y, to.y) - 80;
    const sx = fly.x, sy = fly.y;
    const tw = { t: 0 };
    sfx.whoosh();
    this.tweens.add({
      targets: tw,
      t: 1,
      duration: 380,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const t = tw.t;
        fly.x = sx + (to.x - sx) * t;
        fly.y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * to.y;
        (fly as unknown as Phaser.GameObjects.Components.Transform).setScale((1 - t * 0.5) * ((fly.getData?.('bs') as number) ?? 1));
      },
      onComplete: () => {
        fly.destroy();
        c.order[idx].pending = false;
        if (c.state === 'order') {
          c.deliver(idx, item.quality, item.salted);
          sfx.serve();
          this.stat('served_items');
        }
      },
    });
    return true;
  }

  dropServe(item: ReadyItem, x: number, y: number): boolean {
    if (this.trash.hit(x, y)) {
      item.take();
      this.trashFx(x, y, null);
      return true;
    }
    const c = this.customers.find((k) => (k.state === 'order') && Math.abs(k.c.x - x) < 95 && y > 56 && y < 372);
    if (c) return this.serve(item, c, { x, y });
    return false;
  }

  trashFx(x: number, y: number, key: string | null): void {
    if (key) {
      const o = img(this, x, y, key, 0.7).setDepth(650);
      this.tweens.add({ targets: o, x: this.trash.x, y: this.trash.y - 20, angle: 200, scale: 0.1, duration: 420, ease: 'Quad.In', onComplete: () => o.destroy() });
    }
    this.time.delayedCall(key ? 380 : 0, () => {
      sfx.trash();
      bounce(this, this.trash.can, 1.15);
    });
    this.stat('wasted');
  }

  /** Колко неизпълнени (и неносени) позиции от този вид има. */
  demand(prefix: string): number {
    let n = 0;
    for (const c of this.customers) {
      if (c.state !== 'order' && c.state !== 'think') continue;
      for (const o of c.order) if (!o.done && !o.pending && o.key.startsWith(prefix)) n++;
    }
    return n;
  }

  burgerWants(layers: Layer[], kind: Layer): boolean {
    for (const c of this.customers) {
      if (c.state !== 'order') continue;
      for (const o of c.order) {
        if (o.done || o.dish.kind !== 'burger') continue;
        const top = o.dish.top as string[];
        if (top.includes(kind) && layers.every((l) => l === 'patty' || top.includes(l))) return true;
      }
    }
    return false;
  }

  // ================================================================== МАСИ
  tapTable(t: Table): void {
    if (t.dirty && !t.cust) {
      if (t.cleaning) return;
      this.cleanTable(t);
    } else if (t.cust && t.cust.state === 'order') {
      bounce(this, t.cust.bubble, 1.08);
    }
  }

  cleanTable(t: Table): void {
    t.cleaning = true;
    const br = img(this, t.x + 30, TABLE_Y - 40, 'broom', 0.9).setDepth(20);
    this.tweens.add({ targets: br, x: t.x - 30, angle: -30, duration: 110, yoyo: true, repeat: 1, onComplete: () => br.destroy() });
    sfx.whoosh();
    this.time.delayedCall(420, () => {
      t.dirty = false;
      t.cleaning = false;
      t.dirtyImg.setVisible(false);
      sparkles(this, t.x, TABLE_Y - 30, 7, 'spark', 60);
      sfx.ding();
      this.stat('cleaned');
      this.seatQueue();
    });
  }

  onTableChanged(_t: Table): void {
    this.seatQueue();
  }

  freeTable(): Table | undefined {
    return this.tables.find((t) => !t.cust && !t.dirty);
  }

  seatQueue(): void {
    while (this.queue.length) {
      const t = this.freeTable();
      if (!t) break;
      const c = this.queue.shift()!;
      c.goToTable(t);
    }
    this.queue.forEach((c, i) => { if (c.queueIdx !== i) c.goQueue(i); });
  }

  // ================================================================== КЛИЕНТИ
  private pickType(): CustType {
    const lv = this.level;
    const neon = upValue('neon', this.locId) > 0;
    const special = lv.special * (neon ? 1.6 : 1);
    if (lv.n > 4 && this.rand() < special) {
      const id = this.rand() < 0.7 ? 'vip' : 'critic';
      return CUST_TYPES.find((t) => t.id === id)!;
    }
    const pool = CUST_TYPES.filter((t) => t.id !== 'vip' && t.id !== 'critic' && (lv.n > 2 || t.id === 'adult' || t.id === 'kid'));
    const tot = pool.reduce((a, t) => a + t.weight, 0);
    let x = this.rand() * tot;
    for (const t of pool) { x -= t.weight; if (x <= 0) return t; }
    return pool[0];
  }

  spawn(fixed?: Dish[]): Customer {
    const type = fixed ? CUST_TYPES[0] : this.pickType();
    const look = Math.floor(this.rand() * type.looks.length);
    const dishes = fixed ?? makeOrder(this.level, this.rand, type.minItems, type.maxItems);
    const bonus = (upValue('plants', this.locId) + upValue('jukebox', this.locId)) / 100;
    const pat = this.level.patience * type.patience * (1 + bonus) * (1 + (dishes.length - 1) * 0.14);
    const c = new Customer(this, type, look, dishes, pat);
    this.customers.push(c);
    this.spawnLeft--;
    if (type.id === 'vip') floatText(this, 120, 250, 'VIP клиент!', '#ffe14d', 26);
    if (type.id === 'critic') floatText(this, 120, 250, 'Критик! Впечатли го!', '#e1bee7', 24);
    const t = this.freeTable();
    if (t && this.queue.length === 0) c.goToTable(t);
    else {
      this.queue.push(c);
      c.goQueue(this.queue.length - 1);
    }
    return c;
  }

  canSpawn(): boolean {
    return !!this.freeTable() || this.queue.length < QUEUE_X.length;
  }

  onOrder(_c: Customer): void {
    /* балончето се показа */
  }

  onOrderComplete(c: Customer, frac: number): void {
    c.finishFrac = frac;
    const now = this.gameT;
    this.combo = now - this.lastComplete < 7 ? Math.min(5, this.combo + 1) : 1;
    this.lastComplete = now;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.served++;
    this.stat('served');
    if (this.combo >= 2) {
      const t = txt(this, 640, 250, `КОМБО x${this.combo}!`, 54, { color: ['#fff', '#fff', '#9cff57', '#40c4ff', '#ff6bd6', '#ffe14d'][this.combo] }).setDepth(800).setScale(0.3);
      this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.Out' });
      this.tweens.add({ targets: t, alpha: 0, y: 200, delay: 700, duration: 400, onComplete: () => t.destroy() });
      sfx.combo(this.combo);
      this.stat('combo' + this.combo);
    }
  }

  pay(c: Customer): void {
    const bonus = { meat: upValue('meat', this.locId), potatoes: upValue('potatoes', this.locId), syrup: upValue('syrup', this.locId) };
    let base = 0, perfect = 0, salted = 0;
    for (const o of c.order) {
      base += dishPrice(o.dish, bonus);
      if (o.quality === 'perfect') perfect++;
      if (o.salted) salted++;
    }
    const f = c.finishFrac;
    const decor = 1 + (upValue('pictures', this.locId) + upValue('jukebox', this.locId)) / 100;
    let tip = Math.round(base * (0.04 + 0.3 * f + 0.1 * (perfect / c.order.length)) * c.type.tip * decor) + salted;
    if (this.tipsBoost) tip *= 2;
    const mult = 1 + 0.1 * (this.combo - 1);
    const total = Math.round((base + tip) * mult);
    this.earned += total;
    this.tips += tip;
    this.stat('perfect', perfect);
    const x = c.c.x, y = TABLE_Y - 40;
    floatText(this, x, y - 40, `+${total} лв`, '#ffe14d', 32);
    if (tip > 0) this.time.delayedCall(250, () => floatText(this, x, y - 5, `бакшиш ${tip}`, '#9cff57', 20));
    const n = Math.min(10, 3 + Math.floor(total / 6));
    for (let i = 0; i < n; i++) {
      const coin = img(this, x + Phaser.Math.Between(-30, 30), y, 'coin', 0.55).setDepth(600);
      this.tweens.add({
        targets: coin,
        y: y - Phaser.Math.Between(30, 70),
        duration: 250,
        delay: i * 40,
        ease: 'Quad.Out',
        onComplete: () => this.tweens.add({
          targets: coin,
          x: this.coinIcon.x,
          y: this.coinIcon.y,
          scale: 0.25,
          duration: 420,
          delay: 100,
          ease: 'Quad.In',
          onComplete: () => {
            coin.destroy();
            if (i % 2 === 0) sfx.coin();
            bounce(this, this.coinIcon, 1.25);
          },
        }),
      });
    }
    if (c.type.id === 'critic' && f > 0.45) {
      S().gems += 1;
      floatText(this, x, y - 90, 'Критикът е възхитен! +1', '#4dd0e1', 24);
    }
  }

  onLost(c: Customer): void {
    this.lost++;
    this.combo = 0;
    this.stat('lost');
    this.vibe([60, 40, 60]);
    const qi = this.queue.indexOf(c);
    if (qi >= 0) { this.queue.splice(qi, 1); this.seatQueue(); }
  }

  onGone(c: Customer): void {
    this.customers = this.customers.filter((x) => x !== c);
    const qi = this.queue.indexOf(c);
    if (qi >= 0) this.queue.splice(qi, 1);
  }

  // ================================================================== ПОМОЩНИ
  hint(s: string, x: number, y: number): void {
    if (this.hintCool > 0) return;
    this.hintCool = 0.6;
    const t = txt(this, Phaser.Math.Clamp(x, 160, W - 160), Phaser.Math.Clamp(y, 80, H - 40), s, 20, { color: '#ffffff', wrap: 300 }).setDepth(820);
    t.setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 1100, duration: 400, onComplete: () => t.destroy() });
  }

  pointAtPrep(): void {
    const h = img(this, this.prep.cx, 470, 'hand', 0.7).setOrigin(0.47, 0.03).setDepth(710);
    this.tweens.add({ targets: h, y: 480, duration: 250, yoyo: true, repeat: 3, onComplete: () => h.destroy() });
  }

  stat(k: string, v = 1): void {
    this.stats[k] = (this.stats[k] ?? 0) + v;
  }

  vibe(ms: number | number[]): void {
    sfx.vibe(ms);
  }

  // ================================================================== НАЧАЛО / ОБУЧЕНИЕ
  private introBanner(): void {
    const lv = this.level;
    const c = this.add.container(W / 2, 250).setDepth(900);
    const g = this.make.graphics({}, false);
    roundRect(g, -300, -110, 600, 220, 30, C.cream, C.brown, 6);
    c.add(g);
    c.add(txt(this, 0, -70, `ДЕН ${lv.n}`, 48, { color: '#ff7043' }));
    c.add(txt(this, 0, -18, `Цел: ${lv.goals[0]} лв`, 30, { color: '#4a2c17', stroke: '#ffffff', strokeW: 0 }));
    if (lv.challenge) c.add(txt(this, 0, 22, `★ ${lv.challenge.text}`, 22, { color: '#8e24aa', stroke: '#ffffff', strokeW: 0 }));
    c.add(txt(this, 0, 66, `${lv.customers} клиента днес`, 22, { color: '#6d4c41', stroke: '#ffffff', strokeW: 0 }));
    c.list.forEach((o) => { if (o instanceof Phaser.GameObjects.Text) this.children.remove(o); });
    c.setScale(0.3);
    this.tweens.add({ targets: c, scale: 1, duration: 350, ease: 'Back.Out' });
    sfx.fanfare();
    this.time.delayedCall(2200, () => {
      this.tweens.add({ targets: c, scale: 0, alpha: 0, duration: 250, onComplete: () => c.destroy() });
      const o = txt(this, W / 2, 250, 'ОТВАРЯМЕ!', 70, { color: '#ffe14d' }).setDepth(900).setScale(0.2);
      this.tweens.add({ targets: o, scale: 1, duration: 300, ease: 'Back.Out' });
      this.tweens.add({ targets: o, alpha: 0, delay: 800, duration: 300, onComplete: () => o.destroy() });
      sfx.bell();
      this.running = true;
      this.startTutorial();
    });
  }

  private startTutorial(): void {
    const tut = this.level.tutorial;
    if (!tut || S().seenTips.includes(`${this.locId}:${tut}`)) return;
    const first = () => this.customers[0];
    const slot0 = () => this.grill.slots[0];
    let steps: Step[] = [];
    if (tut === 'basics') {
      this.holdSpawns = true;
      this.nextSpawn = 0.5;
      this.spawn([{ kind: 'burger', top: [] }, { kind: 'drink', flavor: 'cola' }]);
      steps = [
        { text: 'Здравей, шефе! Първият клиент поръча бургер и кола. Докосни КЮФТЕТАТА, за да сложиш едно на скарата.', at: () => ({ x: 685, y: 640 }), done: () => this.grill.slots.some((s) => s.state !== 'empty') },
        { text: 'Пече се! Когато се появи стрелката — докосни кюфтето, за да го ОБЪРНЕШ.', at: () => (slot0().state === 'A' && slot0().t >= this.grill.side ? { x: slot0().x, y: slot0().y } : null), done: () => this.grill.slots.some((s) => s.state === 'B' || s.state === 'done') || this.assembly.pattiesOnPlates() > 0 },
        { text: 'Изчакай да стане готово (зелено) и го докосни — отива в питката. Не го оставяй да изгори!', at: () => { const s = this.grill.slots.find((x) => x.state === 'done'); return s ? { x: s.x, y: s.y } : null; }, done: () => this.assembly.pattiesOnPlates() > 0 },
        { text: 'Сега докосни ПИТКИТЕ, за да затвориш бургера с горната питка.', at: () => ({ x: this.assembly.bins.bun_top.x, y: 456 }), done: () => this.assembly.items().length > 0 || (first()?.order[0].done ?? true) },
        { text: 'Бургерът е готов! Докосни го, за да го сервираш. (Можеш и да го завлечеш до масата.)', at: () => { const p = this.assembly.plates.find((x) => x.closed); return p ? { x: p.x, y: p.y - 40 } : null; }, done: () => first()?.order[0].done ?? true },
        { text: 'Остана колата. ЗАДРЪЖ пръста върху автомата, докато чашата се напълни до чертичката — и пусни!', at: () => ({ x: 60, y: 530 }), done: () => this.soda.items().length > 0 || (first()?.order[1].done ?? true) },
        { text: 'Супер! Докосни колата, за да я сервираш.', at: () => { const it = this.soda.items()[0]; return it ? { x: it.x, y: it.y } : null; }, done: () => !first() || first().state !== 'order' },
        { text: 'Клиентът яде и плаща — с бакшиш, ако е бил бърз! После докосни мръсната маса, за да я почистиш.', at: () => { const t = this.tables.find((x) => x.dirty); return t ? { x: t.x, y: TABLE_Y - 20 } : null; }, done: () => this.stats.cleaned > 0 },
        { text: 'Браво, шефе! Лентата под поръчката е търпението на клиента. Обслужвай бързо — бързите поръчки една след друга правят КОМБО!', auto: 6, done: () => false },
      ];
    } else if (tut === 'fries') {
      this.holdSpawns = true;
      this.spawn([{ kind: 'fries' }, { kind: 'drink', flavor: 'cola' }]);
      steps = [
        { text: 'Ново: КАРТОФКИ! Докосни чувала, за да ги пуснеш в горещото олио.', at: () => ({ x: 300, y: 640 }), done: () => this.fryer.cooking > 0 || this.warmer.count > 0 },
        { text: 'Гледай стрелката над кошницата. Извади ги, когато е в ЗЕЛЕНОТО — тогава са златисти и перфектни!', at: () => { const b = this.fryer.baskets.find((x) => x.state === 'cook'); return b && this.fryer.quality(b) === 'perfect' ? { x: b.x, y: b.y - 10 } : null; }, done: () => this.warmer.count > 0 },
        { text: 'Посоли ги със СОЛНИЦАТА — солените картофки носят по-голям бакшиш!', at: () => ({ x: 548, y: 640 }), done: () => (this.stats.salted ?? 0) > 0, auto: 10 },
        { text: 'Докосни витрината, за да сервираш картофките. После налей колата!', at: () => ({ x: 440, y: 640 }), done: () => !first() || first().state !== 'order' },
      ];
    } else if (tut === 'cheese') {
      steps = [{ text: 'Ново: СИРЕНЕ! Сложи кюфте в питката и докосни кутията със сирене, преди да затвориш бургера.', at: () => ({ x: this.assembly.bins.cheese.x, y: 456 }), done: () => (this.stats.burgers ?? 0) > 0, auto: 14 }];
    } else if (tut === 'tomato') {
      this.holdSpawns = true;
      this.spawn([{ kind: 'burger', top: ['tomato'] }]);
      steps = [
        { text: 'Ново: ДОМАТИ! Първо ги нарежи. Докосни касата с домати.', at: () => ({ x: 1212, y: 440 }), done: () => !!this.prep.item || this.assembly.tomatoes > 0 },
        { text: 'РЕЖИ! Плъзгай пръст през домата (или го докосвай), докато се нареже.', at: () => (this.prep.item ? { x: 1212, y: 556 } : null), done: () => this.assembly.tomatoes > 0 },
        { text: 'Резенчетата са в кутията ДОМАТИ. Направи бургер и сложи домат в него!', at: () => ({ x: this.assembly.bins.tomato.x, y: 456 }), done: () => !first() || first().state !== 'order' },
      ];
    } else if (tut === 'lettuce') {
      steps = [{ text: 'Ново: МАРУЛЯ! Гледай внимателно какво има в бургера на поръчката.', auto: 6, done: () => false }];
    }
    if (!steps.length) return;
    this.tutor = new Tutor(this, steps);
    this.tutor.onDone = () => {
      this.holdSpawns = false;
      S().seenTips.push(`${this.locId}:${tut}`);
      save();
    };
  }

  // ================================================================== ЦИКЪЛ
  update(t: number, dms: number): void {
    try {
      this.step(t, dms);
    } catch (e) {
      // грешка в един кадър не трябва да спира цялата игра
      console.error(e);
    }
  }

  private step(_t: number, dms: number): void {
    const speed = (window as unknown as { __speed?: number }).__speed ?? 1;
    this.tweens.timeScale = speed;
    this.time.timeScale = speed;
    const dt = Math.min(0.05, dms / 1000) * speed;
    this.hintCool -= dt;
    this.updateHud(dt);
    if (this.paused || this.ended) return;
    this.gameT += dt;
    this.tutor?.update(dt);
    this.grill.update(dt);
    if (this.level.fries) this.fryer.update(dt);
    this.soda.update(dt);
    for (const c of [...this.customers]) c.update(dt);
    for (const t of this.tables) t.dirtyImg.setVisible(t.dirty && !t.cust);
    sfx.loop('sizzle', this.grill.cooking > 0 ? 0.5 + this.grill.cooking * 0.2 : 0);
    sfx.loop('fry', this.fryer.cooking > 0 ? 0.6 + this.fryer.cooking * 0.2 : 0);
    sfx.loop('pour', this.soda.pouring ? 1 : 0);
    if (this.freezeT > 0) {
      this.freezeT -= dt;
      if (this.freezeT <= 0) this.freezeOverlay.setVisible(false);
    }
    if (!this.running) return;
    this.staffTick(dt);
    if (!this.holdSpawns) this.elapsed += dt;
    if (this.spawnLeft > 0 && !this.holdSpawns) {
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) {
        if (this.canSpawn()) {
          this.spawn();
          const [a, b] = this.level.gap;
          this.nextSpawn = a + this.rand() * (b - a);
        } else this.nextSpawn = 0.5;
      }
    }
    if (this.spawnLeft <= 0 && this.customers.length === 0 && !this.holdSpawns) this.finish();
  }

  // ================================================================== КРАЙ НА ДЕНЯ
  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    sfx.stopLoops();
    const lv = this.level;
    let challengeOk = true;
    const ch = lv.challenge;
    if (ch) {
      if (ch.type === 'noLoss') challengeOk = this.lost === 0;
      if (ch.type === 'perfectFries') challengeOk = (this.stats.perfectFries ?? 0) >= ch.value;
      if (ch.type === 'combo') challengeOk = this.maxCombo >= ch.value;
      if (ch.type === 'perfectDrinks') challengeOk = (this.stats.perfectDrinks ?? 0) >= ch.value;
      if (ch.type === 'served') challengeOk = this.served >= ch.value;
    }
    let stars = lv.goals.filter((g) => this.earned >= g).length;
    if (!challengeOk) stars = 0;
    const ls = loc(this.locId);
    const prevStars = ls.stars[lv.n - 1] ?? 0;
    const sv = S();
    sv.coins += this.earned;
    if (stars > prevStars) {
      if (stars === 3 && prevStars < 3) sv.gems += 1;
      ls.stars[lv.n - 1] = stars;
    }
    addStat('coinsEarned', this.earned);
    addStat('customersServed', this.served);
    addStat('daysPlayed');
    addStat('perfectFries', this.stats.perfectFries ?? 0);
    addStat('perfectDrinks', this.stats.perfectDrinks ?? 0);
    addStat('burgers', this.stats.burgers ?? 0);
    addStat('tomatoesCut', this.stats.tomatoesCut ?? 0);
    if (this.maxCombo >= 4) addStat('bigCombo');
    if (this.maxCombo > (sv.stats.bestCombo ?? 0)) sv.stats.bestCombo = this.maxCombo;
    if (stars > 0) addStat('levelsWon');
    if (stars === 3) addStat('threeStars');
    save();
    const res: LevelResult = {
      loc: this.locId,
      n: lv.n,
      earned: this.earned,
      tips: this.tips,
      served: this.served,
      lost: this.lost,
      total: lv.customers,
      stars,
      prevStars,
      goals: lv.goals,
      challenge: ch ? { text: ch.text, ok: challengeOk } : undefined,
      maxCombo: this.maxCombo,
      perfect: this.stats.perfect ?? 0,
    };
    this.time.delayedCall(600, () => {
      this.scene.launch('Result', res);
      this.scene.pause();
    });
  }

  // ================================================================== ПАУЗА
  pause(): void {
    if (this.ended || this.paused) return;
    this.paused = true;
    sfx.stopLoops();
    for (const [, pr] of this.presses) if (pr.holding) pr.h.hold!.end();
    this.presses.clear();
    this.scene.launch('Pause', { loc: this.locId, n: this.level.n });
    this.scene.pause();
  }

  resumeGame(): void {
    this.paused = false;
  }
}
