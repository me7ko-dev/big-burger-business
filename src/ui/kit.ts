// Общи елементи за интерфейса: картинки, текстове, бутони, панели, ефекти.

import Phaser from 'phaser';
import { TS } from '../config/game';
import { sfx } from '../audio/sfx';

export const FONT = 'Rubik, "Arial Black", Arial, sans-serif';

export const C = {
  red: 0xe53935,
  redDark: 0xb71c1c,
  green: 0x43a047,
  greenDark: 0x2e7d32,
  yellow: 0xffc928,
  orange: 0xff8f00,
  blue: 0x1e88e5,
  blueDark: 0x1565c0,
  purple: 0x8e24aa,
  cream: 0xfff8ec,
  brown: 0x4a2c17,
  gray: 0x90a4ae,
};

export function img(scene: Phaser.Scene, x: number, y: number, key: string, scale = 1): Phaser.GameObjects.Image {
  const i = scene.add.image(x, y, key);
  i.setScale(scale / TS);
  i.setData('bs', scale / TS);
  return i;
}

/** Картинка, която се пъха в контейнер (без да се добавя в сцената). */
export function mkImg(scene: Phaser.Scene, x: number, y: number, key: string, scale = 1): Phaser.GameObjects.Image {
  const i = scene.make.image({ x, y, key }, false);
  i.setScale(scale / TS);
  i.setData('bs', scale / TS);
  return i;
}

export function bs(o: Phaser.GameObjects.GameObject): number {
  return (o.getData('bs') as number | undefined) ?? 1;
}

export interface TxtOpts { color?: string; stroke?: string; strokeW?: number; weight?: number; align?: string; wrap?: number; add?: boolean }

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, size: number, o: TxtOpts = {}): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: String(o.weight ?? 900),
    color: o.color ?? '#ffffff',
    stroke: o.stroke ?? '#4a2c17',
    strokeThickness: o.strokeW ?? Math.max(0, Math.round(size / 6)),
    align: o.align ?? 'center',
    resolution: 2,
  };
  if (o.wrap) style.wordWrap = { width: o.wrap, useAdvancedWrap: true };
  const t = o.add === false ? scene.make.text({ x, y, text: s, style }, false) : scene.add.text(x, y, s, style);
  t.setOrigin(0.5);
  return t;
}

export function roundRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, fill: number, stroke = C.brown, sw = 4, alpha = 1): void {
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  if (sw > 0) {
    g.lineStyle(sw, stroke, 1);
    g.strokeRoundedRect(x, y, w, h, r);
  }
}

export function shade(color: number, f: number): number {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const k = (v: number) => Phaser.Math.Clamp(Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f), 0, 255);
  return Phaser.Display.Color.GetColor(k(c.red), k(c.green), k(c.blue));
}

export interface ButtonOpts { icon?: string; iconScale?: number; size?: number; disabled?: boolean; sub?: string; noSound?: boolean }

export class Button extends Phaser.GameObjects.Container {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  icon?: Phaser.GameObjects.Image;
  sub?: Phaser.GameObjects.Text;
  w: number;
  h: number;
  color: number;
  private cb: () => void;
  private _disabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, color: number, cb: () => void, o: ButtonOpts = {}) {
    super(scene, x, y);
    this.w = w;
    this.h = h;
    this.color = color;
    this.cb = cb;
    this.bg = scene.make.graphics({}, false);
    this.add(this.bg);
    const size = o.size ?? Math.min(34, Math.round(h * 0.42));
    let tx = 0;
    if (o.icon) {
      const isz = o.iconScale ?? 0.7;
      this.icon = mkImg(scene, label ? -w / 2 + h * 0.55 : 0, -3, o.icon, isz);
      this.add(this.icon);
      if (label) tx = h * 0.35;
    }
    this.label = txt(scene, tx, o.sub ? -h * 0.14 : -3, label, size, { add: false });
    this.add(this.label);
    if (o.sub) {
      this.sub = txt(scene, tx, h * 0.22, o.sub, Math.round(size * 0.6), { add: false });
      this.add(this.sub);
    }
    this.draw();
    this.setSize(w, h);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      if (this._disabled) { sfx.nope(); return; }
      this.scene.tweens.add({ targets: this, scale: 0.92, duration: 60, yoyo: true });
    });
    this.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this._disabled) return;
      if (p.getDistance() > 30) return;
      if (!o.noSound) sfx.tap();
      this.cb();
    });
    if (o.disabled) this.setDisabled(true);
    scene.add.existing(this);
  }

  draw(): void {
    const { w, h } = this;
    const g = this.bg;
    const c = this._disabled ? 0x9e9e9e : this.color;
    g.clear();
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(-w / 2 + 2, -h / 2 + 7, w, h, Math.min(22, h / 2));
    roundRect(g, -w / 2, -h / 2, w, h, Math.min(22, h / 2), shade(c, -0.25), C.brown, 4);
    g.fillStyle(c, 1);
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 12, Math.min(18, h / 2 - 4));
    g.fillStyle(0xffffff, 0.28);
    g.fillRoundedRect(-w / 2 + 12, -h / 2 + 7, w - 24, h * 0.22, Math.min(10, h / 5));
  }

  setDisabled(v: boolean): this {
    this._disabled = v;
    this.draw();
    this.label.setAlpha(v ? 0.7 : 1);
    return this;
  }

  setLabel(s: string): this {
    this.label.setText(s);
    return this;
  }
}

