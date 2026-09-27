// Всички числа за баланса на играта са тук — цени, времена, подобрения, нива.

import type { CustomerLook } from '../art/svg';

export const W = 1280;
export const H = 720;
export const TS = 2; // текстурите са 2x по-големи и се показват с мащаб 0.5

export type Flavor = 'cola' | 'fanta' | 'sprite';
export type Topping = 'cheese' | 'tomato' | 'lettuce' | 'onion' | 'pickle';

export type Dish =
  | { kind: 'burger'; top: Topping[] }
  | { kind: 'fries' }
  | { kind: 'drink'; flavor: Flavor }
  | { kind: 'coffee'; cap: boolean };

export const TOPPING_ORDER: Topping[] = ['cheese', 'tomato', 'onion', 'pickle', 'lettuce'];
export const TOPPING_NAME: Record<Topping, string> = { cheese: 'Кашкавал', tomato: 'Домат', lettuce: 'Маруля', onion: 'Лук', pickle: 'Краставичка' };
export const FLAVOR_NAME: Record<Flavor, string> = { cola: 'Кола', fanta: 'Фанта', sprite: 'Спрайт' };
export const FLAVOR_COLOR: Record<Flavor, number> = { cola: 0xb3261e, fanta: 0xff8a1c, sprite: 0x43a047 };

export function dishKey(d: Dish): string {
  switch (d.kind) {
    case 'burger': return 'burger:' + [...d.top].sort().join(',');
    case 'fries': return 'fries';
    case 'drink': return 'drink:' + d.flavor;
    case 'coffee': return 'coffee:' + (d.cap ? 'cap' : 'esp');
  }
}

// ------------------------------------------------------------------ подобрения
export type UpgradeTab = 'kitchen' | 'hall' | 'staff';
export interface UpgradeDef {
  id: string;
  tab: UpgradeTab;
  name: string;
  desc: string;
  icon: string;
  values: number[]; // стойност за всяко ниво (0 = начално)
  costs: number[]; // цена за преминаване към ниво 1, 2, ...
  fmt?: (v: number) => string;
  more?: { step: number; grow: number }; // безкрайни нива след последното: +step към стойността, цената x grow
}

const sec = (v: number) => `${v.toFixed(1)} сек`;
const plus = (v: number) => `+${v} €`;
const pct = (v: number) => `+${v}%`;

