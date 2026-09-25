// Весел фон за менютата: въртящи се лъчи и падащи храни.

import Phaser from 'phaser';
import { W, H } from '../config/game';
import { img } from './kit';

export function menuBg(scene: Phaser.Scene, c1 = 0xffb300, c2 = 0xff8f00, food = true): void {
  scene.add.rectangle(0, 0, W, H, c2).setOrigin(0).setDepth(-10);
  const g = scene.add.graphics().setDepth(-9);
  const R = 1500;
  g.fillStyle(c1, 1);
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16;
    g.fillTriangle(0, 0, Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R);
  }
  g.setPosition(W / 2, H * 0.55);
  scene.tweens.add({ targets: g, angle: 360, duration: 60000, repeat: -1 });
  if (!food) return;
  const keys = ['bun_top', 'fries_box', 'drink_cola', 'tomato', 'cheese', 'drink_fanta', 'patty_cooked', 'coin'];
  for (let i = 0; i < 14; i++) {
    const k = keys[i % keys.length];
    const o = img(scene, Math.random() * W, Math.random() * H, k, 0.5 + Math.random() * 0.4).setDepth(-8).setAlpha(0.35).setAngle(Math.random() * 360);
    const fall = () => {
      o.y = -60;
      o.x = Math.random() * W;
      scene.tweens.add({ targets: o, y: H + 60, angle: o.angle + 180, duration: 9000 + Math.random() * 7000, onComplete: fall });
    };
    scene.tweens.add({ targets: o, y: H + 60, angle: o.angle + 180, duration: (H + 60 - o.y) * 14 + 2000, onComplete: fall });
  }
}
