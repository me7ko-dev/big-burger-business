import Phaser from 'phaser';
import { W, H, UPGRADES, LOCATIONS, type UpgradeDef, type UpgradeTab } from '../config/game';
import { S, save, upLevel, loc } from '../data/save';
import { button, txt, mkImg, C, roundRect, sparkles, fmt, type Button } from '../ui/kit';
import { menuBg } from '../ui/bg';
import { TopBar } from '../ui/topbar';
import { sfx } from '../audio/sfx';

type Tab = UpgradeTab | 'boost';
const TABS: [Tab, string, number][] = [
  ['kitchen', 'КУХНЯ', C.red],
  ['hall', 'ЗАЛА', C.blue],
  ['staff', 'ПЕРСОНАЛ', C.green],
  ['boost', 'БУСТЕРИ', C.purple],
];

const TOP = 176;
const BOTTOM = H - 8;

export class ShopScene extends Phaser.Scene {
  bar!: TopBar;
  tab: Tab = 'kitchen';
  list?: Phaser.GameObjects.Container;
  back = 'Map';
  private maxScroll = 0;
  private dragY: number | null = null;
  private startY = 0;

  constructor() {
    super('Shop');
  }

  private msg = '';

  init(d: { back?: string; tab?: Tab; msg?: string }): void {
    this.back = d.back ?? 'Map';
    if (d.tab) this.tab = d.tab;
    this.msg = d.msg ?? '';
  }

