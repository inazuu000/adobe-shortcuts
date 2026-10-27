import { useEffect } from 'react';
import { isSoftware } from './data';
import { href, useRoute } from './lib/router';
import { setSettings, useAppState } from './lib/store';
import { btn, Glyph, OSSelector } from './components/ui';
import { Home } from './pages/Home';
import { SoftwareLayout } from './pages/SoftwareLayout';

function Header() {
  const { settings } = useAppState();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href={href('')} className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accentfg">DS</span>
          <span className="hidden sm:inline">Design Shortcuts Academy</span>
          <span className="sm:hidden">DSA</span>
        </a>
        <div className="flex items-center gap-2">
          <OSSelector os={settings.os} onChange={(os) => setSettings({ os })} />
          <button className={btn.secondary + ' !px-3'} onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
            <Glyph name={settings.theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function App() {
  const route = useRoute();
  const sw = isSoftware(route.path[0]) ? route.path[0] : undefined;
  useEffect(() => {
    const names = { photoshop: 'Photoshop', illustrator: 'Illustrator' } as const;
    document.title = sw ? `${names[sw]} · Design Shortcuts Academy` : 'Design Shortcuts Academy';
  }, [sw]);

  return (
    <div data-sw={sw} className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {sw ? <SoftwareLayout sw={sw} route={route} /> : <Home />}
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted sm:px-6">
        <p className="mx-auto max-w-3xl">
          Toolbar icons are cropped, unaltered, from the reference images you supplied. Shortcuts are Adobe&rsquo;s defaults for recent desktop versions and can differ by keyboard layout or customisation.
          This is an independent study aid, not an Adobe product.
        </p>
      </footer>
    </div>
  );
}
