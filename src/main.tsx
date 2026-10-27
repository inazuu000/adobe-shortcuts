import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme } from './lib/store';

applyTheme();
createRoot(document.getElementById('root') as HTMLElement).render(<App />);
