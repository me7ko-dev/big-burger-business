import Phaser from 'phaser';
import { W, H } from '../config/game';
import { S, save, today, totalStars, type DailyTask } from '../data/save';
import { button, txt, mkImg, C, roundRect, sparkles, fmt } from '../ui/kit';
import { menuBg } from '../ui/bg';
import { TopBar } from '../ui/topbar';
import { sfx } from '../audio/sfx';

const POOL: Omit<DailyTask, 'progress' | 'claimed'>[] = [
  { id: 'serve', text: 'Обслужи 25 клиента', stat: 'customersServed', goal: 25, reward: 120, gem: 0 },
  { id: 'earn', text: 'Изкарай 500 лв', stat: 'coinsEarned', goal: 500, reward: 150, gem: 0 },
  { id: 'burg', text: 'Направи 20 бургера', stat: 'burgers', goal: 20, reward: 100, gem: 0 },
  { id: 'fries', text: 'Направи 10 перфектни картофки', stat: 'perfectFries', goal: 10, reward: 100, gem: 0 },
  { id: 'drinks', text: 'Налей 10 перфектни напитки', stat: 'perfectDrinks', goal: 10, reward: 100, gem: 0 },
  { id: 'win', text: 'Спечели 3 нива', stat: 'levelsWon', goal: 3, reward: 80, gem: 1 },
  { id: 'tom', text: 'Нарежи 8 домата', stat: 'tomatoesCut', goal: 8, reward: 80, gem: 0 },
  { id: 'combo', text: 'Направи комбо x4', stat: 'bigCombo', goal: 1, reward: 50, gem: 2 },
  { id: 'three', text: 'Вземи 3 звезди на ниво', stat: 'threeStars', goal: 1, reward: 60, gem: 1 },
];

interface Ach { id: string; name: string; stat: string | (() => number); tiers: number[]; gems: number[] }
const ACHS: Ach[] = [
  { id: 'served', name: 'Обслужени клиенти', stat: 'customersServed', tiers: [50, 250, 1000, 5000], gems: [2, 3, 5, 10] },
  { id: 'coins', name: 'Изкарани пари', stat: 'coinsEarned', tiers: [1000, 10000, 50000, 200000], gems: [2, 3, 5, 10] },
  { id: 'burgers', name: 'Бургер майстор', stat: 'burgers', tiers: [50, 300, 1500], gems: [2, 4, 8] },
  { id: 'fries', name: 'Крал на картофките', stat: 'perfectFries', tiers: [30, 200, 1000], gems: [2, 4, 8] },
  { id: 'drinks', name: 'Барман', stat: 'perfectDrinks', tiers: [30, 200, 1000], gems: [2, 4, 8] },
  { id: 'stars', name: 'Звезден шеф', stat: () => totalStars(), tiers: [10, 30, 60], gems: [3, 5, 10] },
  { id: 'combo', name: 'Комбо машина', stat: 'bigCombo', tiers: [1, 10, 50], gems: [2, 4, 8] },
];

export function ensureTasks(): void {
  const sv = S();
  const t = today();
  if (sv.tasks.date === t && sv.tasks.list.length) return;
  const pool = [...POOL];
  const list: DailyTask[] = [];
  let seed = t.split('-').reduce((a, x) => a * 31 + Number(x), 7);
  while (list.length < 3 && pool.length) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const p = pool.splice(seed % pool.length, 1)[0];
    list.push({ ...p, progress: 0, claimed: false });
  }
  sv.tasks = { date: t, list };
  save();
}

export function claimableCount(): number {
  ensureTasks();
  const sv = S();
  let n = sv.tasks.list.filter((t) => !t.claimed && t.progress >= t.goal).length;
  for (const a of ACHS) {
    const got = sv.ach[a.id] ?? 0;
    if (got < a.tiers.length && achValue(a) >= a.tiers[got]) n++;
  }
  return n;
}

function achValue(a: Ach): number {
  return typeof a.stat === 'function' ? a.stat() : S().stats[a.stat] ?? 0;
}

export class TasksScene extends Phaser.Scene {
  bar!: TopBar;
  constructor() {
    super('Tasks');
  }

