// Safe to edit by hand
// Local cut-outs for `astro dev` only (the home Cinema's cover frames,
// DESIGN.md "Cover frame"). scripts/make-cutouts.mjs --out <dir> writes
// `<storyId>.webp` and `<storyId>.json` into a folder OUTSIDE the repo; with
// CINEMA_CUTOUTS_DIR=<dir> set, `astro dev` serves those files at
// /__local-cutouts/ and hands CoverHero.astro their measurements through the
// `__LOCAL_CUTOUTS__` define, so the real effect can be seen before anything is
// written to Sanity.
//
// Why dev only: a build is what gets deployed, and her photographs must never
// ride along in dist/ from someone's local folder. In `astro build`, in CI, and
// whenever the variable is unset the define is null and nothing is served, so
// the site reads the cut-outs from Sanity (`coverCutout`) or draws the cover
// without one.
import { existsSync, readdirSync, readFileSync, createReadStream } from 'node:fs';
import { resolve, basename } from 'node:path';
import type { Plugin } from 'vite';

export interface LocalCutout {
  url: string;
  cutoutOf: string;
  subject: Record<string, number>;
}

const PREFIX = '/__local-cutouts/';

function readDir(dir: string): Record<string, LocalCutout> {
  const out: Record<string, LocalCutout> = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const id = basename(file, '.json');
    if (!existsSync(resolve(dir, `${id}.webp`))) continue;
    try {
      const meta = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
      out[id] = { url: `${PREFIX}${id}.webp`, cutoutOf: meta.cutoutOf, subject: meta.subject };
    } catch {
      /* a half-written file: skip it */
    }
  }
  return out;
}

export function localCutouts(): Plugin {
  const dir = process.env.CINEMA_CUTOUTS_DIR;
  let active = false;
  return {
    name: 'tate-local-cutouts',
    config(_, { command }) {
      active = command === 'serve' && !!dir && !process.env.CI && existsSync(dir);
      const data = active ? readDir(dir!) : null;
      if (active)
        console.log(`[local-cutouts] ${Object.keys(data!).length} cut-out(s) from ${dir}`);
      return { define: { __LOCAL_CUTOUTS__: JSON.stringify(data) } };
    },
    configureServer(server) {
      if (!active) return;
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(PREFIX)) return next();
        const name = basename(decodeURIComponent(req.url.slice(PREFIX.length).split('?')[0]));
        const file = resolve(dir!, name);
        if (!name.endsWith('.webp') || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'no-store');
        createReadStream(file).pipe(res);
      });
    },
  };
}
