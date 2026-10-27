import { useMemo, useState } from 'react';
import { SOFTWARE, TOOLS } from '../data';
import type { Software } from '../data';
import { href } from '../lib/router';
import type { Route } from '../lib/router';
import { matchTool, sortItems } from '../lib/search';
import type { SortKey } from '../lib/search';
import { setSettings, useAppState } from '../lib/store';
import { btn, Glyph, Seg, SearchInput } from '../components/ui';
import { ToolCard, ToolDetail } from '../components/cards';

export const selectCls = 'rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none';

export function StudyTools({ sw, route }: { sw: Software; route: Route }) {
  const info = SOFTWARE[sw];
  const { settings, progress } = useAppState();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<SortKey>('default');
  const [status, setStatus] = useState<'all' | 'learned' | 'todo' | 'fav'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const ids = route.query.get('ids');
  const idSet = useMemo(() => (ids ? new Set(ids.split(',')) : null), [ids]);
  const p = progress[sw];

  const list = useMemo(() => {
    let l = TOOLS[sw];
    if (idSet) l = l.filter((t) => idSet.has(t.id));
    if (cat !== 'all') l = l.filter((t) => t.category === cat);
    if (q.trim()) l = l.filter((t) => matchTool(t, q, settings.os));
    if (status === 'learned') l = l.filter((t) => p.learnedTools.includes(t.id));
    if (status === 'todo') l = l.filter((t) => !p.learnedTools.includes(t.id));
    if (status === 'fav') l = l.filter((t) => p.favTools.includes(t.id));
    return sortItems(l, sort, settings.os);
  }, [sw, idSet, cat, q, status, sort, settings.os, p.learnedTools, p.favTools]);

  const grouped = useMemo(() => {
    if (sort !== 'default' || cat !== 'all') return [{ title: cat === 'all' ? '' : cat, items: list }];
    return info.toolCategories.map((c) => ({ title: c, items: list.filter((t) => t.category === c) })).filter((g) => g.items.length);
  }, [list, sort, cat, info]);

  const open = list.find((t) => t.id === openId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <a href={href(`${sw}/study`)} className="text-sm text-muted hover:text-fg">← Study Mode</a>
          <h2 className="mt-1 text-2xl font-bold">Toolbar Icon Study</h2>
          <p className="text-sm text-muted">{list.length} of {TOOLS[sw].length} tools · {p.learnedTools.length} learned</p>
        </div>
        <Seg label="Layout" value={settings.view} onChange={(v) => setSettings({ view: v })}
          options={[{ value: 'grid', label: <span className="inline-flex items-center gap-1.5"><Glyph name="grid" size={15} /> Grid</span> }, { value: 'list', label: <span className="inline-flex items-center gap-1.5"><Glyph name="list" size={15} /> List</span> }]} />
      </div>

      {idSet && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm">
          <span>Showing the {idSet.size} tool{idSet.size === 1 ? '' : 's'} you missed in your exam.</span>
          <a className={btn.secondary} href={href(`${sw}/study/tools`)}>Show all tools</a>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <SearchInput value={q} onChange={setQ} placeholder="Filter by name, shortcut, function or category" />
        <select aria-label="Filter by category" className={selectCls} value={cat} onChange={(e: { target: { value: string } }) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {info.toolCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Filter by progress" className={selectCls} value={status} onChange={(e: { target: { value: string } }) => setStatus(e.target.value as typeof status)}>
          <option value="all">All tools</option><option value="todo">Not learned yet</option><option value="learned">Learned</option><option value="fav">Favorites</option>
        </select>
        <select aria-label="Sort" className={selectCls} value={sort} onChange={(e: { target: { value: string } }) => setSort(e.target.value as SortKey)}>
          <option value="default">Toolbar order</option><option value="name">Name A–Z</option><option value="shortcut">Shortcut</option><option value="level">Difficulty</option>
        </select>
      </div>

      {list.length === 0 && <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No tools match these filters.</p>}

      {grouped.map((g) => (
        <section key={g.title} className="mt-7" aria-label={g.title || 'Tools'}>
          {g.title && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{g.title} <span className="font-normal">({g.items.length})</span></h3>}
          <ul className={settings.view === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid gap-2 lg:grid-cols-2'}>
            {g.items.map((t) => <ToolCard key={t.id} tool={t} view={settings.view} onOpen={() => setOpenId(t.id)} />)}
          </ul>
        </section>
      ))}

      <ToolDetail tool={open} list={list} onSelect={setOpenId} onClose={() => setOpenId(null)} />
    </div>
  );
}
