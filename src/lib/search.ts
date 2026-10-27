import type { Command, OS, Tool } from '../data';
import { canonShortcut } from './shortcut';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

function shortcutHit(q: string, win: string | null, mac: string | null, os: OS): boolean {
  const want = canonShortcut(q);
  if (!want) return false;
  const have = os === 'mac' ? mac : win;
  return !!have && canonShortcut(have) === want;
}

/** Single characters only match by shortcut (otherwise "v" would match half the names). */
export function matchTool(t: Tool, query: string, os: OS): boolean {
  const q = norm(query);
  if (!q) return true;
  if (shortcutHit(q, t.win, t.mac, os)) return true;
  if (q.length < 2) return false;
  const hay = norm([t.name, ...t.aliases, t.category, t.description, t.fn, t.example, t.win ?? '', t.mac ?? ''].join(' | '));
  return hay.includes(q);
}

export function matchCommand(c: Command, query: string, os: OS): boolean {
  const q = norm(query);
  if (!q) return true;
  if (shortcutHit(q, c.win, c.mac, os)) return true;
  if (q.length < 2) return false;
  const hay = norm([c.name, ...c.aliases, c.category, c.description, c.whenToUse, c.example, c.win, c.mac].join(' | '));
  return hay.includes(q);
}

export type SortKey = 'default' | 'name' | 'shortcut' | 'level';
const LV = { beginner: 0, intermediate: 1, advanced: 2 } as const;

export function sortItems<T extends { name: string; level: keyof typeof LV; win: string | null; mac: string | null }>(items: T[], key: SortKey, os: OS): T[] {
  if (key === 'default') return items;
  const a = items.slice();
  if (key === 'name') a.sort((x, y) => x.name.localeCompare(y.name));
  if (key === 'level') a.sort((x, y) => LV[x.level] - LV[y.level] || x.name.localeCompare(y.name));
  if (key === 'shortcut') {
    const s = (i: T) => (os === 'mac' ? i.mac : i.win) ?? '￿';
    a.sort((x, y) => s(x).localeCompare(s(y)) || x.name.localeCompare(y.name));
  }
  return a;
}
