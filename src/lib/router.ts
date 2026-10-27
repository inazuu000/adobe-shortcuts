import { useSyncExternalStore } from 'react';

export interface Route { path: string[]; query: URLSearchParams }

function snapshot(): string {
  return window.location.hash || '#/';
}
function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const [p, q = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function useRoute(): Route {
  const h = useSyncExternalStore(subscribe, snapshot, () => '#/');
  return parseHash(h);
}

export function href(path: string, query?: Record<string, string | undefined>): string {
  const q = query ? Object.entries(query).filter(([, v]) => v !== undefined && v !== '') : [];
  const qs = q.length ? '?' + q.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`).join('&') : '';
  return `#/${path.replace(/^\//, '')}${qs}`;
}

export function navigate(path: string, query?: Record<string, string | undefined>) {
  window.location.hash = href(path, query);
  try { window.scrollTo({ top: 0 }); } catch { /* ignore */ }
}
