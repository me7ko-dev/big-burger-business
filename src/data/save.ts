// Прогресът на играча — пази се в localStorage и се записва автоматично.

import { LOCATIONS, UPGRADE_BY_ID, XP_PER_LEVEL } from '../config/game';

export interface LocSave {
  unlocked: boolean;
  stars: number[]; // звезди за всяко ниво (индекс = ниво-1)
  up: Record<string, number>; // ниво на всяко подобрение
}

export interface SaveData {
  v: 1;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  locs: Record<string, LocSave>;
  current: string;
  settings: { sound: boolean; music: boolean; vibe: boolean };
  daily: { last: string; streak: number };
  wheel: string; // дата на последното завъртане
  tasks: { date: string; list: DailyTask[] };
  ach: Record<string, number>; // взети нива на постижения
  stats: Record<string, number>;
  boosters: Record<string, number>;
  lastSeen: number;
  seenTips: string[];
}

export interface DailyTask { id: string; text: string; stat: string; goal: number; progress: number; reward: number; gem: number; claimed: boolean }

const KEY = 'bbb-save-v1';

function fresh(): SaveData {
  const locs: Record<string, LocSave> = {};
  for (const l of LOCATIONS) locs[l.id] = { unlocked: l.unlockCost === 0, stars: new Array(l.levels).fill(0), up: {} };
  return {
    v: 1,
    coins: 0,
    gems: 5,
    xp: 0,
    level: 1,
    locs,
    current: 'stand',
    settings: { sound: true, music: true, vibe: true },
    daily: { last: '', streak: 0 },
    wheel: '',
    tasks: { date: '', list: [] },
    ach: {},
    stats: {},
    boosters: { freeze: 1, tips: 1, robot: 0 },
    lastSeen: Date.now(),
    seenTips: [],
  };
}

let data: SaveData = load();

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveData;
      const base = fresh();
      const merged: SaveData = { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings }, boosters: { ...base.boosters, ...parsed.boosters } };
      for (const l of LOCATIONS) {
        const s = merged.locs[l.id];
        if (!s) merged.locs[l.id] = base.locs[l.id];
        else while (s.stars.length < l.levels) s.stars.push(0);
      }
      return merged;
    }
  } catch {
    /* повреден или недостъпен запис — започваме наново */
  }
  return fresh();
}

export function save(): void {
  data.lastSeen = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* няма място / частен режим */
  }
}

export function S(): SaveData {
  return data;
}

export function resetSave(): void {
  data = fresh();
  save();
}

export function loc(id = data.current): LocSave {
  return data.locs[id];
}

export function upLevel(id: string, locId = data.current): number {
  return loc(locId).up[id] ?? 0;
}

export function upValue(id: string, locId = data.current): number {
  const def = UPGRADE_BY_ID[id];
  return def.values[Math.min(upLevel(id, locId), def.values.length - 1)];
}

export function totalStars(): number {
  let s = 0;
  for (const l of Object.values(data.locs)) for (const x of l.stars) s += x;
  return s;
}

export function addStat(key: string, v = 1): void {
  data.stats[key] = (data.stats[key] ?? 0) + v;
  for (const t of data.tasks.list) if (t.stat === key && !t.claimed) t.progress = Math.min(t.goal, t.progress + v);
}

/** Добавя опит; връща броя нови нива на играча. */
export function addXp(v: number): number {
  data.xp += v;
  let ups = 0;
  while (data.xp >= XP_PER_LEVEL(data.level)) {
    data.xp -= XP_PER_LEVEL(data.level);
    data.level++;
    ups++;
  }
  return ups;
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function daysBetween(a: string, b: string): number {
  if (!a) return 999;
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]), db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}
