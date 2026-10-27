import { useMemo, useState } from 'react';
import { COMMANDS, SOFTWARE, TOOLS } from '../data';
import type { Software, Tool } from '../data';
import { href } from '../lib/router';
import type { Route } from '../lib/router';
import { matchCommand, matchTool } from '../lib/search';
import { progressStats, useAppState } from '../lib/store';
import { btn, Glyph, ProgressBar, SearchInput } from '../components/ui';
import { CommandCard, ToolCard, ToolDetail } from '../components/cards';
import { Dashboard, ExamChooser, StudyChooser } from './Choosers';
import { StudyTools } from './StudyTools';
import { StudyCommands } from './StudyCommands';
import { ExamFlow } from './Exam';
import { ProgressPage } from './ProgressPage';
import { FavoritesPage } from './Favorites';

function SearchResults({ sw, query, onClear }: { sw: Software; query: string; onClear: () => void }) {
  const { settings } = useAppState();
  const [both, setBoth] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const sws: Software[] = both ? ['photoshop', 'illustrator'] : [sw];
  const tools = useMemo(() => sws.flatMap((s) => TOOLS[s].filter((t) => matchTool(t, query, settings.os))), [query, settings.os, both, sw]);
  const cmds = useMemo(() => sws.flatMap((s) => COMMANDS[s].filter((c) => matchCommand(c, query, settings.os))), [query, settings.os, both, sw]);
  const selected: Tool | null = tools.find((t) => `${t.software}:${t.id}` === open) ?? null;

  return (
    <section aria-live="polite" className="page-enter">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {tools.length + cmds.length} result{tools.length + cmds.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
          <span className="ml-2 text-sm font-normal text-muted">in {both ? 'both apps' : SOFTWARE[sw].short}</span>
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={both} onChange={(e: { target: { checked: boolean } }) => setBoth(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            Also search the other app
          </label>
          <button className={btn.secondary} onClick={onClear}>Clear search</button>
        </div>
      </div>
      {tools.length + cmds.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">Nothing matched. Try a tool name, a command, or a shortcut such as &ldquo;Ctrl + D&rdquo;.</p>}
      {tools.length > 0 && (
        <>
          <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-muted">Toolbar tools ({tools.length})</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((t) => <ToolCard key={`${t.software}:${t.id}`} tool={t} view="grid" onOpen={() => setOpen(`${t.software}:${t.id}`)} />)}
          </ul>
        </>
      )}
      {cmds.length > 0 && (
        <>
          <h3 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Other useful shortcuts ({cmds.length})</h3>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cmds.map((c) => <CommandCard key={`${c.software}:${c.id}`} cmd={c} view="grid" />)}
          </ul>
        </>
      )}
      <ToolDetail tool={selected} list={tools} onSelect={(id) => { const t = tools.find((x) => x.id === id); if (t) setOpen(`${t.software}:${t.id}`); }} onClose={() => setOpen(null)} />
    </section>
  );
}

export function SoftwareLayout({ sw, route }: { sw: Software; route: Route }) {
  const info = SOFTWARE[sw];
  const { settings, progress } = useAppState();
  const [query, setQuery] = useState('');
  const stats = progressStats(progress[sw], TOOLS[sw].length, COMMANDS[sw].length);
  const [, section, sub] = route.path;
  const active = section === 'study' ? 'study' : section === 'exam' ? 'exam' : section === 'favorites' ? 'favorites' : section === 'progress' ? 'progress' : 'home';
  const favCount = progress[sw].favTools.length + progress[sw].favCommands.length;

  const tab = (key: string, label: string, to: string) => (
    <a key={key} href={href(to)} aria-current={active === key ? 'page' : undefined}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active === key ? 'bg-accent text-accentfg shadow-sm' : 'border border-line bg-surface text-fg hover:bg-surface2'}`}>
      {label}
    </a>
  );

  let page;
  if (!section) page = <Dashboard sw={sw} />;
  else if (section === 'study' && !sub) page = <StudyChooser sw={sw} />;
  else if (section === 'study' && sub === 'tools') page = <StudyTools sw={sw} route={route} />;
  else if (section === 'study' && sub === 'shortcuts') page = <StudyCommands sw={sw} route={route} />;
  else if (section === 'exam' && !sub) page = <ExamChooser sw={sw} />;
  else if (section === 'exam' && (sub === 'tools' || sub === 'shortcuts')) page = <ExamFlow key={`${sw}-${sub}`} sw={sw} category={sub === 'tools' ? 'tools' : 'commands'} />;
  else if (section === 'progress') page = <ProgressPage sw={sw} />;
  else if (section === 'favorites') page = <FavoritesPage sw={sw} />;
  else page = <p className="py-20 text-center text-muted">Page not found. <a className="text-accent underline" href={href(sw)}>Back to the dashboard</a></p>;

  return (
    <div>
      <div className="rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href={href('')} className={btn.ghost} aria-label="Return to homepage"><Glyph name="home" /> <span className="hidden sm:inline">Home</span></a>
            <div>
              <h1 className="text-xl font-bold leading-tight sm:text-2xl"><a href={href(sw)}>{info.name}</a></h1>
              <p className="text-xs text-muted">Showing {settings.os === 'mac' ? 'macOS' : 'Windows'} shortcuts · {info.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:w-72">
            <a href={href(`${sw}/progress`)} className="block w-full text-xs text-muted" aria-label={`Learning progress ${stats.overall} percent. Open progress`}>
              <span className="mb-1 flex justify-between"><span>Learning progress</span><span>{stats.overall}%</span></span>
              <ProgressBar value={stats.overall} label="Overall learning progress" />
            </a>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <SearchInput id="global-search" value={query} onChange={setQuery} placeholder={`Search ${info.short} tools, commands or shortcuts (e.g. Brush, Ctrl + D)`} />
          <nav aria-label={`${info.short} sections`} className="flex flex-wrap gap-2">
            {tab('study', 'Study Mode', `${sw}/study`)}
            {tab('exam', 'Exam Mode', `${sw}/exam`)}
            {tab('favorites', `Favorites${favCount ? ` (${favCount})` : ''}`, `${sw}/favorites`)}
            {tab('progress', 'Progress', `${sw}/progress`)}
          </nav>
        </div>
      </div>
      <div className="mt-6">
        {query.trim() ? <SearchResults sw={sw} query={query} onClear={() => setQuery('')} /> : <div key={`${section}/${sub}`} className="page-enter">{page}</div>}
      </div>
    </div>
  );
}
