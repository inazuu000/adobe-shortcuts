import { useMemo, useState } from 'react';
import { COMMANDS, SOFTWARE } from '../data';
import type { Software } from '../data';
import { href } from '../lib/router';
import type { Route } from '../lib/router';
import { matchCommand, sortItems } from '../lib/search';
import type { SortKey } from '../lib/search';
import { setSettings, useAppState } from '../lib/store';
import { btn, Glyph, Seg, SearchInput } from '../components/ui';
import { CommandCard } from '../components/cards';
import { selectCls } from './StudyTools';

export function StudyCommands({ sw, route }: { sw: Software; route: Route }) {
  const info = SOFTWARE[sw];
  const { settings, progress } = useAppState();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<SortKey>('default');
  const [status, setStatus] = useState<'all' | 'reviewed' | 'todo' | 'fav'>('all');
  const ids = route.query.get('ids');
  const idSet = useMemo(() => (ids ? new Set(ids.split(',')) : null), [ids]);
  const p = progress[sw];

  const list = useMemo(() => {
    let l = COMMANDS[sw];
    if (idSet) l = l.filter((c) => idSet.has(c.id));
    if (cat !== 'all') l = l.filter((c) => c.category === cat);
    if (q.trim()) l = l.filter((c) => matchCommand(c, q, settings.os));
    if (status === 'reviewed') l = l.filter((c) => p.reviewedCommands.includes(c.id));
    if (status === 'todo') l = l.filter((c) => !p.reviewedCommands.includes(c.id));
    if (status === 'fav') l = l.filter((c) => p.favCommands.includes(c.id));
    return sortItems(l.map((c) => ({ ...c })), sort, settings.os) as typeof l;
  }, [sw, idSet, cat, q, status, sort, settings.os, p.reviewedCommands, p.favCommands]);

  const grouped = useMemo(() => {
    if (sort !== 'default' || cat !== 'all') return [{ title: cat === 'all' ? '' : cat, items: list }];
    return info.commandCategories.map((c) => ({ title: c, items: list.filter((x) => x.category === c) })).filter((g) => g.items.length);
  }, [list, sort, cat, info]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <a href={href(`${sw}/study`)} className="text-sm text-muted hover:text-fg">← Study Mode</a>
          <h2 className="mt-1 text-2xl font-bold">Other Useful Shortcuts Study</h2>
          <p className="text-sm text-muted">{list.length} of {COMMANDS[sw].length} shortcuts · {p.reviewedCommands.length} reviewed</p>
        </div>
        <Seg label="Layout" value={settings.view} onChange={(v) => setSettings({ view: v })}
          options={[{ value: 'grid', label: <span className="inline-flex items-center gap-1.5"><Glyph name="grid" size={15} /> Grid</span> }, { value: 'list', label: <span className="inline-flex items-center gap-1.5"><Glyph name="list" size={15} /> List</span> }]} />
      </div>

      {idSet && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm">
          <span>Showing the {idSet.size} shortcut{idSet.size === 1 ? '' : 's'} you missed in your exam.</span>
          <a className={btn.secondary} href={href(`${sw}/study/shortcuts`)}>Show all shortcuts</a>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <SearchInput value={q} onChange={setQ} placeholder="Filter by command, shortcut (e.g. Ctrl + D) or description" />
        <select aria-label="Filter by category" className={selectCls} value={cat} onChange={(e: { target: { value: string } }) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {info.commandCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Filter by progress" className={selectCls} value={status} onChange={(e: { target: { value: string } }) => setStatus(e.target.value as typeof status)}>
          <option value="all">All shortcuts</option><option value="todo">Not reviewed yet</option><option value="reviewed">Reviewed</option><option value="fav">Favorites</option>
        </select>
        <select aria-label="Sort" className={selectCls} value={sort} onChange={(e: { target: { value: string } }) => setSort(e.target.value as SortKey)}>
          <option value="default">Category order</option><option value="name">Name A–Z</option><option value="shortcut">Shortcut</option><option value="level">Difficulty</option>
        </select>
      </div>

      {list.length === 0 && <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No shortcuts match these filters.</p>}

      {grouped.map((g) => (
        <section key={g.title} className="mt-7" aria-label={g.title || 'Shortcuts'}>
          {g.title && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{g.title} <span className="font-normal">({g.items.length})</span></h3>}
          <ul className={settings.view === 'grid' ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-2 lg:grid-cols-2'}>
            {g.items.map((c) => <CommandCard key={c.id} cmd={c} view={settings.view} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
