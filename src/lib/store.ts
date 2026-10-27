import { useSyncExternalStore } from 'react';
import type { OS, Software } from '../data/types';
import type { ExamCategory, Feedback, Difficulty } from './exam';

export type Theme = 'light' | 'dark';
export type ViewMode = 'grid' | 'list';

export interface Settings {
  theme: Theme;
  os: OS;
  view: ViewMode;
  feedback: Feedback;
}

export interface ExamRecord {
  at: number;
  category: ExamCategory;
  difficulty: Difficulty;
  os: OS;
  questions: number;
  points: number;
  max: number;
  percent: number;
  namesCorrect: number;
  shortcutsCorrect: number;
  weak: string[];
}

export interface Progress {
  learnedTools: string[];
  reviewedCommands: string[];
  favTools: string[];
  favCommands: string[];
  exams: ExamRecord[];
}

const emptyProgress = (): Progress => ({ learnedTools: [], reviewedCommands: [], favTools: [], favCommands: [], exams: [] });

function detectOS(): OS {
  try {
    const p = (navigator.platform || navigator.userAgent || '').toLowerCase();
    return /mac|iphone|ipad/.test(p) ? 'mac' : 'windows';
  } catch { return 'windows'; }
}

function detectTheme(): Theme {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
}

const KEY_SETTINGS = 'dsa:v1:settings';
const KEY_PROGRESS = (sw: Software) => `dsa:v1:progress:${sw}`;

// localStorage can throw (private mode, blocked storage); fall back to memory so the app still works.
const memory = new Map<string, string>();
function read(key: string): string | null {
  try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; }
}
function write(key: string, value: string) {
  memory.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* memory only */ }
}
function remove(key: string) {
  memory.delete(key);
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) }; } catch { return fallback; }
}

interface State {
  settings: Settings;
  progress: Record<Software, Progress>;
}

let state: State = {
  settings: parse<Settings>(read(KEY_SETTINGS), { theme: detectTheme(), os: detectOS(), view: 'grid', feedback: 'each' }),
  progress: {
    photoshop: parse<Progress>(read(KEY_PROGRESS('photoshop')), emptyProgress()),
    illustrator: parse<Progress>(read(KEY_PROGRESS('illustrator')), emptyProgress()),
  },
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
const getState = () => state;

export function useAppState(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function setSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  write(KEY_SETTINGS, JSON.stringify(state.settings));
  applyTheme();
  emit();
}

export function applyTheme() {
  try {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
    document.documentElement.style.colorScheme = state.settings.theme;
  } catch { /* ignore */ }
}

function updateProgress(sw: Software, fn: (p: Progress) => Progress) {
  const next = fn(state.progress[sw]);
  state = { ...state, progress: { ...state.progress, [sw]: next } };
  write(KEY_PROGRESS(sw), JSON.stringify(next));
  emit();
}

const toggleIn = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

export const actions = {
  toggleLearned: (sw: Software, id: string) => updateProgress(sw, (p) => ({ ...p, learnedTools: toggleIn(p.learnedTools, id) })),
  toggleReviewed: (sw: Software, id: string) => updateProgress(sw, (p) => ({ ...p, reviewedCommands: toggleIn(p.reviewedCommands, id) })),
  markReviewed: (sw: Software, id: string) => updateProgress(sw, (p) => (p.reviewedCommands.includes(id) ? p : { ...p, reviewedCommands: [...p.reviewedCommands, id] })),
  toggleFavTool: (sw: Software, id: string) => updateProgress(sw, (p) => ({ ...p, favTools: toggleIn(p.favTools, id) })),
  toggleFavCommand: (sw: Software, id: string) => updateProgress(sw, (p) => ({ ...p, favCommands: toggleIn(p.favCommands, id) })),
  addExam: (sw: Software, rec: ExamRecord) => updateProgress(sw, (p) => ({ ...p, exams: [...p.exams, rec].slice(-200) })),
  reset: (sw: Software) => { remove(KEY_PROGRESS(sw)); updateProgress(sw, () => emptyProgress()); },
};

export function progressStats(p: Progress, toolCount: number, commandCount: number) {
  const byCat = (c: ExamCategory) => p.exams.filter((e) => e.category === c);
  const best = (c: ExamCategory) => byCat(c).reduce<number | null>((m, e) => (m === null || e.percent > m ? e.percent : m), null);
  const last = (c: ExamCategory) => { const l = byCat(c); return l.length ? l[l.length - 1] : null; };
  const learnedPct = toolCount ? Math.round((p.learnedTools.length / toolCount) * 100) : 0;
  const reviewedPct = commandCount ? Math.round((p.reviewedCommands.length / commandCount) * 100) : 0;
  const overall = Math.round((p.learnedTools.length + p.reviewedCommands.length) / Math.max(1, toolCount + commandCount) * 100);
  const totalNames = p.exams.reduce((s, e) => s + e.namesCorrect, 0);
  const totalPoints = p.exams.reduce((s, e) => s + e.points, 0);
  const totalMax = p.exams.reduce((s, e) => s + e.max, 0);
  const weakCount = new Map<string, number>();
  p.exams.forEach((e) => e.weak.forEach((w) => weakCount.set(w, (weakCount.get(w) ?? 0) + 1)));
  const weak = [...weakCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
  return { best, last, learnedPct, reviewedPct, overall, completed: p.exams.length, totalNames, totalPoints, totalMax, weak };
}
