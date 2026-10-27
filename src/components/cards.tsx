import { useState } from 'react';
import type { ReactNode } from 'react';
import { NO_SHORTCUT_LABEL, SOFTWARE, sharedKeyTools } from '../data';
import type { Command, OS, Tool } from '../data';
import { actions, useAppState } from '../lib/store';
import { href } from '../lib/router';
import { btn, Chip, Glyph, Modal, ToolIcon } from './ui';

export function Keys({ value, none = NO_SHORTCUT_LABEL }: { value: string | null; none?: string }) {
  if (!value) return <span className="text-sm italic text-muted">{none}</span>;
  const parts = value.split(' + ');
  return (
    <span className="inline-flex flex-wrap items-center gap-1" aria-label={value}>
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-xs text-muted">+</span>}
          <kbd className="kbd">{p}</kbd>
        </span>
      ))}
    </span>
  );
}

const levelTone = { beginner: 'ok', intermediate: 'accent', advanced: 'warn' } as const;

function ToggleBtn({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} aria-label={label} title={label}
      onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); }}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition ${on ? 'border-accent bg-accent text-accentfg' : 'border-line bg-surface text-muted hover:bg-surface2 hover:text-fg'}`}>
      {children}
    </button>
  );
}

/* ================= toolbar tool card ================= */
export function ToolCard({ tool, view, onOpen }: { tool: Tool; view: 'grid' | 'list'; onOpen: () => void }) {
  const { settings, progress } = useAppState();
  const p = progress[tool.software];
  const learned = p.learnedTools.includes(tool.id);
  const fav = p.favTools.includes(tool.id);
  const sc = settings.os === 'mac' ? tool.mac : tool.win;

  const actionsEl = (
    <div className="flex gap-1.5">
      <ToggleBtn on={fav} onClick={() => actions.toggleFavTool(tool.software, tool.id)} label={fav ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}>
        <Glyph name={fav ? 'heart-fill' : 'heart'} size={16} />
      </ToggleBtn>
      <ToggleBtn on={learned} onClick={() => actions.toggleLearned(tool.software, tool.id)} label={learned ? `Unmark ${tool.name} as learned` : `Mark ${tool.name} as learned`}>
        <Glyph name="check" size={16} />
      </ToggleBtn>
    </div>
  );

  if (view === 'list') {
    return (
      <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 pr-3 transition hover:border-accent/60">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Open details for ${tool.name}`}>
          <ToolIcon tool={tool} scale={1} label={false} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{tool.name}</span>
            <span className="block truncate text-xs text-muted">{tool.category}</span>
          </span>
          <span className="hidden shrink-0 sm:block"><Keys value={sc} none="None" /></span>
          {tool.status === 'unverified' && <Chip tone="warn">Unverified</Chip>}
        </button>
        {actionsEl}
      </li>
    );
  }
  return (
    <li className="flex flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left" aria-label={`Open details for ${tool.name}`}>
        <div className="flex items-start justify-between gap-3">
          <ToolIcon tool={tool} scale={2.5} label />
          <Chip tone={levelTone[tool.level]}>{tool.level}</Chip>
        </div>
        <h3 className="mt-3 font-semibold leading-snug">{tool.name}</h3>
        <div className="mt-1.5"><Keys value={sc} /></div>
        <p className="mt-2 text-sm text-muted">{tool.description}</p>
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{learned ? '✓ Learned' : ''}{tool.status === 'unverified' ? ' Unverified' : ''}</span>
        {actionsEl}
      </div>
    </li>
  );
}

