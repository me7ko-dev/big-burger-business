import Phaser from 'phaser';
import { W, H } from '../config/game';
import { S, save, resetSave } from '../data/save';
import { button, txt, img, C, panel, dim } from '../ui/kit';
import { menuBg } from '../ui/bg';
import { TopBar } from '../ui/topbar';
import { sfx } from '../audio/sfx';
import { showDaily, showOffline } from './popups';

export class MenuScene extends Phaser.Scene {
  bar!: TopBar;

  constructor() {
    super('Menu');
  }

  create(): void {
    menuBg(this);
    this.bar = new TopBar(this);
    const logo = img(this, W / 2, 250, 'logo_burger', 1.05);
    this.tweens.add({ targets: logo, y: 240, angle: { from: -3, to: 3 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const t1 = txt(this, W / 2, 400, 'BIG BURGER', 84, { color: '#ffe14d', strokeW: 12 });
    const t2 = txt(this, W / 2, 470, 'BUSINESS', 60, { color: '#ffffff', strokeW: 10 });
    t1.setShadow(0, 6, '#4a2c17', 0, true, true);
    t2.setShadow(0, 5, '#4a2c17', 0, true, true);
    this.tweens.add({ targets: [t1, t2], scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const play = button(this, W / 2, 580, 340, 96, 'ИГРАЙ', C.green, () => {
      sfx.unlock();
      this.scene.start('Map');
    }, { size: 44 });
    this.tweens.add({ targets: play, scale: 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    button(this, W / 2 - 290, 600, 190, 70, 'МАГАЗИН', C.purple, () => { sfx.unlock(); this.scene.start('Shop', { back: 'Menu' }); }, { size: 24 });
    button(this, W / 2 + 290, 600, 190, 70, 'НАСТРОЙКИ', C.blue, () => { sfx.unlock(); this.settings(); }, { size: 22 });
    txt(this, W - 16, H - 16, 'v0.1', 16, { color: '#ffffff' }).setOrigin(1, 1).setAlpha(0.6);
    this.input.once('pointerdown', () => { sfx.unlock(); sfx.startMusic('menu'); });
    if (sfx.ctx) sfx.startMusic('menu');
    this.events.once('shutdown', () => sfx.stopMusic());
    this.time.delayedCall(400, () => {
      showOffline(this, () => { this.bar.refresh(); showDaily(this, () => this.bar.refresh()); });
    });
  }

  settings(): void {
    const layer = this.add.container(0, 0).setDepth(1000);
    layer.add(dim(this));
    const p = panel(this, W / 2, 380, 520, 460, 0xfff8ec, 'НАСТРОЙКИ', C.blue);
    layer.add(p);
    const sv = S();
    const toggle = (y: number, label: string, get: () => boolean, set: (v: boolean) => void) => {
      const b = button(this, 0, y, 380, 66, `${label}: ${get() ? 'ДА' : 'НЕ'}`, get() ? C.green : C.gray, () => {
        set(!get());
        save();
        b.color = get() ? C.green : C.gray;
        b.draw();
        b.setLabel(`${label}: ${get() ? 'ДА' : 'НЕ'}`);
        if (label === 'Музика') { if (get()) sfx.startMusic('menu'); }
      }, { size: 26 });
      p.add(b);
    };
    toggle(-140, 'Звук', () => sv.settings.sound, (v) => (sv.settings.sound = v));
    toggle(-60, 'Музика', () => sv.settings.music, (v) => (sv.settings.music = v));
    toggle(20, 'Вибрация', () => sv.settings.vibe, (v) => (sv.settings.vibe = v));
    let confirm = false;
    const reset = button(this, 0, 100, 380, 60, 'Изтрий прогреса', C.red, () => {
      if (!confirm) { confirm = true; reset.setLabel('Сигурен ли си? Натисни пак'); return; }
      resetSave();
      this.scene.restart();
    }, { size: 22 });
    p.add(reset);
    p.add(button(this, 0, 180, 240, 66, 'ГОТОВО', C.orange, () => layer.destroy()));
  }
}
