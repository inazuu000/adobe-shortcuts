import type { OS } from '../data/types';

type Mod = 'ctrl' | 'cmd' | 'alt' | 'shift';

const MODS: [string, Mod][] = [
  ['control', 'ctrl'], ['ctrl', 'ctrl'], ['⌃', 'ctrl'],
  ['command', 'cmd'], ['cmd', 'cmd'], ['⌘', 'cmd'],
  ['option', 'alt'], ['opt', 'alt'], ['alt', 'alt'], ['⌥', 'alt'],
  ['shift', 'shift'], ['⇧', 'shift'],
];

const KEY_WORDS: Record<string, string> = {
  plus: '+', minus: '-', dash: '-', hyphen: '-', equals: '=', equal: '=',
  backslash: '\\', semicolon: ';', tilde: '`', backtick: '`', '~': '`',
  delete: 'backspace', del: 'backspace', backspace: 'backspace',
  return: 'enter', enter: 'enter', escape: 'esc', esc: 'esc', tab: 'tab', space: 'space', spacebar: 'space',
  openbracket: '[', closebracket: ']', lbracket: '[', rbracket: ']',
};

export interface ParsedShortcut { mods: Mod[]; key: string }

/** Parse a typed or stored shortcut such as "Ctrl + Shift + ]", "cmd+-", "Ctrl++", "V". */
export function parseShortcut(input: string): ParsedShortcut | null {
  let s = input.toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  const mods = new Set<Mod>();
  for (;;) {
    let matched = false;
    for (const [word, mod] of MODS) {
      if (!s.startsWith(word) || s.length === word.length) continue;
      const rest = s.slice(word.length);
      const isSymbol = !/[a-z]/.test(word); // \u2318, \u2325 ... may be followed directly by the key
      if (/^[+\-\u2013]/.test(rest)) {
        s = rest.slice(1); // consume exactly one separator ("ctrl++" -> key "+")
      } else if (isSymbol) {
        s = rest;
      } else {
        continue;
      }
      mods.add(mod);
      matched = true;
      break;
    }
    if (!matched) break;
  }
  if (!s) return null;
  const key = KEY_WORDS[s] ?? s;
  if (key.length > 1 && !/^(f\d{1,2}|backspace|enter|esc|tab|space)$/.test(key)) return null;
  return { mods: [...mods].sort(), key };
}

export function canonShortcut(input: string): string | null {
  const p = parseShortcut(input);
  return p ? `${p.mods.join('+')}|${p.key}` : null;
}

const NONE_WORDS = new Set([
  'none', 'no', 'no shortcut', 'noshortcut', 'n/a', 'na', 'nothing', 'no dedicated default shortcut',
  'no default shortcut', 'no dedicated shortcut', 'no key',
]);

export function isNoneAnswer(input: string): boolean {
  return NONE_WORDS.has(input.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, ''));
}

/** Does `input` equal the expected shortcut (or any accepted spelling) for the given OS? */
export function shortcutMatches(input: string, expected: string | null, alts: string[] | undefined, _os: OS): boolean {
  if (expected === null) return isNoneAnswer(input);
  const got = canonShortcut(input);
  if (!got) return false;
  return [expected, ...(alts ?? [])].some((e) => canonShortcut(e) === got);
}

/** Case/spacing/punctuation-insensitive name normalisation. A trailing "Tool" is optional. */
export function normalizeName(input: string): string {
  let s = input.toLowerCase().replace(/colour/g, 'color').replace(/&/g, ' and ');
  s = s.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  s = s.replace(/ tool$/, '');
  return s;
}

export function nameMatches(input: string, official: string, aliases: string[]): boolean {
  const got = normalizeName(input);
  if (!got) return false;
  return [official, ...aliases].some((n) => normalizeName(n) === got);
}

/** Pretty display for a stored shortcut, for the active OS. */
export function displayShortcut(win: string | null, mac: string | null, os: OS): string {
  const v = os === 'mac' ? mac : win;
  return v ?? 'No dedicated default shortcut';
}
