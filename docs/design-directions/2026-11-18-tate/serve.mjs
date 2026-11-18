// Serves this folder at http://localhost:4321 with no dependencies: node serve.mjs
// Port 4321 is on the Sanity project's CORS list, which the WebGL direction (G) needs to read the photos.
// Stop the site's own dev server first if it is running on the same port.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.md': 'text/plain; charset=utf-8',
};

http
  .createServer(async (req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).slice(1) || 'index.html';
    const file = resolve(join(root, rel));
    if (file !== root && !file.startsWith(root + sep)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res
        .writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
        .end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(4321, () => console.log('http://localhost:4321/'));
