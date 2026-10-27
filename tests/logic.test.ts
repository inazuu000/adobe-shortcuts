import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { TOOLS, COMMANDS, SOFTWARE } from '../src/data/index.ts';
import { canonShortcut, shortcutMatches, nameMatches, normalizeName } from '../src/lib/shortcut.ts';
import { examPool, generateQuestions, grade, summarize, getItem, availableCounts } from '../src/lib/exam.ts';
import type { ExamConfig } from '../src/lib/exam.ts';

const sws = ['photoshop', 'illustrator'] as const;

test('every tool has an existing cropped reference icon, and ids are unique', () => {
  for (const sw of sws) {
    const ids = new Set<string>();
    for (const t of TOOLS[sw]) {
      assert.ok(existsSync(`public/${t.icon}`), `missing icon ${t.icon}`);
      assert.ok(!ids.has(t.id), `dup id ${t.id}`); ids.add(t.id);
    }
  }
});

test('every cropped icon on disk is used by exactly one tool (no orphan or invented icons)', async () => {
  const { readdirSync } = await import('node:fs');
  for (const [sw, dir] of [['photoshop', 'ps'], ['illustrator', 'ai']] as const) {
    const files = readdirSync(`public/icons/${dir}`).map((f) => f.replace('.png', '')).sort();
    const used = TOOLS[sw].map((t) => t.id).sort();
    assert.deepEqual(files, used, `${sw}: icon files and tool ids differ`);
  }
});

test('categories used by data match the declared category lists', () => {
  for (const sw of sws) {
    for (const t of TOOLS[sw]) assert.ok(SOFTWARE[sw].toolCategories.includes(t.category), `${sw} tool ${t.id}: ${t.category}`);
    for (const c of COMMANDS[sw]) assert.ok(SOFTWARE[sw].commandCategories.includes(c.category), `${sw} cmd ${c.id}: ${c.category}`);
  }
});

test('names are unambiguous inside each app (no alias collisions between different items)', () => {
  for (const sw of sws) {
    for (const list of [TOOLS[sw], COMMANDS[sw]] as { id: string; name: string; aliases: string[] }[][]) {
      const seen = new Map<string, string>();
      for (const it of list) for (const n of [it.name, ...it.aliases]) {
        const k = normalizeName(n);
        assert.ok(!seen.has(k) || seen.get(k) === it.id, `${sw}: "${n}" (${it.id}) collides with ${seen.get(k)}`);
        seen.set(k, it.id);
      }
    }
  }
});

test('exam function text never gives away the answer name', () => {
  const leaks: string[] = [];
  const wordIn = (text: string, phrase: string) => new RegExp(`(^|[^a-z0-9])${phrase.replace(/ /g, '[^a-z0-9]+')}([^a-z0-9]|$)`).test(text);
  for (const sw of sws) {
    for (const t of TOOLS[sw]) {
      for (const n of [t.name, ...t.aliases]) {
        const k = normalizeName(n);
        if (k.length > 2 && wordIn(t.fn.toLowerCase(), k)) leaks.push(`${sw}/${t.id}: "${k}"`);
      }
    }
    for (const c of COMMANDS[sw]) {
      for (const n of [c.name, ...c.aliases]) {
        const k = normalizeName(n);
        if (k.length > 2 && wordIn(c.description.toLowerCase(), k)) leaks.push(`${sw}/${c.id}: "${k}"`);
      }
    }
  }
  assert.deepEqual(leaks, []);
});

test('shortcut keys are stored per OS and are never the lazy Ctrl->Command swap by accident', () => {
  for (const sw of sws) for (const c of COMMANDS[sw]) {
    assert.ok(!/ctrl/i.test(c.mac), `${c.id}: mac shortcut contains Ctrl`);
    assert.ok(!/command|cmd/i.test(c.win), `${c.id}: windows shortcut contains Command`);
    assert.ok(canonShortcut(c.win), `${c.id}: unparseable win ${c.win}`);
    assert.ok(canonShortcut(c.mac), `${c.id}: unparseable mac ${c.mac}`);
  }
  for (const sw of sws) for (const t of TOOLS[sw]) if (t.win) assert.ok(canonShortcut(t.win), `${t.id}: ${t.win}`);
});

