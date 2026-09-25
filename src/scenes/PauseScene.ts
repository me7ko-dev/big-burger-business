import Phaser from 'phaser';
import { W, H } from '../config/game';
import { S, save } from '../data/save';
import { button, panel, C } from '../ui/kit';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { loc: string; n: number }): void {
    this.add.rectangle(0, 0, W, H, 0x1a0d05, 0.65).setOrigin(0).setInteractive();
    const p = panel(this, W / 2, 370, 480, 420, C.cream, 'ПАУЗА', C.orange);
    p.setScale(0.5);
    this.tweens.add({ targets: p, scale: 1, duration: 250, ease: 'Back.Out' });
    const sv = S();
    const back = (then: () => void) => {
      this.scene.stop();
      then();
    };
    p.add(button(this, 0, -120, 340, 70, 'ПРОДЪЛЖИ', C.green, () => back(() => this.scene.resume('Game'))));
    p.add(button(this, 0, -35, 340, 70, 'ОТНАЧАЛО', C.orange, () => back(() => this.scene.get('Game').scene.restart({ loc: data.loc, n: data.n }))));
    p.add(button(this, 0, 50, 340, 70, 'КЪМ КАРТАТА', C.blue, () => back(() => this.scene.get('Game').scene.start('Map'))));
    const snd = button(this, -90, 140, 160, 56, sv.settings.sound ? 'Звук: ДА' : 'Звук: НЕ', C.purple, () => {
      sv.settings.sound = !sv.settings.sound;
      save();
      snd.setLabel(sv.settings.sound ? 'Звук: ДА' : 'Звук: НЕ');
    }, { size: 20 });
    const mus = button(this, 90, 140, 160, 56, sv.settings.music ? 'Музика: ДА' : 'Музика: НЕ', C.purple, () => {
      sv.settings.music = !sv.settings.music;
      save();
      mus.setLabel(sv.settings.music ? 'Музика: ДА' : 'Музика: НЕ');
    }, { size: 20 });
    p.add([snd, mus]);
  }
}
