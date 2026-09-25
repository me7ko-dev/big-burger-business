import Phaser from 'phaser';
import { SVGS, FACES, customerSvg, toSvgString, type SvgDef, type CustomerLook } from '../art/svg';
import { CUST_TYPES, TS, W, H } from '../config/game';
import { txt } from '../ui/kit';

export const STAFF_LOOKS: Record<string, CustomerLook> = {
  staff_waiter: { skin: '#f1c27d', hair: '#2b1a0f', hairStyle: 'short', shirt: '#ffffff', pants: '#212121', extra: 'bowtie' },
  staff_cleaner: { skin: '#e0ac69', hair: '#6d4c41', hairStyle: 'bun', shirt: '#26a69a', pants: '#37474f', extra: 'apron' },
  staff_cook: { skin: '#ffdbb5', hair: '#6d4c41', hairStyle: 'short', shirt: '#ffffff', pants: '#37474f', extra: 'chef' },
  staff_cook2: { skin: '#c68642', hair: '#1a1a1a', hairStyle: 'short', shirt: '#ffffff', pants: '#37474f', extra: 'chef' },
  staff_barista: { skin: '#ffe0c7', hair: '#d35400', hairStyle: 'pony', shirt: '#6d4c41', pants: '#212121', extra: 'apron' },
  staff_prep: { skin: '#8d5524', hair: '#1a1a1a', hairStyle: 'curly', shirt: '#ffa726', pants: '#283593', extra: 'apron' },
  staff_manager: { skin: '#f1c27d', hair: '#8d6e63', hairStyle: 'short', shirt: '#3949ab', pants: '#263238', extra: 'tie' },
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#ff8f00');
    const t = txt(this, W / 2, H / 2, 'Зареждане...', 40);
    const all: [string, SvgDef][] = [...Object.entries(SVGS), ...Object.entries(FACES)];
    for (const ct of CUST_TYPES) ct.looks.forEach((l, i) => all.push([`cust_${ct.id}_${i}`, customerSvg(l)]));
    for (const [k, l] of Object.entries(STAFF_LOOKS)) all.push([k, customerSvg(l)]);

    const fontReady = Promise.all([
      document.fonts.load('900 20px Rubik', 'Бургер'),
      document.fonts.load('700 20px Rubik', 'Бургер'),
    ]).catch(() => undefined);

    let done = 0;
    const jobs = all.map(([key, def]) =>
      rasterize(this, key, def).then(() => {
        done++;
        t.setText(`Зареждане... ${Math.round((done / all.length) * 100)}%`);
      }),
    );
    void Promise.all([...jobs, fontReady]).then(() => {
      this.scene.start('Menu');
    });
  }
}

function rasterize(scene: Phaser.Scene, key: string, def: SvgDef): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const w = def.w * TS, h = def.h * TS;
      const tex = scene.textures.createCanvas(key, w, h);
      if (tex) {
        tex.context.drawImage(image, 0, 0, w, h);
        tex.refresh();
      }
      resolve();
    };
    image.onerror = () => {
      console.error('SVG error', key);
      resolve();
    };
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(toSvgString(def, TS));
  });
}
