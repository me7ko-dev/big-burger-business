import Phaser from 'phaser';
import { W, H, LOCATIONS } from '../config/game';
import { S, save, addXp } from '../data/save';
import { button, panel, txt, img, mkImg, C, sparkles, fmt } from '../ui/kit';
import { sfx } from '../audio/sfx';
import type { LevelResult } from './GameScene';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(r: LevelResult): void {
    this.add.rectangle(0, 0, W, H, 0x1a0d05, 0.7).setOrigin(0).setInteractive();
    const win = r.stars > 0;
    const p = panel(this, W / 2, 390, 640, 560, C.cream, win ? 'КРАЙ НА ДЕНЯ' : 'ОПИТАЙ ПАК', win ? C.green : C.red);
    p.setScale(0.4);
    this.tweens.add({ targets: p, scale: 1, duration: 350, ease: 'Back.Out' });
    // звезди
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 120, y = i === 1 ? -200 : -180;
      const e = mkImg(this, x, y, 'star_empty', i === 1 ? 1.6 : 1.3);
      p.add(e);
      if (i < r.stars) {
        const s = mkImg(this, x, y, 'star', i === 1 ? 1.6 : 1.3);
        const b = s.scale;
        s.setScale(0);
        p.add(s);
        this.time.delayedCall(500 + i * 380, () => {
          this.tweens.add({ targets: s, scale: b, duration: 350, ease: 'Back.Out' });
          sfx.star(i);
          sparkles(this, W / 2 + x, 390 + y, 12, 'spark', 90, 10);
        });
      }
    }
    const dark = { color: '#4a2c17', stroke: '#ffffff', strokeW: 0, add: false } as const;
    const money = txt(this, 30, -95, '0', 54, { color: '#ffb300', add: false });
    p.add(mkImg(this, -50, -95, 'coin', 1.1));
    p.add(money);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: r.earned, duration: 1200, delay: 300, ease: 'Quad.Out', onUpdate: () => money.setText(fmt(counter.v)) });
    const lines: [string, string][] = [
      ['Обслужени клиенти', `${r.served} / ${r.total}`],
      ['Изгубени клиенти', String(r.lost)],
      ['Бакшиши', `${r.tips} лв`],
      ['Най-голямо комбо', r.maxCombo >= 2 ? `x${r.maxCombo}` : '—'],
      ['Цел за 1 звезда', `${r.goals[0]} лв`],
    ];
    lines.forEach(([a, b], i) => {
      const y = -35 + i * 34;
      p.add(txt(this, -200, y, a, 22, { ...dark, weight: 700 }).setOrigin(0, 0.5));
      p.add(txt(this, 200, y, b, 22, { ...dark }).setOrigin(1, 0.5));
    });
    if (r.challenge) {
      p.add(txt(this, 0, 145, `${r.challenge.ok ? '✔' : '✘'} ${r.challenge.text}`, 22, { color: r.challenge.ok ? '#2e7d32' : '#c62828', stroke: '#ffffff', strokeW: 0, add: false }));
    } else if (!win) {
      p.add(txt(this, 0, 145, 'Не стигна целта — подобри кухнята в магазина!', 20, { color: '#c62828', stroke: '#ffffff', strokeW: 0, add: false }));
    }
    // опит
    const sv = S();
    const xp = r.served * 4 + r.stars * 15;
    const ups = addXp(xp);
    if (ups > 0) {
      sv.gems += 2 * ups;
      this.time.delayedCall(1800, () => {
        const t = txt(this, W / 2, 120, `НОВО НИВО НА ШЕФА: ${sv.level}!  +${2 * ups}`, 34, { color: '#ffe14d' }).setScale(0.3);
        const gem = img(this, W / 2 + t.width / 2 + 24, 120, 'gem', 0.8);
        this.tweens.add({ targets: t, scale: 1, duration: 350, ease: 'Back.Out' });
        sfx.levelUp();
        void gem;
      });
    }
    if (r.stars === 3 && r.prevStars < 3) {
      this.time.delayedCall(1700, () => {
        const t = txt(this, W / 2 + 230, 205, '+1', 28, { color: '#4dd0e1' });
        img(this, W / 2 + 270, 205, 'gem', 0.7);
        void t;
      });
    }
    save();

    const L = LOCATIONS.find((l) => l.id === r.loc)!;
    const hasNext = r.n < L.levels;
    const bw = 190;
    p.add(button(this, -200, 225, bw, 72, 'ОТНОВО', C.orange, () => this.go('Game', { loc: r.loc, n: r.n })));
    p.add(button(this, 0, 225, bw, 72, 'МАГАЗИН', C.purple, () => this.go('Shop', { back: 'Map' })));
    if (win && hasNext) p.add(button(this, 200, 225, bw, 72, 'НАПРЕД', C.green, () => this.go('Game', { loc: r.loc, n: r.n + 1 })));
    else p.add(button(this, 200, 225, bw, 72, 'КАРТА', C.blue, () => this.go('Map', {})));
    if (win) sfx.fanfare();
    else sfx.fail();
  }

  go(key: string, data: object): void {
    if (key !== 'Game') this.scene.stop('Game');
    this.scene.start(key, data);
  }
}