export const UPGRADES: UpgradeDef[] = [
  // кухня
  { id: 'grill_slots', tab: 'kitchen', name: 'Голяма скара', desc: 'Места за кюфтета на скарата', icon: 'patty_cooked', values: [2, 3, 4], costs: [150, 700] },
  { id: 'grill_speed', tab: 'kitchen', name: 'Гореща скара', desc: 'Време за изпичане на страна', icon: 'grill', values: [3.4, 2.8, 2.2, 1.8], costs: [90, 380, 1200], fmt: sec },
  { id: 'fryer_baskets', tab: 'kitchen', name: 'Кошници за пържене', desc: 'Колко кошници картофи едновременно', icon: 'basket', values: [1, 2, 3], costs: [160, 900] },
  { id: 'fryer_speed', tab: 'kitchen', name: 'Бърз фритюрник', desc: 'Време до златисти картофки', icon: 'fries_golden', values: [5.5, 4.4, 3.4], costs: [110, 520], fmt: sec },
  { id: 'fryer_safe', tab: 'kitchen', name: 'Умен фритюрник', desc: 'Колко дълго остават златисти', icon: 'clock', values: [2.6, 4, 6], costs: [220, 800], fmt: sec },
  { id: 'warmer', tab: 'kitchen', name: 'Топла витрина', desc: 'Порции картофки от една кошница', icon: 'fries_box', values: [3, 4, 5], costs: [170, 750] },
  { id: 'soda_speed', tab: 'kitchen', name: 'Силна струя', desc: 'Време за пълнене на чаша', icon: 'drink_cola', values: [1.9, 1.4, 1.0], costs: [80, 420], fmt: sec },
  { id: 'soda_auto', tab: 'kitchen', name: 'Автоматичен автомат', desc: 'С едно докосване пълни чашата перфектно', icon: 'bolt', values: [0, 1], costs: [1100], fmt: (v) => (v ? 'ДА' : 'НЕ') },
  { id: 'plates', tab: 'kitchen', name: 'Още чинии', desc: 'Бургери, които сглобяваш едновременно', icon: 'plate', values: [2, 3, 4], costs: [320, 1400] },
  { id: 'knife', tab: 'kitchen', name: 'Остър нож', desc: 'Колко разреза трябват на продукт', icon: 'knife', values: [3, 2, 1], costs: [70, 320] },
  { id: 'meat', tab: 'kitchen', name: 'Качествено месо', desc: 'Бургерите стават по-скъпи', icon: 'patty_raw', values: [0, 1, 2, 3], costs: [220, 800, 2200], fmt: plus, more: { step: 1, grow: 2 } },
  { id: 'potatoes', tab: 'kitchen', name: 'Селски картофи', desc: 'Картофките стават по-скъпи', icon: 'potato', values: [0, 1, 2], costs: [260, 1100], fmt: plus, more: { step: 1, grow: 2.2 } },
  { id: 'syrup', tab: 'kitchen', name: 'Леден сироп', desc: 'Напитките стават по-скъпи', icon: 'drink_fanta', values: [0, 1, 2], costs: [160, 850], fmt: plus, more: { step: 1, grow: 2.2 } },
  // зала
  { id: 'tables', tab: 'hall', name: 'Маси', desc: 'Повече маси = повече клиенти наведнъж', icon: 'table', values: [2, 3, 4, 5, 6], costs: [90, 320, 800, 1700] },
  { id: 'plants', tab: 'hall', name: 'Цветя', desc: 'Клиентите чакат по-търпеливо', icon: 'plant', values: [0, 8, 15], costs: [150, 600], fmt: pct },
  { id: 'pictures', tab: 'hall', name: 'Картини', desc: 'По-големи бакшиши', icon: 'picture', values: [0, 8, 15], costs: [200, 750], fmt: pct, more: { step: 5, grow: 1.9 } },
  { id: 'jukebox', tab: 'hall', name: 'Музикален автомат', desc: 'Още търпение и бакшиш', icon: 'jukebox', values: [0, 10], costs: [1200], fmt: pct },
  { id: 'neon', tab: 'hall', name: 'Неонова табела', desc: 'Идват повече VIP клиенти', icon: 'neon', values: [0, 1], costs: [1800], fmt: (v) => (v ? 'ДА' : 'НЕ') },
  // персонал
  { id: 'waiter', tab: 'staff', name: 'Сервитьор', desc: 'Сам носи готовата храна на масите', icon: 'staff_waiter', values: [0, 1, 2, 3], costs: [450, 1100, 2400], fmt: (v) => (v ? `ниво ${v}` : 'няма') },
  { id: 'cleaner', tab: 'staff', name: 'Чистач', desc: 'Сам почиства мръсните маси', icon: 'staff_cleaner', values: [0, 1, 2], costs: [260, 900], fmt: (v) => (v ? `ниво ${v}` : 'няма') },
  { id: 'grill_cook', tab: 'staff', name: 'Готвач на скарата', desc: 'Обръща кюфтетата (ниво 2: и ги слага)', icon: 'staff_cook', values: [0, 1, 2], costs: [700, 1700], fmt: (v) => (v ? `ниво ${v}` : 'няма') },
  { id: 'fry_cook', tab: 'staff', name: 'Готвач на картофки', desc: 'Вади картофките навреме (ниво 2: и ги реже)', icon: 'staff_cook2', values: [0, 1, 2], costs: [700, 1700], fmt: (v) => (v ? `ниво ${v}` : 'няма') },
  { id: 'barista', tab: 'staff', name: 'Барман', desc: 'Сам налива поръчаните напитки', icon: 'staff_barista', values: [0, 1, 2], costs: [650, 1500], fmt: (v) => (v ? `ниво ${v}` : 'няма') },
  { id: 'prep', tab: 'staff', name: 'Помощник', desc: 'Сам реже доматите', icon: 'staff_prep', values: [0, 1], costs: [550], fmt: (v) => (v ? 'нает' : 'няма') },
  { id: 'manager', tab: 'staff', name: 'Мениджър', desc: 'Печели пари, докато играта е затворена', icon: 'staff_manager', values: [0, 1, 2, 3], costs: [1500, 4000, 9000], fmt: (v) => (v ? `${[0, 2, 4, 8][v]} ч.` : 'няма') },
];

/** Стойност на подобрението на ниво lvl (и за безкрайните нива). */
export function upgradeValue(u: UpgradeDef, lvl: number): number {
  const last = u.values.length - 1;
  if (lvl <= last || !u.more) return u.values[Math.min(lvl, last)];
  return u.values[last] + (lvl - last) * u.more.step;
}