  create(): void {
    menuBg(this, 0xce93d8, 0xba68c8, false);
    this.bar = new TopBar(this);
    const L = LOCATIONS.find((l) => l.id === S().current)!;
    txt(this, W - 250, 32, L.name, 22, { color: '#ffffff' }).setDepth(901);
    button(this, W - 70, 32, 110, 50, 'НАЗАД', C.orange, () => this.scene.start(this.back), { size: 20 }).setDepth(902);
    TABS.forEach(([id, label, color], i) => {
      const b = button(this, 180 + i * 306, 116, 280, 70, label, id === this.tab ? color : 0x9575cd, () => { this.tab = id; this.scene.restart({ back: this.back, tab: id }); }, { size: 28 });
      if (id === this.tab) b.setScale(1.05);
      b.setDepth(800);
    });
    const maskG = this.make.graphics({}, false);
    maskG.fillRect(0, TOP, W, BOTTOM - TOP);
    const mask = maskG.createGeometryMask();
    this.list = this.add.container(0, 0);
    this.list.setMask(mask);
    if (this.tab === 'boost') this.buildBoosts();
    else this.buildUpgrades(UPGRADES.filter((u) => u.tab === this.tab));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.y > TOP) { this.dragY = p.y; this.startY = this.list!.y; } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragY === null || !p.isDown) return;
      this.list!.y = Phaser.Math.Clamp(this.startY + (p.y - this.dragY), -this.maxScroll, 0);
    });
    this.input.on('pointerup', () => { this.dragY = null; });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.list!.y = Phaser.Math.Clamp(this.list!.y - dy * 0.6, -this.maxScroll, 0);
    });
    sfx.startMusic('menu');
    this.events.once('shutdown', () => sfx.stopMusic());
    if (this.msg) this.flash(this.msg);
  }

  private visible(y: number): boolean {
    const wy = y + this.list!.y;
    return wy > TOP + 10 && wy < BOTTOM - 10;
  }

  private buildUpgrades(ups: UpgradeDef[]): void {
    const cols = 3, cw = 404, ch = 168;
    ups.forEach((u, i) => {
      const x = 222 + (i % cols) * 418;
      const y = TOP + 18 + ch / 2 + Math.floor(i / cols) * (ch + 14);
      this.card(u, x, y, cw, ch);
    });
    const rows = Math.ceil(ups.length / cols);
    this.maxScroll = Math.max(0, TOP + 18 + rows * (ch + 14) - BOTTOM + 10);
    if (this.maxScroll > 0) {
      // лента за превъртане вдясно
      const track = this.add.rectangle(W - 6, TOP, 6, BOTTOM - TOP, 0x000000, 0.2).setOrigin(0.5, 0);
      const vis = (BOTTOM - TOP) / (BOTTOM - TOP + this.maxScroll);
      const thumb = this.add.rectangle(W - 6, TOP, 6, (BOTTOM - TOP) * vis, 0xffffff, 0.8).setOrigin(0.5, 0);
      this.events.on('update', () => { thumb.y = TOP + (-this.list!.y / this.maxScroll) * (BOTTOM - TOP) * (1 - vis); });
      void track;
    }
  }

  private card(u: UpgradeDef, x: number, y: number, w: number, h: number): void {
    const lvl = upLevel(u.id);
    const max = u.values.length - 1;
    const c = this.add.container(x, y);
    this.list!.add(c);
    const g = this.make.graphics({}, false);
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 20);
    roundRect(g, -w / 2, -h / 2, w, h, 20, 0xfffdf5, C.brown, 4);
    roundRect(g, -w / 2 + 10, -h / 2 + 10, 110, h - 20, 16, 0xffe0b2, C.brown, 0);
    c.add(g);
    const tex = this.textures.get(u.icon);
    const iw = tex.getSourceImage().width / 2, ih = tex.getSourceImage().height / 2;
    const sc = Math.min(96 / iw, (h - 36) / ih, 1.4);
    c.add(mkImg(this, -w / 2 + 65, 0, u.icon, sc));
    const dark = { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false } as const;
    c.add(txt(this, -w / 2 + 132, -h / 2 + 24, u.name, 22, dark).setOrigin(0, 0.5));
    c.add(txt(this, -w / 2 + 132, -h / 2 + 54, u.desc, 15, { ...dark, weight: 700, wrap: 250, align: 'left' }).setOrigin(0, 0.5));
    // точки за нивата
    for (let k = 0; k < max; k++) {
      const pg = this.make.graphics({}, false);
      roundRect(pg, -w / 2 + 132 + k * 26, h / 2 - 32, 20, 12, 6, k < lvl ? 0x43a047 : 0xd7ccc8, C.brown, 2);
      c.add(pg);
    }
    const f = u.fmt ?? ((v: number) => String(v));
    const valTxt = lvl < max ? `${f(u.values[lvl])}  →  ${f(u.values[lvl + 1])}` : `${f(u.values[lvl])}`;
    c.add(txt(this, -w / 2 + 132, -h / 2 + 96, valTxt, 18, { color: '#2e7d32', stroke: '#fff', strokeW: 0, add: false }).setOrigin(0, 0.5));
    if (lvl >= max) {
      c.add(txt(this, w / 2 - 70, h / 2 - 34, 'МАКС', 22, { color: '#ffb300', add: false }));
      return;
    }
    const cost = u.costs[lvl];
    const can = S().coins >= cost;
    const hire = u.tab === 'staff' && lvl === 0;
    const b: Button = button(this, w / 2 - 74, h / 2 - 34, 132, 52, fmt(cost), can ? C.green : 0x9e9e9e, () => {
      if (!this.visible(y)) return;
      if (S().coins < cost) { sfx.nope(); this.flash('Нямаш достатъчно пари!'); return; }
      S().coins -= cost;
      loc().up[u.id] = lvl + 1;
      save();
      sfx.buy();
      sparkles(this, x, y + this.list!.y, 14, 'spark', 110, 1000);
      const msg = hire ? `${u.name} е нает!` : `${u.name} — ниво ${lvl + 1}!`;
      this.time.delayedCall(300, () => this.scene.restart({ back: this.back, tab: this.tab, msg }));
    }, { icon: 'coin', iconScale: 0.5, size: 22, noSound: true });
    c.add(b);
    if (can) this.tweens.add({ targets: b, scale: 1.06, duration: 500, yoyo: true, repeat: -1 });
  }

  private buildBoosts(): void {
    const sv = S();
    const items: { key: 'freeze' | 'tips'; name: string; desc: string; icon: string; coins: number; gems: number }[] = [
      { key: 'freeze', name: 'Замразяване', desc: 'Клиентите спират да губят търпение за 15 секунди', icon: 'snow', coins: 250, gems: 2 },
      { key: 'tips', name: 'Двоен бакшиш', desc: 'Всички бакшиши за деня са двойни', icon: 'coin', coins: 300, gems: 2 },
    ];
    items.forEach((it, i) => {
      const x = 330 + i * 620, y = TOP + 130;
      const c = this.add.container(x, y);
      this.list!.add(c);
      const g = this.make.graphics({}, false);
      roundRect(g, -290, -110, 580, 220, 24, 0xfffdf5, C.brown, 4);
      c.add(g);
      c.add(mkImg(this, -210, -10, it.icon, 2));
      const dark = { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false } as const;
      c.add(txt(this, -120, -70, it.name, 28, dark).setOrigin(0, 0.5));
      c.add(txt(this, -120, -24, it.desc, 17, { ...dark, weight: 700, wrap: 380, align: 'left' }).setOrigin(0, 0.5));
      c.add(txt(this, -210, 70, `Имаш: ${sv.boosters[it.key] ?? 0}`, 20, dark));
      c.add(button(this, 30, 60, 150, 56, fmt(it.coins), C.green, () => this.buyBoost(it.key, it.coins, 0), { icon: 'coin', iconScale: 0.5, size: 22, noSound: true }));
      c.add(button(this, 195, 60, 150, 56, String(it.gems), C.blue, () => this.buyBoost(it.key, 0, it.gems), { icon: 'gem', iconScale: 0.5, size: 22, noSound: true }));
    });
    // обмяна на диаманти
    const c = this.add.container(W / 2, TOP + 380);
    this.list!.add(c);
    const g = this.make.graphics({}, false);
    roundRect(g, -420, -80, 840, 160, 24, 0xfffdf5, C.brown, 4);
    c.add(g);
    const dark = { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false } as const;
    c.add(txt(this, -120, -30, 'Смени диаманти за пари', 26, dark));
    c.add(txt(this, -120, 18, '5 диаманта = 400 лв', 20, { ...dark, weight: 700 }));
    c.add(mkImg(this, -360, 0, 'gem', 1.4));
    c.add(button(this, 270, 0, 200, 70, 'СМЕНИ', C.orange, () => {
      if (sv.gems < 5) { sfx.nope(); this.flash('Нужни са 5 диаманта'); return; }
      sv.gems -= 5;
      sv.coins += 400;
      save();
      sfx.buy();
      this.bar.refresh();
    }, { size: 26, noSound: true }));
    this.maxScroll = 0;
  }

  private buyBoost(key: 'freeze' | 'tips', coins: number, gems: number): void {
    const sv = S();
    if (sv.coins < coins || sv.gems < gems) { sfx.nope(); this.flash(gems ? 'Нямаш достатъчно диаманти!' : 'Нямаш достатъчно пари!'); return; }
    sv.coins -= coins;
    sv.gems -= gems;
    sv.boosters[key] = (sv.boosters[key] ?? 0) + 1;
    save();
    sfx.buy();
    this.scene.restart({ back: this.back, tab: 'boost' });
  }

  private flash(s: string): void {
    const t = txt(this, W / 2, H / 2, s, 40, { color: '#ffe14d' }).setDepth(2000).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 300, onComplete: () => t.destroy() });
  }
}
