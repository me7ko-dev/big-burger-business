// Рисуване на храна: бургер на пластове, иконки за поръчки.

import Phaser from 'phaser';
import { TOPPING_ORDER, type Dish, type Topping } from '../config/game';
import { mkImg } from '../ui/kit';

export type Layer = 'patty' | Topping;

export const LAYER_TEX: Record<Layer, string> = {
  patty: 'patty_cooked',
  cheese: 'cheese',
  tomato: 'tomato_layer',
  lettuce: 'lettuce_layer',
  onion: 'onion_layer',
  pickle: 'pickle_layer',
};

// колко се издига следващият пласт (в пиксели при мащаб 1)
const STEP: Record<string, number> = { bun_bottom: 19, patty: 16, cheese: 7, tomato: 10, lettuce: 8, onion: 7, pickle: 7 };

/** Бургер в контейнер; (0,0) е долу в средата. */
export function buildBurger(scene: Phaser.Scene, layers: Layer[], closed: boolean, scale: number, container?: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
  const c = container ?? scene.make.container({}, false);
  c.removeAll(true);
  let y = 0;
  const add = (key: string) => {
    const i = mkImg(scene, 0, y * scale, key, scale).setOrigin(0.5, 1);
    c.add(i);
    return i;
  };
  add('bun_bottom');
  y -= STEP.bun_bottom;
  for (const l of layers) {
    add(LAYER_TEX[l]);
    y -= STEP[l];
  }
  if (closed) {
    const top = add('bun_top');
    top.y = (y + 12) * scale;
  }
  return c;
}

export function burgerHeight(layers: Layer[]): number {
  return STEP.bun_bottom + layers.reduce((a, l) => a + STEP[l], 0) + 40;
}

export function canonical(top: Topping[]): Layer[] {
  const out: Layer[] = ['patty'];
  for (const t of TOPPING_ORDER) if (top.includes(t)) out.push(t);
  return out;
}

// видимата ивица на всеки пласт в картинката: [височина, горен ред, долен ред]
// (при сиренето долният ред е краят на плочката — капките висят върху долния пласт)
const BAND: Record<string, [number, number, number]> = {
  bun_bottom: [30, 5, 27], patty: [26, 3, 23], cheese: [30, 4, 12], tomato: [20, 3, 17],
  lettuce: [22, 2, 21], onion: [16, 2, 14], pickle: [16, 2, 14], bun_top: [56, 5, 52],
};

/** Бургер за балончето: пластовете са един над друг, без да се скриват. (0,0) е долу в средата. */
function orderBurger(scene: Phaser.Scene, layers: Layer[], scale: number): { c: Phaser.GameObjects.Container; h: number } {
  const c = scene.make.container({}, false);
  let surf = 0;
  const add = (key: string, band: [number, number, number], overlap: number) => {
    const [h, top, bot] = band;
    const y = surf === 0 ? 0 : surf + overlap + (h - bot);
    c.add(mkImg(scene, 0, y * scale, key, scale).setOrigin(0.5, 1));
    surf = y - h + top;
  };
  add('bun_bottom', BAND.bun_bottom, 0);
  for (const l of layers) add(LAYER_TEX[l], BAND[l], 2);
  add('bun_top', BAND.bun_top, 6);
  return { c, h: -surf * scale };
}

/** Малка иконка за балончето с поръчката; центрирана около (0,0).
 *  chipsW > 0 — бургерът е по-ясен и под него има иконки на съставките, събрани в тази ширина. */
export function dishIcon(scene: Phaser.Scene, d: Dish, s = 1, chipsW = 0): Phaser.GameObjects.Container {
  const c = scene.make.container({}, false);
  switch (d.kind) {
    case 'burger': {
      if (chipsW > 0) {
        const b = orderBurger(scene, canonical(d.top), 0.44 * s);
        const n = d.top.length;
        const step = n ? Math.min(25, chipsW / n) : 0;
        const chipH = n ? step + 5 : 0;
        const total = b.h + chipH;
        b.c.y = -total / 2 + b.h;
        c.add(b.c);
        if (n) {
          const cy = total / 2 - step / 2 - 1;
          const bg = scene.make.graphics({}, false);
          bg.fillStyle(0xfff1d6, 1);
          bg.fillRoundedRect(-(step * n) / 2 - 3, cy - step / 2 - 1, step * n + 6, step + 2, step / 2 + 1);
          c.add(bg);
          TOPPING_ORDER.filter((t) => d.top.includes(t)).forEach((t, i) => {
            c.add(mkImg(scene, (i - (n - 1) / 2) * step, cy, 'chip_' + t, step / 35));
          });
        }
        c.setData('h', total);
        break;
      }
      const layers = canonical(d.top);
      const b = buildBurger(scene, layers, true, 0.42 * s);
      b.y = (burgerHeight(layers) * 0.42 * s) / 2 - 2 * s;
      c.add(b);
      break;
    }
    case 'fries':
      c.add(mkImg(scene, 0, 0, 'fries_box', 0.52 * s));
      c.setData('h', 80 * 0.52 * s);
      break;
    case 'drink':
      c.add(mkImg(scene, 0, 0, 'drink_' + d.flavor, 0.5 * s));
      c.setData('h', 86 * 0.5 * s);
      break;
    case 'coffee':
      c.add(mkImg(scene, 0, 0, d.cap ? 'coffee_cap' : 'coffee_cup', 0.6 * s));
      c.setData('h', 56 * 0.6 * s);
      break;
  }
  return c;
}

export function dishLabel(d: Dish): string {
  switch (d.kind) {
    case 'burger': return 'бургер';
    case 'fries': return 'картофки';
    case 'drink': return 'напитка';
    case 'coffee': return 'кафе';
  }
}
