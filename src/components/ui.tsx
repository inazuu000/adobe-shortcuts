import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { OS, Tool } from '../data';

/* ---------- plain interface glyphs (never used as tool icons) ---------- */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function Glyph({ name, size = 18 }: { name: 'search' | 'heart' | 'heart-fill' | 'check' | 'sun' | 'moon' | 'home' | 'x' | 'left' | 'right' | 'grid' | 'list' | 'external'; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  switch (name) {
    case 'search': return <svg {...p} {...stroke}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case 'heart': return <svg {...p} {...stroke}><path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" /></svg>;
    case 'heart-fill': return <svg {...p} fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"><path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" /></svg>;
    case 'check': return <svg {...p} {...stroke}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
    case 'sun': return <svg {...p} {...stroke}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'moon': return <svg {...p} {...stroke}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
    case 'home': return <svg {...p} {...stroke}><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>;
    case 'x': return <svg {...p} {...stroke}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case 'left': return <svg {...p} {...stroke}><path d="m15 5-7 7 7 7" /></svg>;
    case 'right': return <svg {...p} {...stroke}><path d="m9 5 7 7-7 7" /></svg>;
    case 'grid': return <svg {...p} {...stroke}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'list': return <svg {...p} {...stroke}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case 'external': return <svg {...p} {...stroke}><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></svg>;
  }
}

/* ---------- the original cropped toolbar icon ---------- */
export function ToolIcon({ tool, scale = 2, label = true }: { tool: Tool; scale?: number; label?: boolean }) {
  const dark = tool.software === 'photoshop';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border ${dark ? 'border-black/40 bg-[#3c3c3c]' : 'border-line bg-white'}`}
      style={{ padding: 4 * (scale / 2) }}
    >
      <img
        className="ref-icon"
        src={tool.icon}
        alt={label ? `${tool.name} toolbar icon (original, cropped from your reference image)` : ''}
        width={Math.round((dark ? 46 : 44) * scale)}
        height={Math.round((dark ? 36 : 44) * scale)}
        draggable={false}
        onError={(e: { target: HTMLElement }) => { e.target.style.opacity = '0.2'; }}
      />
    </span>
  );
}

/* ---------- small building blocks ---------- */
export function Kbd({ children }: { children: ReactNode }) { return <kbd className="kbd">{children}</kbd>; }

export function Chip({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'ok' | 'warn' | 'accent' }) {
  const t = { muted: 'bg-surface2 text-muted', ok: 'bg-ok/15 text-ok', warn: 'bg-warn/15 text-warn', accent: 'bg-accent/15 text-accent' }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progress'}
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Seg<T extends string | number>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; label: string;
  options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface2 p-1">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} disabled={o.disabled} title={o.title}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${o.value === value ? 'bg-accent text-accentfg shadow-sm' : 'text-fg hover:bg-surface'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accentfg shadow-sm transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface2 hover:text-fg',
};

export function OSSelector({ os, onChange }: { os: OS; onChange: (o: OS) => void }) {
  return <Seg label="Operating system" value={os} onChange={onChange} options={[{ value: 'windows', label: 'Windows' }, { value: 'mac', label: 'macOS' }]} />;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6" onMouseDown={(e: { target: unknown; currentTarget: unknown }) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`page-enter max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-7 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, confirmLabel, onConfirm, onCancel }: {
  open: boolean; title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className={btn.secondary} onClick={onCancel}>Cancel</button>
        <button className={btn.primary} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function SearchInput({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder: string; id?: string }) {
  return (
    <label className="relative block w-full" htmlFor={id}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Glyph name="search" /></span>
      <input id={id} type="search" value={value} placeholder={placeholder} aria-label={placeholder}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" />
    </label>
  );
}
