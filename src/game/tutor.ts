// Обучение: ръка, която сочи какво да се натисне, и кратък текст.

import Phaser from 'phaser';
import { img, mkImg, txt, roundRect, C } from '../ui/kit';
import { sfx } from '../audio/sfx';

export interface Step {
  text: string;
  at?: () => { x: number; y: number } | null;
  done: () => boolean;
  /** стъпка само с текст — изчезва сама след толкова секунди */
  auto?: number;
}

export class Tutor {
  scene: Phaser.Scene;
  steps: Step[];
  i = -1;
  box: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  hand: Phaser.GameObjects.Image;
  t = 0;
  finished = false;
  onDone?: () => void;
  private bg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, steps: Step[], x = 850, y = 150) {
    this.scene = scene;
    this.steps = steps;
    this.box = scene.add.container(x, y).setDepth(700).setVisible(false);
    this.bg = scene.make.graphics({}, false);
    this.text = txt(scene, 30, 0, '', 22, { wrap: 420, color: '#4a2c17', stroke: '#ffffff', strokeW: 0, add: false });
    const chef = mkImg(scene, -222, 36, 'staff_cook', 0.52).setOrigin(0.5, 1);
    this.box.add([this.bg, chef, this.text]);
    this.hand = img(scene, 0, 0, 'hand', 0.8).setOrigin(0.47, 0.03).setDepth(710).setVisible(false);
    scene.tweens.add({ targets: this.hand, scale: { from: this.hand.scale, to: this.hand.scale * 0.88 }, duration: 380, yoyo: true, repeat: -1 });
    this.next();
  }

  get active(): boolean {
    return !this.finished;
  }

  next(): void {
    this.i++;
    this.t = 0;
    if (this.i >= this.steps.length) {
      this.finished = true;
      this.scene.tweens.add({ targets: this.box, alpha: 0, duration: 250, onComplete: () => this.box.setVisible(false) });
      this.hand.setVisible(false);
      this.onDone?.();
      return;
    }
    const s = this.steps[this.i];
    this.text.setText(s.text);
    const h = Math.max(96, this.text.height + 34);
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.25);
    this.bg.fillRoundedRect(-270 + 4, -h / 2 + 6, 540, h, 22);
    roundRect(this.bg, -270, -h / 2, 540, h, 22, 0xfffdf5, C.brown, 4);
    this.box.setVisible(true).setAlpha(1);
    this.box.setScale(0.6);
    this.scene.tweens.add({ targets: this.box, scale: 1, duration: 260, ease: 'Back.Out' });
    if (this.i > 0) sfx.pop();
  }

  update(dt: number): void {
    if (this.finished) return;
    const s = this.steps[this.i];
    this.t += dt;
    const p = s.at?.() ?? null;
    if (p) {
      this.hand.setVisible(true);
      this.hand.x += (p.x - this.hand.x) * Math.min(1, dt * 10);
      this.hand.y += (p.y + 8 - this.hand.y) * Math.min(1, dt * 10);
    } else this.hand.setVisible(false);
    if (s.done() || (s.auto !== undefined && this.t >= s.auto)) this.next();
  }

  destroy(): void {
    this.box.destroy();
    this.hand.destroy();
  }
}