export function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, color: number, cb: () => void, o: ButtonOpts = {}): Button {
  return new Button(scene, x, y, w, h, label, color, cb, o);
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = C.cream, title?: string, titleColor = C.red): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.make.graphics({}, false);
  g.fillStyle(0x000000, 0.3);
  g.fillRoundedRect(-w / 2 + 4, -h / 2 + 10, w, h, 28);
  roundRect(g, -w / 2, -h / 2, w, h, 28, fill, C.brown, 6);
  c.add(g);
  if (title) {
    const tg = scene.make.graphics({}, false);
    const tw = Math.max(260, title.length * 22 + 60);
    roundRect(tg, -tw / 2, -h / 2 - 34, tw, 64, 22, titleColor, C.brown, 5);
    tg.fillStyle(0xffffff, 0.25);
    tg.fillRoundedRect(-tw / 2 + 10, -h / 2 - 28, tw - 20, 14, 7);
    c.add(tg);
    c.add(txt(scene, 0, -h / 2 - 3, title, 34, { add: false }));
  }
  return c;
}

/** Затъмнен фон зад прозорец; блокира докосванията отдолу. */
export function dim(scene: Phaser.Scene, alpha = 0.6): Phaser.GameObjects.Rectangle {
  const r = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x1a0d05, alpha).setOrigin(0).setInteractive();
  return r;
}

export function popIn(scene: Phaser.Scene, o: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject, delay = 0, to?: number): void {
  const t = to ?? (o as unknown as { scale: number }).scale;
  (o as unknown as { setScale: (v: number) => void }).setScale(t * 0.2);
  scene.tweens.add({ targets: o, scale: t, duration: 380, delay, ease: 'Back.Out' });
}

export function bounce(scene: Phaser.Scene, o: Phaser.GameObjects.GameObject, amount = 1.18): void {
  const b = (o.getData('bs') as number | undefined) ?? (o as unknown as { scale: number }).scale;
  scene.tweens.killTweensOf(o);
  (o as unknown as { setScale: (v: number) => void }).setScale(b);
  scene.tweens.add({ targets: o, scale: b * amount, duration: 90, yoyo: true, ease: 'Quad.Out' });
}

export function shake(scene: Phaser.Scene, o: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
  const x0 = o.x;
  scene.tweens.add({ targets: o, x: x0 + 8, duration: 45, yoyo: true, repeat: 3, onComplete: () => { o.x = x0; } });
}

export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = '#ffe14d', size = 30): void {
  const t = txt(scene, x, y, s, size, { color });
  t.setDepth(1000);
  t.setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: 500, duration: 700, ease: 'Quad.In', onComplete: () => t.destroy() });
}

export function sparkles(scene: Phaser.Scene, x: number, y: number, n = 8, key = 'spark', spread = 60, depth = 900): void {
  for (let i = 0; i < n; i++) {
    const s = img(scene, x, y, key, 0.6 + Math.random() * 0.6).setDepth(depth);
    const a = Math.random() * Math.PI * 2;
    const r = spread * (0.5 + Math.random() * 0.7);
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(a) * r,
      y: y + Math.sin(a) * r - 20,
      angle: Math.random() * 360,
      alpha: 0,
      scale: 0,
      duration: 500 + Math.random() * 300,
      ease: 'Quad.Out',
      onComplete: () => s.destroy(),
    });
  }
}

export function fmt(n: number): string {
  n = Math.floor(n);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
  if (n >= 10_000) return Math.floor(n / 1000) + 'K';
  return String(n);
}