  create(): void {
    ensureTasks();
    menuBg(this, 0xa5d6a7, 0x66bb6a, false);
    this.bar = new TopBar(this);
    button(this, W - 70, 32, 110, 50, 'НАЗАД', C.orange, () => this.scene.start('Map'), { size: 20 }).setDepth(902);
    const sv = S();
    const dark = { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false } as const;
    // ежедневни задачи
    txt(this, 320, 100, 'ЗАДАЧИ ЗА ДНЕС', 32);
    sv.tasks.list.forEach((t, i) => {
      const y = 190 + i * 150;
      const c = this.add.container(320, y);
      const g = this.make.graphics({}, false);
      roundRect(g, -290, -62, 580, 124, 20, t.claimed ? 0xe8f5e9 : 0xfffdf5, C.brown, 4);
      c.add(g);
      c.add(txt(this, -270, -30, t.text, 22, dark).setOrigin(0, 0.5));
      const bg = this.make.graphics({}, false);
      roundRect(bg, -270, 0, 300, 22, 11, 0xd7ccc8, C.brown, 2);
      const f = Math.min(1, t.progress / t.goal);
      if (f > 0) { bg.fillStyle(0x43a047, 1); bg.fillRoundedRect(-268, 2, Math.max(18, 296 * f), 18, 9); }
      c.add(bg);
      c.add(txt(this, -120, 11, `${Math.min(t.progress, t.goal)} / ${t.goal}`, 15, { color: '#fff', add: false }));
      const rew = String(t.reward);
      if (t.gem) { c.add(mkImg(this, 70, -30, 'gem', 0.55)); c.add(txt(this, 92, -30, `+${t.gem}`, 18, { color: '#0097a7', stroke: '#fff', strokeW: 0, add: false }).setOrigin(0, 0.5)); }
      if (t.claimed) c.add(mkImg(this, 200, 0, 'check', 1.2));
      else {
        const ok = t.progress >= t.goal;
        const b = button(this, 180, 8, 170, 60, rew, ok ? C.green : 0x9e9e9e, () => {
          if (!ok) { sfx.nope(); return; }
          t.claimed = true;
          sv.coins += t.reward;
          sv.gems += t.gem;
          save();
          sfx.buy();
          sparkles(this, 500, y, 14, 'coin', 90);
          this.time.delayedCall(350, () => this.scene.restart());
        }, { icon: 'coin', iconScale: 0.45, size: 20, noSound: true });
        c.add(b);
        if (ok) this.tweens.add({ targets: b, scale: 1.08, duration: 450, yoyo: true, repeat: -1 });
      }
    });
    txt(this, 320, 660, 'Нови задачи всеки ден!', 20, { color: '#ffffff' });
    // постижения
    txt(this, 960, 100, 'ПОСТИЖЕНИЯ', 32);
    ACHS.forEach((a, i) => {
      const y = 160 + i * 76;
      const got = sv.ach[a.id] ?? 0;
      const done = got >= a.tiers.length;
      const goal = done ? a.tiers[a.tiers.length - 1] : a.tiers[got];
      const v = achValue(a);
      const c = this.add.container(960, y);
      const g = this.make.graphics({}, false);
      roundRect(g, -300, -32, 600, 66, 16, 0xfffdf5, C.brown, 3);
      c.add(g);
      for (let k = 0; k < a.tiers.length; k++) c.add(mkImg(this, -280 + k * 20, 0, k < got ? 'star' : 'star_empty', 0.3));
      c.add(txt(this, -190, -10, a.name, 20, dark).setOrigin(0, 0.5));
      c.add(txt(this, -190, 16, done ? 'Завършено!' : `${fmt(Math.min(v, goal))} / ${fmt(goal)}`, 15, { ...dark, weight: 700 }).setOrigin(0, 0.5));
      if (!done) {
        const ok = v >= goal;
        const b = button(this, 220, 0, 130, 50, `${a.gems[got]}`, ok ? C.blue : 0x9e9e9e, () => {
          if (!ok) { sfx.nope(); return; }
          sv.ach[a.id] = got + 1;
          sv.gems += a.gems[got];
          save();
          sfx.levelUp();
          sparkles(this, 1180, y, 14, 'gem', 80);
          this.time.delayedCall(350, () => this.scene.restart());
        }, { icon: 'gem', iconScale: 0.5, size: 22, noSound: true });
        c.add(b);
        if (ok) this.tweens.add({ targets: b, scale: 1.08, duration: 450, yoyo: true, repeat: -1 });
      } else c.add(mkImg(this, 220, 0, 'check', 0.9));
    });
    void H;
  }
}
