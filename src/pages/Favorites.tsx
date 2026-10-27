import { useState } from 'react';
import { COMMANDS, SOFTWARE, TOOLS } from '../data';
import type { Software } from '../data';
import { href } from '../lib/router';
import { actions, useAppState } from '../lib/store';
import { btn, Glyph } from '../components/ui';
import { CommandCard, ToolCard, ToolDetail } from '../components/cards';

export function FavoritesPage({ sw }: { sw: Software }) {
  const { progress, settings } = useAppState();
  const p = progress[sw];
  const [openId, setOpenId] = useState<string | null>(null);
  const tools = TOOLS[sw].filter((t) => p.favTools.includes(t.id));
  const cmds = COMMANDS[sw].filter((c) => p.favCommands.includes(c.id));
  const open = tools.find((t) => t.id === openId) ?? null;

  return (
    <div>
      <h2 className="text-2xl font-bold">{SOFTWARE[sw].short} favorites</h2>
      <p className="text-sm text-muted">Tap the heart on any card to add or remove it. Favorites are saved in this browser.</p>

      {tools.length + cmds.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-muted">No favorites yet.</p>
          <div className="mt-4 flex justify-center gap-2">
            <a className={btn.primary} href={href(`${sw}/study/tools`)}>Browse tools</a>
            <a className={btn.secondary} href={href(`${sw}/study/shortcuts`)}>Browse shortcuts</a>
          </div>
        </div>
      )}

      {tools.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Favorite tools ({tools.length})</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((t) => (
              <div key={t.id} className="relative">
                <ToolCard tool={t} view={settings.view === 'list' ? 'grid' : settings.view} onOpen={() => setOpenId(t.id)} />
              </div>
            ))}
          </ul>
        </section>
      )}
      {cmds.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Favorite commands ({cmds.length})</h3>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cmds.map((c) => <CommandCard key={c.id} cmd={c} view="grid" />)}
          </ul>
          <button className={btn.ghost + ' mt-3'} onClick={() => cmds.forEach((c) => actions.toggleFavCommand(sw, c.id))}><Glyph name="x" size={14} /> Remove all favorite commands</button>
        </section>
      )}
      <ToolDetail tool={open} list={tools} onSelect={setOpenId} onClose={() => setOpenId(null)} />
    </div>
  );
}
