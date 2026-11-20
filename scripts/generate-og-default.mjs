// Foundation, edit with care
// Generates public/og-default.png — the fallback OG image used when a page
// doesn't have its own /og/<slug>.png yet. Run via `npm run og`.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { ogCardHtml, renderOgHtml, closeRenderer } from './lib/render-og.mjs';
import { withBrandFont } from './lib/og-card.mjs';
import { OG_THEME } from './og-theme.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Drawn through og-card.mjs's withBrandFont (2026-11-20): render-og's own font picker
// takes Bodoni Moda's latin-ext file and sets the card in Georgia (docs/PENDING.md).
const card = {
  wordmark: 'Tate Fine Art Photography',
  tagline: ['Fine-art portraits, Cincinnati and West Chester, Ohio.'],
  theme: OG_THEME,
};
const outPath = resolve(root, 'public/og-default.png');
writeFileSync(
  outPath,
  await renderOgHtml(withBrandFont(ogCardHtml(card)), { type: 'png', theme: OG_THEME }),
);
const result = { outPath, width: 1200, height: 630 };

// Not optional: the renderer holds one chromium open for the whole run and
// the process cannot exit until it is closed. See render-og.mjs.
await closeRenderer();

console.log(`OG default written: ${result.outPath} (${result.width}x${result.height})`);