/* ================= detail dialog with prev / next ================= */
export function ToolDetail({ tool, list, onSelect, onClose }: { tool: Tool | null; list: Tool[]; onSelect: (id: string) => void; onClose: () => void }) {
  const { settings, progress } = useAppState();
  if (!tool) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;
  const p = progress[tool.software];
  const learned = p.learnedTools.includes(tool.id);
  const fav = p.favTools.includes(tool.id);
  const idx = list.findIndex((t) => t.id === tool.id);
  const prev = idx > 0 ? list[idx - 1] : undefined;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined;
  const shared = sharedKeyTools(tool);
  const os = settings.os;
  const other: OS = os === 'mac' ? 'windows' : 'mac';
  const mine = os === 'mac' ? tool.mac : tool.win;
  const theirs = other === 'mac' ? tool.mac : tool.win;
  const info = SOFTWARE[tool.software];
  const groupHint = tool.software === 'photoshop'
    ? 'Press Shift + the key repeatedly to cycle through the group (default Photoshop behaviour), or hold Alt/Option and click the toolbar slot.'
    : 'Hold Alt/Option and click the toolbar slot to cycle through the group, or use the tool’s own key where one exists.';

  return (
    <Modal open onClose={onClose} title={`${tool.name} details`} wide>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <ToolIcon tool={tool} scale={4} />
          <div>
            <h2 className="text-2xl font-semibold leading-tight">{tool.name}</h2>
            <p className="mt-1 text-sm text-muted">{tool.category} · {info.short}</p>
          </div>
        </div>
        <button className={btn.ghost} onClick={onClose} aria-label="Close details"><Glyph name="x" /></button>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-surface2 p-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Shortcut · {os === 'mac' ? 'macOS' : 'Windows'}</div>
          <div className="mt-1.5"><Keys value={mine} /></div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{other === 'mac' ? 'macOS' : 'Windows'}</div>
          <div className="mt-1.5"><Keys value={theirs} /></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone={levelTone[tool.level]}>{tool.level}</Chip>
        <Chip tone={tool.status === 'verified' ? 'ok' : 'warn'}>{tool.status === 'verified' ? 'Verified' : 'Unverified — not used in scored exams'}</Chip>
        <Chip>{tool.version}</Chip>
      </div>

      <dl className="mt-5 space-y-4 text-sm leading-relaxed">
        <div><dt className="font-semibold">Description</dt><dd className="text-muted">{tool.description}</dd></div>
        <div><dt className="font-semibold">Main function</dt><dd className="text-muted">{tool.fn}</dd></div>
        <div><dt className="font-semibold">Practical example</dt><dd className="text-muted">{tool.example}</dd></div>
        <div><dt className="font-semibold">Beginner tip</dt><dd className="text-muted">{tool.tip}</dd></div>
        {shared.length > 0 && (
          <div>
            <dt className="font-semibold">Shares {tool.win} with</dt>
            <dd className="text-muted">{shared.map((s) => s.name).join(', ')}. {groupHint}</dd>
          </div>
        )}
        {tool.note && <div><dt className="font-semibold">Version note</dt><dd className="text-muted">{tool.note}</dd></div>}
      </dl>

      <p className="mt-5 text-xs text-muted">
        Icon: original pixels cropped from your reference image.{' '}
        <a className="inline-flex items-center gap-1 text-accent underline" href={info.referenceImage} target="_blank" rel="noreferrer">
          View the full reference sheet <Glyph name="external" size={12} />
        </a>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <button className={learned ? btn.primary : btn.secondary} aria-pressed={learned} onClick={() => actions.toggleLearned(tool.software, tool.id)}>
            <Glyph name="check" size={16} /> {learned ? 'Learned' : 'Mark as Learned'}
          </button>
          <button className={fav ? btn.primary : btn.secondary} aria-pressed={fav} onClick={() => actions.toggleFavTool(tool.software, tool.id)}>
            <Glyph name={fav ? 'heart-fill' : 'heart'} size={16} /> {fav ? 'Favorited' : 'Add to Favorites'}
          </button>
          <a className={btn.secondary} href={href(`${tool.software}/exam/tools`)} onClick={onClose}>Practice in a quiz</a>
        </div>
        <div className="flex gap-2">
          <button className={btn.secondary} disabled={!prev} onClick={() => prev && onSelect(prev.id)} aria-label={prev ? `Previous: ${prev.name}` : 'No previous tool'}><Glyph name="left" size={16} /> Prev</button>
          <button className={btn.secondary} disabled={!next} onClick={() => next && onSelect(next.id)} aria-label={next ? `Next: ${next.name}` : 'No next tool'}>Next <Glyph name="right" size={16} /></button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= general command card ================= */
export function CommandCard({ cmd, view }: { cmd: Command; view: 'grid' | 'list' }) {
  const { settings, progress } = useAppState();
  const [open, setOpen] = useState(false);
  const p = progress[cmd.software];
  const reviewed = p.reviewedCommands.includes(cmd.id);
  const fav = p.favCommands.includes(cmd.id);
  const os = settings.os;
  const mine = os === 'mac' ? cmd.mac : cmd.win;
  const other: OS = os === 'mac' ? 'windows' : 'mac';
  const theirs = other === 'mac' ? cmd.mac : cmd.win;
  const differs = cmd.win !== cmd.mac;

  const toggleOpen = () => { setOpen((o) => !o); if (!open) actions.markReviewed(cmd.software, cmd.id); };

  return (
    <li className="rounded-2xl border border-line bg-surface p-4 transition hover:border-accent/60">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={toggleOpen} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <h3 className="font-semibold leading-snug">{cmd.name}</h3>
          <div className="mt-1.5"><Keys value={mine} /></div>
        </button>
        <div className="flex gap-1.5">
          <ToggleBtn on={fav} onClick={() => actions.toggleFavCommand(cmd.software, cmd.id)} label={fav ? `Remove ${cmd.name} from favorites` : `Add ${cmd.name} to favorites`}><Glyph name={fav ? 'heart-fill' : 'heart'} size={16} /></ToggleBtn>
          <ToggleBtn on={reviewed} onClick={() => actions.toggleReviewed(cmd.software, cmd.id)} label={reviewed ? `Unmark ${cmd.name} as reviewed` : `Mark ${cmd.name} as reviewed`}><Glyph name="check" size={16} /></ToggleBtn>
        </div>
      </div>
      {view === 'grid' && <p className="mt-2 text-sm text-muted">{cmd.description}</p>}
      {(open || view === 'list' && open) && (
        <dl className="mt-3 space-y-3 border-t border-line pt-3 text-sm">
          {view === 'list' && <div><dt className="font-semibold">Description</dt><dd className="text-muted">{cmd.description}</dd></div>}
          <div><dt className="font-semibold">When to use it</dt><dd className="text-muted">{cmd.whenToUse}</dd></div>
          <div><dt className="font-semibold">Practical example</dt><dd className="text-muted">{cmd.example}</dd></div>
          <div>
            <dt className="font-semibold">Operating system compatibility</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
              <span>{other === 'mac' ? 'macOS' : 'Windows'}: <Keys value={theirs} /></span>
              <span>{differs ? 'Keys differ by platform' : 'Same on both platforms'}</span>
            </dd>
          </div>
          {cmd.note && <div><dt className="font-semibold">Note</dt><dd className="text-muted">{cmd.note}</dd></div>}
          <div className="flex flex-wrap gap-2"><Chip>{cmd.category}</Chip><Chip tone={levelTone[cmd.level]}>{cmd.level}</Chip><Chip>{cmd.version}</Chip></div>
        </dl>
      )}
      <button type="button" onClick={toggleOpen} className="mt-3 text-xs font-medium text-accent hover:underline">{open ? 'Hide details' : 'Show details'}</button>
    </li>
  );
}
