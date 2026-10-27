// Build script: esbuild bundles the React/TypeScript app, Tailwind's compiler generates the CSS.
import { build } from 'esbuild';
import { compile } from 'tailwindcss';
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.dirname(new URL(import.meta.url).pathname);
const dist = path.join(root, 'dist');

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

// 1. JavaScript
await build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true, minify: true, sourcemap: true, format: 'iife', target: 'es2020',
  jsx: 'automatic', outfile: path.join(dist, 'app.js'), legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
});

// 2. CSS (Tailwind v4)
async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx?|html)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = [...(await walk(path.join(root, 'src'))), path.join(root, 'index.html')];
const candidates = new Set();
for (const f of files) {
  const text = await fs.readFile(f, 'utf8');
  for (const tok of text.split(/[\s"'`{}<>;]+/)) if (tok) candidates.add(tok);
}
const input = await fs.readFile(path.join(root, 'src/styles.css'), 'utf8');
const compiler = await compile(input, {
  base: root,
  async loadStylesheet(id, base) {
    const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css')
      : id.startsWith('.') ? path.resolve(base, id) : require.resolve(id);
    return { path: file, base: path.dirname(file), content: await fs.readFile(file, 'utf8') };
  },
});
await fs.writeFile(path.join(dist, 'app.css'), compiler.build([...candidates]));

// 3. HTML + static assets (reference images and the cropped icons)
await fs.copyFile(path.join(root, 'index.html'), path.join(dist, 'index.html'));
await fs.cp(path.join(root, 'public'), dist, { recursive: true });
console.log('Built to dist/');
