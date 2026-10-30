// Serves build/ like GitHub Pages (base path, 404.html fallback); `vite preview` does not serve
// the adapter fallback, so the service worker precache would fail there.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = 'build';
const port = Number(process.env.PORT ?? 4173);
const rawBase = process.env.VITE_BASE ?? '/';
const base = rawBase === './' ? '/' : rawBase.replace(/\/?$/, '/');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(base) && `${url}/` !== base) {
    res.writeHead(404).end();
    return;
  }
  let file = join(root, normalize(url.slice(base.length - 1)));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  const found = existsSync(file);
  if (!found) file = join(root, process.env.FALLBACK ?? '404.html');
  res.writeHead(found ? 200 : 404, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}${base}`));