test('shortcut parsing and matching', () => {
  const m = (i: string, e: string | null, os: 'windows' | 'mac' = 'windows', alts?: string[]) => shortcutMatches(i, e, alts, os);
  assert.ok(m('ctrl+d', 'Ctrl + D'));
  assert.ok(m('CTRL + D', 'Ctrl + D'));
  assert.ok(m('control d'.replace(' ', '+'), 'Ctrl + D'));
  assert.ok(m('shift+ctrl+a', 'Ctrl + Shift + A'), 'modifier order is irrelevant');
  assert.ok(!m('ctrl+a', 'Ctrl + Shift + A'));
  assert.ok(!m('d', 'Ctrl + D'));
  assert.ok(m('cmd+d', 'Command + D', 'mac'));
  assert.ok(m('⌘D', 'Command + D', 'mac'));
  assert.ok(!m('ctrl+d', 'Command + D', 'mac'), 'Ctrl is not Command');
  assert.ok(!m('cmd+d', 'Ctrl + D', 'windows'), 'Command is not Ctrl');
  assert.ok(m('option+shift+cmd+n', 'Command + Option + Shift + N'.replace('Command + Option + Shift', 'Option + Shift + Command'), 'mac'));
  assert.ok(m('ctrl++', 'Ctrl + +'));
  assert.ok(m('ctrl + plus', 'Ctrl + +'));
  assert.ok(m('ctrl+=', 'Ctrl + +', 'windows', ['Ctrl + =']));
  assert.ok(!m('ctrl+=', 'Ctrl + +'));
  assert.ok(m('ctrl+-', 'Ctrl + -'));
  assert.ok(m('ctrl + minus', 'Ctrl + -'));
  assert.ok(!m('ctrl+', 'Ctrl + -'));
  assert.ok(m('-', '-'), 'delete anchor point key');
  assert.ok(m('+', '+'));
  assert.ok(m('shift+]', 'Ctrl + Shift + ]') === false);
  assert.ok(m('ctrl+shift+]', 'Ctrl + Shift + ]'));
  assert.ok(m('ctrl+;', 'Ctrl + ;'));
  assert.ok(m('shift+~', 'Shift + ~'));
  assert.ok(m('shift+`', 'Shift + ~'));
  assert.ok(m('v', 'V') && m('V', 'V'));
  assert.ok(!m('c', 'V'));
  assert.ok(m('alt+backspace', 'Alt + Backspace'));
  assert.ok(m('option+delete', 'Option + Delete', 'mac'));
  assert.ok(m('\\', '\\') && m('backslash', '\\'));
  assert.ok(m('Alt + Ctrl + 2', 'Ctrl + Alt + 2'));
});

test('no-shortcut answers', () => {
  assert.ok(shortcutMatches('None', null, undefined, 'windows'));
  assert.ok(shortcutMatches(' no shortcut ', null, undefined, 'mac'));
  assert.ok(!shortcutMatches('V', null, undefined, 'windows'));
  assert.ok(!shortcutMatches('', null, undefined, 'windows'));
  assert.ok(!shortcutMatches('none', 'V', undefined, 'windows'));
  assert.ok(!shortcutMatches('', 'V', undefined, 'windows'));
});

test('name matching: case/space insensitive, aliases, no near-miss tools', () => {
  assert.ok(nameMatches('brush tool', 'Brush Tool', []));
  assert.ok(nameMatches('  BRUSH   Tool ', 'Brush Tool', []));
  assert.ok(nameMatches('brush', 'Brush Tool', []));
  assert.ok(nameMatches('paintbrush', 'Brush Tool', ['paintbrush']));
  assert.ok(!nameMatches('Spot Healing Brush Tool', 'Healing Brush Tool', []));
  assert.ok(!nameMatches('Eraser Tool', 'Background Eraser Tool', []));
  assert.ok(!nameMatches('', 'Brush Tool', []));
  assert.ok(nameMatches('Colour Replacement', 'Color Replacement Tool', []));
});

const cfg = (o: Partial<ExamConfig> = {}): ExamConfig => ({
  software: 'photoshop', category: 'tools', difficulty: 'advanced', count: 'all', os: 'windows', feedback: 'each', mixed: false, ...o,
});

