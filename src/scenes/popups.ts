// Изскачащи прозорци: ежедневна награда, офлайн печалба.

import Phaser from 'phaser';
import { W } from '../config/game';
import { S, save, today, daysBetween, upValue, totalStars } from '../data/save';
import { button, panel, txt, mkImg, dim, C, sparkles, roundRect } from '../ui/kit';
import { sfx } from '../audio/sfx';

interface DailyReward { coins?: number; gems?: number; freeze?: number; tips?: number; label: string; icon: string }

export const DAILY: DailyReward[] = [
  { coins: 50, label: '50', icon: 'coin' },
  { coins: 90, label: '90', icon: 'coin' },
  { gems: 2, label: '2', icon: 'gem' },
  { coins: 160, label: '160', icon: 'coin' },
  { freeze: 2, label: '2', icon: 'snow' },
  { coins: 260, label: '260', icon: 'coin' },
  { gems: 5, tips: 2, label: '5 + бонус', icon: 'gift' },
];

export function showDaily(scene: Phaser.Scene, done: () => void): void {
  const sv = S();
  const t = today();
  if (sv.daily.last === t) { done(); return; }
  const gap = daysBetween(sv.daily.last, t);
  const streak = gap === 1 ? sv.daily.streak % 7 : 0;
  const layer = scene.add.container(0, 0).setDepth(1500);
  layer.add(dim(scene));
  const p = panel(scene, W / 2, 380, 900, 420, C.cream, 'ЕЖЕДНЕВНА НАГРАДА', C.purple);
  layer.add(p);
  p.add(txt(scene, 0, -140, 'Влизай всеки ден за по-големи награди!', 24, { color: '#6d4c41', stroke: '#fff', strokeW: 0, add: false }));
  DAILY.forEach((r, i) => {
    const x = (i - 3) * 118, y = -20;
    const g = scene.make.graphics({}, false);
    const cur = i === streak;
    roundRect(g, x - 52, y - 70, 104, 150, 16, i < streak ? 0xc8e6c9 : cur ? 0xfff176 : 0xffffff, C.brown, cur ? 5 : 3);
    p.add(g);
    p.add(txt(scene, x, y - 48, `Ден ${i + 1}`, 18, { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false }));
    p.add(mkImg(scene, x, y + 4, r.icon, 0.9));
    p.add(txt(scene, x, y + 52, r.label, 18, { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false }));
    if (i < streak) p.add(mkImg(scene, x + 30, y - 44, 'check', 0.6));
    if (cur) {
      const glow = mkImg(scene, x, y + 4, 'spark', 3).setAlpha(0.5);
      p.addAt(glow, p.list.length - 2);
      scene.tweens.add({ targets: glow, angle: 360, duration: 4000, repeat: -1 });
    }
  });
  p.add(button(scene, 0, 140, 300, 76, 'ВЗЕМИ', C.green, () => {
    const r = DAILY[streak];
    sv.coins += r.coins ?? 0;
    sv.gems += r.gems ?? 0;
    sv.boosters.freeze = (sv.boosters.freeze ?? 0) + (r.freeze ?? 0);
    sv.boosters.tips = (sv.boosters.tips ?? 0) + (r.tips ?? 0);
    sv.daily = { last: t, streak: streak + 1 };
    save();
    sfx.buy();
    sparkles(scene, W / 2 + (streak - 3) * 118, 360, 16, 'spark', 100, 1600);
    scene.time.delayedCall(500, () => { layer.destroy(); done(); });
  }, { size: 32 }));
  p.setScale(0.5);
  scene.tweens.add({ targets: p, scale: 1, duration: 300, ease: 'Back.Out' });
}

export function showOffline(scene: Phaser.Scene, done: () => void): void {
  const sv = S();
  const lvl = upValue('manager', 'stand');
  const mins = (Date.now() - sv.lastSeen) / 60000;
  if (!lvl || mins < 5) { done(); return; }
  const cap = [0, 2, 4, 8][lvl] * 60;
  const rate = 0.6 + totalStars() * 0.04;
  const coins = Math.floor(Math.min(mins, cap) * rate);
  if (coins <= 0) { done(); return; }
  const layer = scene.add.container(0, 0).setDepth(1500);
  layer.add(dim(scene));
  const p = panel(scene, W / 2, 380, 560, 380, C.cream, 'ДОКАТО ТЕ НЯМАШЕ', C.blue);
  layer.add(p);
  p.add(mkImg(scene, -170, -20, 'staff_manager', 0.8));
  p.add(txt(scene, 60, -80, 'Мениджърът поддържаше\nресторанта отворен и изкара:', 22, { color: '#4a2c17', stroke: '#fff', strokeW: 0, add: false }));
  p.add(mkImg(scene, 0, 0, 'coin', 1.2));
  p.add(txt(scene, 80, 0, String(coins), 48, { color: '#ffb300', add: false }));
  p.add(button(scene, -110, 120, 200, 70, 'ВЗЕМИ', C.green, () => collect(1), { size: 28 }));
  p.add(button(scene, 110, 120, 200, 70, 'x2 за 2', C.purple, () => {
    if (sv.gems < 2) { sfx.nope(); return; }
    sv.gems -= 2;
    collect(2);
  }, { icon: 'gem', iconScale: 0.55, size: 24 }));
  const collect = (m: number) => {
    sv.coins += coins * m;
    save();
    sfx.coin();
    sparkles(scene, W / 2, 380, 16, 'coin', 120, 1600);
    scene.time.delayedCall(400, () => { layer.destroy(); done(); });
  };
  p.setScale(0.5);
  scene.tweens.add({ targets: p, scale: 1, duration: 300, ease: 'Back.Out' });
}
