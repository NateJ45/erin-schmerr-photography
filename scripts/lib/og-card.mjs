// Safe to edit by hand
// =============================================================================
// The site's share card, as scripts/build-og-cards.mjs draws it (PORTS.md card 169)
// =============================================================================
// build-og-cards.mjs (PORTABLE) imports exactly three things from this file:
//
//   cardHtml({ title, kicker?, home?, mark? })  -> the card's HTML (hashed for the cache)
//   renderHtml(html, { home?, type, quality })  -> { buffer } (the drawn image)
//   closeCards()                                 -> close the shared browser, once
//
// This version is the starter's generic card: the shared renderer
// (scripts/lib/render-og.mjs, PORTABLE) in the site's colours and display face
// (scripts/og-theme.mjs, written by apply-brand), the site's name as the
// wordmark and the page title under it. A site with its own card design
// replaces this file and keeps the three exports (first-baptist-auburn draws
// its own here).
//
//   title   the page title (Home: the Site settings tagline)
//   kicker  optional small line at the top (the section, a date); Home has none
//   mark    optional data: URI of the square icon from Site settings (card 168)
// =============================================================================

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeRenderer, ogCardHtml, renderOgHtml } from './render-og.mjs';
import { OG_THEME } from '../og-theme.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** The wordmark: brand.config.json's name (apply-brand keeps it in step with src/data/site.ts). */
function siteName() {
  try {
    return JSON.parse(readFileSync(resolve(root, 'brand/brand.config.json'), 'utf8')).name || '';
  } catch {
    return '';
  }
}
const NAME = siteName();

/**
 * The display face for the cards: Bodoni Moda's Latin file (2026-11-20). render-og's
 * file picker (PORTABLE) scores "-latin-" as a substring, so for @fontsource-variable/
 * bodoni-moda it ties the Latin file with the latin-ext one and takes latin-ext, which
 * has no a-z, and every card came out in Georgia. Until that is fixed in the starter
 * (docs/PENDING.md), this swaps the embedded face for the right file.
 */
const DISPLAY_FONT = resolve(
  root,
  'node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-normal.woff2',
);
export function withBrandFont(html) {
  let uri;
  try {
    uri = `data:font/woff2;base64,${readFileSync(DISPLAY_FONT).toString('base64')}`;
  } catch {
    return html;
  }
  return html.replace(
    /@font-face\{font-family:BrandDisplay;src:url\(data:font\/woff2;base64,[^)]*\)[^}]*\}/,
    // A share card is mostly seen as a small thumbnail, so it takes a fixed, sturdier
    // optical size (24) rather than the hairline 96 cut its 96px wordmark would get.
    () =>
      `@font-face{font-family:BrandDisplay;src:url(${uri}) format('woff2');font-display:block}` +
      `body{font-variation-settings:'opsz' 24}`,
  );
}

/** The card's HTML. Pure: the same request always gives the same HTML (and so the same hash). */
export function cardHtml({ title, kicker, home = false, mark }) {
  return withBrandFont(
    ogCardHtml({
      wordmark: NAME || title,
      tagline: NAME ? title : '',
      kicker: home ? undefined : kicker,
      mark,
      theme: OG_THEME,
    }),
  );
}

/** Draw the HTML from cardHtml to an image buffer. */
export async function renderHtml(html, { type = 'png', quality = 86 } = {}) {
  return { buffer: await renderOgHtml(html, { type, quality, theme: OG_THEME }) };
}

/** Close the shared browser. Call once at the end, or the process never exits. */
export const closeCards = closeRenderer;
