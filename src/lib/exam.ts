import type { Command, Level, OS, Software, Tool } from '../data/types';
import { COMMANDS, TOOLS } from '../data';
import { nameMatches, shortcutMatches } from './shortcut';

export type ExamCategory = 'tools' | 'commands';
export type Feedback = 'each' | 'end';
export type Difficulty = Level;
export type CountChoice = 10 | 20 | 30 | 'all';
export type Format = 'both' | 'name' | 'shortcut'; // which fields the learner must type

export interface ExamConfig {
  software: Software;
  category: ExamCategory;
  difficulty: Difficulty;
  count: CountChoice;
  os: OS;
  feedback: Feedback;
  /** Other Useful Shortcuts exam only: mix in name->shortcut and shortcut->name questions. */
  mixed: boolean;
}

export interface Question {
  id: string;
  kind: ExamCategory;
  itemId: string;
  format: Format;
}

export interface Answer { name: string; shortcut: string }

export interface Graded {
  nameOk: boolean | null; // null = not asked
  shortcutOk: boolean | null;
  points: number;
  max: number;
  status: 'correct' | 'partial' | 'incorrect';
}

export interface Item {
  id: string;
  kind: ExamCategory;
  name: string;
  aliases: string[];
  win: string | null;
  mac: string | null;
  winAlt?: string[];
  macAlt?: string[];
  category: string;
  fn: string;
  level: Level;
  icon?: string;
  note?: string;
  tool?: Tool;
  command?: Command;
}

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function toItem(x: Tool | Command, kind: ExamCategory): Item {
  if (kind === 'tools') {
    const t = x as Tool;
    return { id: t.id, kind, name: t.name, aliases: t.aliases, win: t.win, mac: t.mac, winAlt: t.winAlt, macAlt: t.macAlt,
      category: t.category, fn: t.fn, level: t.level, icon: t.icon, note: t.note, tool: t };
  }
  const c = x as Command;
  return { id: c.id, kind, name: c.name, aliases: c.aliases, win: c.win, mac: c.mac, winAlt: c.winAlt, macAlt: c.macAlt,
    category: c.category, fn: c.description, level: c.level, note: c.note, command: c };
}

export function getItem(sw: Software, kind: ExamCategory, id: string): Item | undefined {
  const list = kind === 'tools' ? TOOLS[sw] : COMMANDS[sw];
  const x = (list as (Tool | Command)[]).find((i) => i.id === id);
  return x ? toItem(x, kind) : undefined;
}

/** Only verified items are eligible for scored exams; difficulty is cumulative. */
export function examPool(cfg: Pick<ExamConfig, 'software' | 'category' | 'difficulty'>): Item[] {
  const list: (Tool | Command)[] = cfg.category === 'tools' ? TOOLS[cfg.software] : COMMANDS[cfg.software];
  return list
    .filter((x) => x.status === 'verified' && LEVEL_RANK[x.level] <= LEVEL_RANK[cfg.difficulty])
    .map((x) => toItem(x, cfg.category));
}

export function availableCounts(poolSize: number): { value: CountChoice; label: string; enabled: boolean }[] {
  return [
    ...([10, 20, 30] as const).map((n) => ({ value: n as CountChoice, label: String(n), enabled: poolSize >= n })),
    { value: 'all' as CountChoice, label: `All Available (${poolSize})`, enabled: poolSize > 0 },
  ];
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuestions(cfg: ExamConfig, rng: () => number = Math.random): Question[] {
  const pool = shuffle(examPool(cfg), rng);
  const n = cfg.count === 'all' ? pool.length : Math.min(cfg.count, pool.length);
  const picked = pool.slice(0, n); // never repeats an item inside one exam
  return picked.map((it, i) => {
    let format: Format = 'both';
    if (cfg.category === 'commands' && cfg.mixed) {
      const r = rng();
      format = r < 0.5 ? 'both' : r < 0.75 ? 'name' : 'shortcut';
      // "type the shortcut from the name" is meaningless if there is nothing to type
      if (it.win === null && it.mac === null) format = 'both';
    }
    return { id: `q${i + 1}-${it.id}`, kind: cfg.category, itemId: it.id, format };
  });
}

export function expectedShortcut(it: Item, os: OS): string | null {
  return os === 'mac' ? it.mac : it.win;
}

export function grade(q: Question, it: Item, a: Answer, os: OS): Graded {
  // format 'name' = shortcut is shown and the learner types the name; 'shortcut' = name is shown and the learner types the shortcut.
  const nameOk = q.format === 'shortcut' ? null : nameMatches(a.name, it.name, it.aliases);
  const shortcutOk = q.format === 'name' ? null
    : shortcutMatches(a.shortcut, expectedShortcut(it, os), os === 'mac' ? it.macAlt : it.winAlt, os);
  const max = (nameOk === null ? 0 : 1) + (shortcutOk === null ? 0 : 1);
  const points = (nameOk ? 1 : 0) + (shortcutOk ? 1 : 0);
  const status = points === max ? 'correct' : points === 0 ? 'incorrect' : 'partial';
  return { nameOk, shortcutOk, points, max, status };
}

export function explain(it: Item, os: OS): string {
  const sc = expectedShortcut(it, os);
  const osName = os === 'mac' ? 'macOS' : 'Windows';
  const base = sc === null
    ? `${it.name} has no dedicated default shortcut on ${osName}. Type "None" for questions like this.`
    : `${it.name} uses ${sc} as its default shortcut on ${osName}.`;
  return it.note ? `${base} ${it.note}` : base;
}

export interface Summary {
  questions: number;
  fullyCorrect: number;
  partial: number;
  incorrect: number;
  namesCorrect: number;
  namesAsked: number;
  shortcutsCorrect: number;
  shortcutsAsked: number;
  points: number;
  max: number;
  percent: number;
  weakCategories: { category: string; percent: number }[];
}

export function summarize(
  rows: { item: Item; graded: Graded }[],
): Summary {
  let fully = 0, partial = 0, wrong = 0, nc = 0, na = 0, sc = 0, sa = 0, pts = 0, max = 0;
  const byCat = new Map<string, { p: number; m: number }>();
  for (const { item, graded: g } of rows) {
    if (g.status === 'correct') fully++; else if (g.status === 'partial') partial++; else wrong++;
    if (g.nameOk !== null) { na++; if (g.nameOk) nc++; }
    if (g.shortcutOk !== null) { sa++; if (g.shortcutOk) sc++; }
    pts += g.points; max += g.max;
    const e = byCat.get(item.category) ?? { p: 0, m: 0 };
    e.p += g.points; e.m += g.max; byCat.set(item.category, e);
  }
  const weak = [...byCat.entries()]
    .map(([category, v]) => ({ category, percent: v.m ? Math.round((v.p / v.m) * 100) : 100 }))
    .filter((c) => c.percent < 80)
    .sort((a, b) => a.percent - b.percent);
  return {
    questions: rows.length, fullyCorrect: fully, partial, incorrect: wrong,
    namesCorrect: nc, namesAsked: na, shortcutsCorrect: sc, shortcutsAsked: sa,
    points: pts, max, percent: max ? Math.round((pts / max) * 1000) / 10 : 0, weakCategories: weak,
  };
}
