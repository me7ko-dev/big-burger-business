// Горна лента с пари, диаманти и ниво на шефа (за менютата).

import Phaser from 'phaser';
import { S } from '../data/save';
import { XP_PER_LEVEL } from '../config/game';
import { img, txt, fmt, roundRect, C } from './kit';

export class TopBar {
  coins: Phaser.GameObjects.Text;
  gems: Phaser.GameObjects.Text;
  lvl: Phaser.GameObjects.Text;
  xpBar: Phaser.GameObjects.Graphics;
  coinIcon: Phaser.GameObjects.Image;
  scene: Phaser.Scene;
  private shown: number;

  constructor(scene: Phaser.Scene, x = 20) {
    this.scene = scene;
    const g = scene.add.graphics().setDepth(900);
    const pill = (px: number, w: number) => {
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(px + 2, 14, w, 44, 22);
      roundRect(g, px, 10, w, 44, 22, 0x3e2112, C.brown, 3);
    };
    pill(x, 200);
    pill(x + 216, 150);
    pill(x + 382, 210);
    this.coinIcon = img(scene, x + 22, 32, 'coin', 0.85).setDepth(901);
    this.coins = txt(scene, x + 50, 32, '', 26, { color: '#ffe14d' }).setOrigin(0, 0.5).setDepth(901);
    img(scene, x + 238, 32, 'gem', 0.8).setDepth(901);
    this.gems = txt(scene, x + 264, 32, '', 26, { color: '#80deea' }).setOrigin(0, 0.5).setDepth(901);
    img(scene, x + 404, 32, 'staff_cook', 0.28).setDepth(901);
    this.lvl = txt(scene, x + 428, 32, '', 20, { color: '#ffffff' }).setOrigin(0, 0.5).setDepth(901);
    this.xpBar = scene.add.graphics().setDepth(901);
    this.shown = S().coins;
    this.refresh(true);
  }

  refresh(instant = false): void {
    const s = S();
    if (instant) this.shown = s.coins;
    this.coins.setText(fmt(this.shown));
    this.gems.setText(fmt(s.gems));
    this.lvl.setText(`Шеф ${s.level}`);
    const x = 20 + 382 + 118, w = 90;
    const g = this.xpBar;
    g.clear();
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(x, 26, w, 12, 6);
    g.fillStyle(0x7cb342, 1);
    g.fillRoundedRect(x, 26, Math.max(12, w * Math.min(1, s.xp / XP_PER_LEVEL(s.level))), 12, 6);
    if (!instant && this.shown !== s.coins) {
      const c = { v: this.shown };
      this.scene.tweens.add({ targets: c, v: s.coins, duration: 500, onUpdate: () => { this.shown = Math.round(c.v); this.coins.setText(fmt(this.shown)); } });
    }
  }
}