test('exam pool excludes unverified items and respects difficulty; counts never exceed pool', () => {
  for (const sw of sws) for (const category of ['tools', 'commands'] as const) {
    const all = examPool(cfg({ software: sw, category, difficulty: 'advanced' }));
    const src = category === 'tools' ? TOOLS[sw] : COMMANDS[sw];
    assert.equal(all.length, src.filter((x) => x.status === 'verified').length);
    const beg = examPool(cfg({ software: sw, category, difficulty: 'beginner' }));
    assert.ok(beg.length > 0 && beg.length < all.length);
    assert.ok(beg.every((i) => i.level === 'beginner'));
    for (const n of [10, 20, 30] as const) {
      const qs = generateQuestions(cfg({ software: sw, category, count: n }));
      assert.ok(qs.length <= n && qs.length <= all.length);
      assert.equal(new Set(qs.map((q) => q.itemId)).size, qs.length, 'no repeated question');
    }
    const a = generateQuestions(cfg({ software: sw, category, count: 'all' }));
    assert.equal(a.length, all.length);
  }
  const unverified = TOOLS.photoshop.filter((t) => t.status === 'unverified').map((t) => t.id);
  assert.ok(unverified.length >= 2);
  const ids = examPool(cfg()).map((i) => i.id);
  for (const u of unverified) assert.ok(!ids.includes(u));
  assert.ok(availableCounts(15).find((c) => c.value === 20)!.enabled === false);
});

test('toolbar exam scoring: 1 point per field, partial credit', () => {
  const it = getItem('photoshop', 'tools', 'brush')!;
  const q = { id: 'q', kind: 'tools' as const, itemId: 'brush', format: 'both' as const };
  const g = (name: string, shortcut: string) => grade(q, it, { name, shortcut }, 'windows');
  assert.deepEqual([g('brush tool', 'b').points, g('brush tool', 'b').max, g('brush tool', 'b').status], [2, 2, 'correct']);
  assert.deepEqual([g('Brush', 'x').points, g('Brush', 'x').status], [1, 'partial']);
  assert.deepEqual([g('Pencil', 'b').points, g('Pencil', 'b').status], [1, 'partial']);
  assert.deepEqual([g('Pencil', 'x').points, g('Pencil', 'x').status], [0, 'incorrect']);
  const none = getItem('photoshop', 'tools', 'blur')!;
  const qn = { ...q, itemId: 'blur' };
  assert.equal(grade(qn, none, { name: 'blur tool', shortcut: 'none' }, 'mac').points, 2);
  const cmd = getItem('photoshop', 'commands', 'ps-deselect')!;
  const qc = { id: 'c', kind: 'commands' as const, itemId: 'ps-deselect', format: 'both' as const };
  assert.equal(grade(qc, cmd, { name: 'deselect', shortcut: 'ctrl+d' }, 'windows').points, 2);
  assert.equal(grade(qc, cmd, { name: 'deselect', shortcut: 'cmd+d' }, 'windows').points, 1);
  assert.equal(grade(qc, cmd, { name: 'deselect', shortcut: 'cmd+d' }, 'mac').points, 2);
  // single-field formats
  assert.equal(grade({ ...qc, format: 'shortcut' }, cmd, { name: '', shortcut: 'ctrl+d' }, 'windows').max, 1);
  assert.equal(grade({ ...qc, format: 'name' }, cmd, { name: 'Select None', shortcut: '' }, 'windows').points, 1);
});

test('summary math matches the spec example (17 names, 15 shortcuts of 20 => 32/40 = 80%)', () => {
  const it = getItem('photoshop', 'tools', 'move')!;
  const rows = Array.from({ length: 20 }, (_, i) => {
    const nameOk = i < 17, shortcutOk = i < 15;
    return { item: it, graded: { nameOk, shortcutOk, points: +nameOk + +shortcutOk, max: 2, status: (nameOk && shortcutOk ? 'correct' : !nameOk && !shortcutOk ? 'incorrect' : 'partial') as 'correct' | 'partial' | 'incorrect' } };
  });
  const s = summarize(rows);
  assert.equal(s.points, 32); assert.equal(s.max, 40); assert.equal(s.percent, 80);
  assert.equal(s.namesCorrect, 17); assert.equal(s.shortcutsCorrect, 15);
  assert.equal(s.fullyCorrect, 15); assert.equal(s.partial, 2); assert.equal(s.incorrect, 3);
});