/** Цена за минаване от ниво lvl към lvl+1 (undefined = максимум). */
export function upgradeCost(u: UpgradeDef, lvl: number): number | undefined {
  if (lvl < u.costs.length) return u.costs[lvl];
  if (!u.more) return undefined;
  const c = u.costs[u.costs.length - 1] * Math.pow(u.more.grow, lvl - u.costs.length + 1);
  return c < 10000 ? Math.round(c / 50) * 50 : Math.round(c / 500) * 500;
}

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

// ------------------------------------------------------------------ клиенти
export interface CustType {
  id: string;
  name: string;
  patience: number; // множител
  tip: number; // множител
  maxItems: number;
  minItems: number;
  scale: number;
  looks: CustomerLook[];
  weight: number;
}

const SKINS = ['#ffdbb5', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffe0c7'];
const HAIRS = ['#2b1a0f', '#6d4c41', '#f4c542', '#d35400', '#1a1a1a', '#8d6e63'];
const SHIRTS = ['#42a5f5', '#66bb6a', '#ab47bc', '#ffa726', '#26c6da', '#ef5350', '#ffee58', '#8d6e63'];
const PANTS = ['#1e3a8a', '#37474f', '#5d4037', '#283593'];

function looks(n: number, seed: number, base: Partial<CustomerLook>, styles: CustomerLook['hairStyle'][]): CustomerLook[] {
  const out: CustomerLook[] = [];
  for (let i = 0; i < n; i++) {
    const k = seed + i * 7;
    out.push({
      skin: SKINS[(k * 3) % SKINS.length],
      hair: HAIRS[(k * 5 + 1) % HAIRS.length],
      hairStyle: styles[(k + i) % styles.length],
      shirt: SHIRTS[(k * 7 + 2) % SHIRTS.length],
      pants: PANTS[k % PANTS.length],
      ...base,
    });
  }
  return out;
}

export const CUST_TYPES: CustType[] = [
  { id: 'adult', name: 'Клиент', patience: 1, tip: 1, minItems: 1, maxItems: 4, scale: 1, weight: 60, looks: looks(8, 1, {}, ['short', 'long', 'bun', 'curly', 'pony', 'short']) },
  { id: 'kid', name: 'Дете', patience: 0.8, tip: 0.7, minItems: 1, maxItems: 2, scale: 0.78, weight: 14, looks: looks(4, 3, { extra: 'cap' }, ['short', 'pony']).concat(looks(2, 9, { extra: 'bow' }, ['long'])) },
  { id: 'granny', name: 'Баба', patience: 1.45, tip: 1.35, minItems: 1, maxItems: 2, scale: 0.95, weight: 10, looks: looks(3, 5, { hair: '#e0e0e0', extra: 'glasses' }, ['bun', 'curly', 'bald']) },
  { id: 'business', name: 'Бизнесмен', patience: 0.72, tip: 1.6, minItems: 2, maxItems: 4, scale: 1, weight: 10, looks: looks(3, 7, { shirt: '#eceff1', extra: 'tie', pants: '#263238' }, ['short', 'bald', 'short']) },
  { id: 'tourist', name: 'Турист', patience: 1.1, tip: 1.2, minItems: 2, maxItems: 4, scale: 1, weight: 8, looks: looks(3, 11, { extra: 'hat', shirt: '#ff7043' }, ['short', 'long']) },
  { id: 'vip', name: 'VIP', patience: 0.75, tip: 2.6, minItems: 3, maxItems: 5, scale: 1.02, weight: 3, looks: looks(2, 13, { extra: 'shades', shirt: '#212121' }, ['short', 'long']).map((l) => ({ ...l, extra: 'shades' as const })) },
  { id: 'critic', name: 'Критик', patience: 0.85, tip: 1.5, minItems: 2, maxItems: 3, scale: 1, weight: 2, looks: looks(1, 17, { extra: 'beret', shirt: '#6a1b9a', hairStyle: 'short' }, ['short']) },
];

// ------------------------------------------------------------------ локации и нива
export interface LocationDef {
  id: string;
  name: string;
  desc: string;
  levels: number;
  unlockStars: number;
  unlockCost: number;
  wall: number;
  wall2: number;
  floorA: number;
  floorB: number;
  ready: boolean;
}

export const LOCATIONS: LocationDef[] = [
  { id: 'stand', name: 'Бургер будка', desc: 'Бургери, картофки и кола', levels: 20, unlockStars: 0, unlockCost: 0, wall: 0xffe0b2, wall2: 0xffcc80, floorA: 0xfff3e0, floorB: 0xef5350, ready: true },
  { id: 'diner', name: 'Крайпътно заведение', desc: 'Лук, краставички, Фанта и Спрайт', levels: 20, unlockStars: 40, unlockCost: 3000, wall: 0xb3e5fc, wall2: 0x81d4fa, floorA: 0xeceff1, floorB: 0x546e7a, ready: false },
  { id: 'cafe', name: 'Кафене в града', desc: 'Кафе, капучино и донъти', levels: 20, unlockStars: 90, unlockCost: 9000, wall: 0xd7ccc8, wall2: 0xbcaaa4, floorA: 0xefebe9, floorB: 0x8d6e63, ready: false },
  { id: 'beach', name: 'Плажен бар', desc: 'Фрешове, шейкове и сладолед', levels: 20, unlockStars: 140, unlockCost: 20000, wall: 0xfff9c4, wall2: 0x80deea, floorA: 0xfff8e1, floorB: 0xffcc80, ready: false },
  { id: 'pizza', name: 'Пицария', desc: 'Пица от тестото до фурната', levels: 20, unlockStars: 190, unlockCost: 40000, wall: 0xc8e6c9, wall2: 0xef9a9a, floorA: 0xfafafa, floorB: 0x388e3c, ready: false },
  { id: 'mall', name: 'Ресторант в мола', desc: 'Всичко наведнъж — огромен ресторант', levels: 20, unlockStars: 240, unlockCost: 80000, wall: 0xe1bee7, wall2: 0xce93d8, floorA: 0xf3e5f5, floorB: 0x6a1b9a, ready: false },
];

export interface Challenge {
  type: 'noLoss' | 'perfectFries' | 'combo' | 'served' | 'perfectDrinks';
  value: number;
  text: string;
}

export interface LevelDef {
  loc: string;
  n: number;
  customers: number;
  gap: [number, number];
  patience: number;
  toppings: Topping[];
  fries: boolean;
  drinks: Flavor[];
  maxItems: number;
  maxToppings: number;
  goals: [number, number, number];
  challenge?: Challenge;
  tutorial?: 'basics' | 'fries' | 'cheese' | 'tomato' | 'lettuce' | 'tables';
  special: number; // шанс за VIP/критик и т.н. (0..1)
}

export const PRICE = { burger: 5, topping: 1, fries: 3, drink: 2, coffee: 3, cap: 4 };

// детерминистичен генератор на случайни числа
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Безкрайни дни: всичко след последното нормално ниво на локацията. */
export function isEndless(locId: string, n: number): boolean {
  const L = LOCATIONS.find((l) => l.id === locId);
  return !!L && n > L.levels;
}

// предизвикателство на всеки 5-и безкраен ден (редуват се)
function endlessChallenge(k: number, customers: number): Challenge | undefined {
  if (k % 5 !== 0) return undefined;
  const step = k / 5; // 1, 2, 3...
  const more = Math.floor(step / 6); // всеки пълен кръг става малко по-трудно
  const list: Challenge[] = [
    { type: 'combo', value: 4, text: 'Направи комбо x4' },
    { type: 'perfectFries', value: 8 + more * 2, text: `Направи ${8 + more * 2} перфектни картофки` },
    { type: 'perfectDrinks', value: 12 + more * 2, text: `Налей ${12 + more * 2} перфектни напитки` },
    { type: 'served', value: customers - 2, text: `Обслужи поне ${customers - 2} клиента` },
    { type: 'combo', value: 5, text: 'Направи комбо x5' },
    { type: 'noLoss', value: 0, text: 'Не изпускай нито един клиент' },
  ];
  return list[(step - 1) % list.length];
}

export function levelDef(locId: string, n: number): LevelDef {
  const endless = isEndless(locId, n);
  const t = endless ? 1 : (n - 1) / 19;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const toppings: Topping[] = [];
  if (n >= 3) toppings.push('cheese');
  if (n >= 4) toppings.push('tomato');
  if (n >= 6) toppings.push('lettuce');
  const drinks: Flavor[] = ['cola'];
  if (n >= 7) drinks.push('fanta');
  if (n >= 13) drinks.push('sprite');
  const def: LevelDef = {
    loc: locId,
    n,
    customers: Math.round(5 + n * 1.2),
    gap: [lerp(11, 3.6), lerp(15, 6)],
    patience: lerp(48, 24),
    toppings,
    fries: n >= 2,
    drinks,
    maxItems: n <= 2 ? 2 : n <= 7 ? 3 : 4,
    maxToppings: n <= 5 ? 1 : n <= 11 ? 2 : 3,
    goals: [0, 0, 0],
    special: n <= 4 ? 0 : lerp(0.05, 0.16),
  };
  if (n === 1) { def.customers = 5; def.tutorial = 'basics'; def.patience = 70; }
  if (n === 2) { def.tutorial = 'fries'; def.patience = 62; }
  if (n === 3) def.tutorial = 'cheese';
  if (n === 4) def.tutorial = 'tomato';
  if (n === 6) def.tutorial = 'lettuce';
  const ch: Record<number, Challenge> = {
    5: { type: 'noLoss', value: 0, text: 'Не изпускай нито един клиент' },
    8: { type: 'perfectFries', value: 6, text: 'Направи 6 перфектни картофки' },
    11: { type: 'combo', value: 3, text: 'Направи комбо x3' },
    14: { type: 'perfectDrinks', value: 10, text: 'Налей 10 перфектни напитки' },
    17: { type: 'noLoss', value: 0, text: 'Не изпускай нито един клиент' },
    20: { type: 'combo', value: 4, text: 'Направи комбо x4' },
  };
  def.challenge = ch[n];
  if (endless) {
    // след ден 20 трудността расте всеки ден, но плавно доближава таван и никога не става невъзможна
    const k = n - 20;
    const f = 1 - Math.exp(-k / 25); // 0 → 1
    def.customers = Math.min(70, 29 + Math.round(k * 1.1));
    def.gap = [3.6 - 1.3 * f, 6 - 2.2 * f];
    def.patience = 24 - 8 * f;
    def.special = 0.16 + 0.18 * f;
    def.challenge = endlessChallenge(k, def.customers);
  }
  // цели — от средната стойност на поръчка
  const r = rng(1000 + n);
  let sum = 0;
  const N = 300;
  for (let i = 0; i < N; i++) sum += orderValue(makeOrder(def, r, 1, def.maxItems));
  const base = (sum / N) * def.customers;
  def.goals = [roundGoal(base * 0.75), roundGoal(base * 1.1), roundGoal(base * 1.45)];
  return def;
}

function roundGoal(v: number) {
  return v < 100 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10;
}

export function orderValue(items: Dish[], bonus = { meat: 0, potatoes: 0, syrup: 0 }): number {
  let v = 0;
  for (const d of items) v += dishPrice(d, bonus);
  return v;
}

export function dishPrice(d: Dish, bonus = { meat: 0, potatoes: 0, syrup: 0 }): number {
  switch (d.kind) {
    case 'burger': return PRICE.burger + PRICE.topping * d.top.length + bonus.meat;
    case 'fries': return PRICE.fries + bonus.potatoes;
    case 'drink': return PRICE.drink + bonus.syrup;
    case 'coffee': return d.cap ? PRICE.cap : PRICE.coffee;
  }
}

export function makeOrder(level: LevelDef, r: () => number, minItems: number, maxItems: number): Dish[] {
  const max = Math.max(1, Math.min(level.maxItems, maxItems));
  const min = Math.min(minItems, max);
  const count = min + Math.floor(r() * (max - min + 1));
  const out: Dish[] = [];
  let burgers = 0, fries = 0, drinks = 0;
  for (let i = 0; i < count; i++) {
    const opts: [string, number][] = [];
    if (burgers < (level.n >= 8 ? 2 : 1)) opts.push(['burger', burgers === 0 ? 50 : 18]);
    if (level.fries && fries < 1) opts.push(['fries', 30]);
    if (drinks < 1) opts.push(['drink', 30]);
    if (!opts.length) break;
    const total = opts.reduce((a, o) => a + o[1], 0);
    let x = r() * total;
    let pick = opts[0][0];
    for (const [k, wgt] of opts) { x -= wgt; if (x <= 0) { pick = k; break; } }
    if (pick === 'burger') {
      burgers++;
      const top: Topping[] = [];
      for (const t of level.toppings) if (top.length < level.maxToppings && r() < 0.55) top.push(t);
      out.push({ kind: 'burger', top });
    } else if (pick === 'fries') { fries++; out.push({ kind: 'fries' }); }
    else { drinks++; out.push({ kind: 'drink', flavor: level.drinks[Math.floor(r() * level.drinks.length)] }); }
  }
  // първо храна, после напитки (по-подредено балонче)
  const rank = { burger: 0, fries: 1, coffee: 2, drink: 3 } as const;
  out.sort((a, b) => rank[a.kind] - rank[b.kind]);
  return out;
}

export const XP_PER_LEVEL = (lvl: number) => 60 + lvl * 40;
