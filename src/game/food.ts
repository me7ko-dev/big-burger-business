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

/** Малка иконка за балончето с поръчката; центрирана около (0,0). */
export function dishIcon(scene: Phaser.Scene, d: Dish, s = 1): Phaser.GameObjects.Container {
  const c = scene.make.container({}, false);
  switch (d.kind) {
    case 'burger': {
      const layers = canonical(d.top);
      const b = buildBurger(scene, layers, true, 0.42 * s);
      b.y = (burgerHeight(layers) * 0.42 * s) / 2 - 2 * s;
      c.add(b);
      break;
    }
    case 'fries':
      c.add(mkImg(scene, 0, 0, 'fries_box', 0.52 * s));
      break;
    case 'drink':
      c.add(mkImg(scene, 0, 0, 'drink_' + d.flavor, 0.5 * s));
      break;
    case 'coffee':
      c.add(mkImg(scene, 0, 0, d.cap ? 'coffee_cap' : 'coffee_cup', 0.6 * s));
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
