// Draws the site wordmark as outlined SVG paths (src/assets/logo-light.svg and
// logo-dark.svg) from Bodoni Moda, so it renders in the brand face even as an
// <img>, where web fonts never load. Re-run after a name or face change:
//   node scripts/build-wordmark.mjs "Tate" "Fine Art Photography"
// The name became Tate Fine Art Photography on 2026-11-18 (her business name);
// the face became Bodoni Moda on 2026-11-20 (the "Couture" pairing).
//
// How: Bodoni Moda ships as a variable woff2 (weight and optical size), which
// opentype.js cannot read. scripts/lib/woff2-instance.mjs gives the outlines at
// one optical size, and headless Chromium (Playwright, already a dev dependency)
// lays the words out with the same file, so the spacing carries the font's own
// GPOS kerning (fontkitten has no shaper). Each glyph is then placed at the pen
// position Chromium measured.
//
// The wordmark is drawn at optical size 24: it shows at roughly 15 to 28px in the
// header and footer, where the 96 cut's hairlines would break up, and 24 keeps
// the Didone contrast while staying solid at that size.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { openInstance } from './lib/woff2-instance.mjs';

const [name = 'Tate', sub = 'Fine Art Photography'] = process.argv.slice(2);
const dir = 'node_modules/@fontsource-variable/bodoni-moda/files/';
const ROMAN_FILE = dir + 'bodoni-moda-latin-opsz-normal.woff2';
const ITALIC_FILE = dir + 'bodoni-moda-latin-opsz-italic.woff2';
const OPSZ = 24;
const roman = openInstance(ROMAN_FILE, { wght: 400, opsz: OPSZ });
const italic = openInstance(ITALIC_FILE, { wght: 400, opsz: OPSZ });

/** Pen x of every character of `text`, in ems, as Chromium shapes it (kerning on). */
async function penPositions(page, file, text) {
  const uri = 'data:font/woff2;base64,' + readFileSync(file).toString('base64');
  return page.evaluate(
    async ({ uri, text, opsz }) => {
      const face = new FontFace('Probe', `url(${uri})`);
      await face.load();
      document.fonts.add(face);
      const el = document.createElement('span');
      el.style.cssText = `font: 400 1000px Probe; font-variation-settings: 'opsz' ${opsz}; font-kerning: normal; font-variant-ligatures: none; white-space: pre; position: absolute; left: 0; top: 0;`;
      el.textContent = text;
      document.body.replaceChildren(el);
      const node = el.firstChild;
      const range = document.createRange();
      const xs = [];
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        xs.push(range.getBoundingClientRect().left / 1000);
      }
      document.fonts.delete(face);
      return xs;
    },
    { uri, text, opsz: OPSZ },
  );
}

/** One SVG path for `text`, each glyph at Chromium's pen position. */
function textPath(font, text, xs, x0, baseline, size) {
  const scale = size / font.unitsPerEm;
  return [...text]
    .map((ch, i) => {
      const g = font.glyphForCodePoint(ch.codePointAt(0));
      if (!g.path.commands.length) return '';
      return g.path
        .scale(scale, -scale)
        .translate(x0 + xs[i] * size, baseline)
        .toSVG();
    })
    .join('');
}
/** Bounding box of an SVG path's points (good enough for a padded viewBox). */
function box(font, text, xs, x0, baseline, size) {
  const scale = size / font.unitsPerEm;
  let x1 = Infinity,
    y1 = Infinity,
    x2 = -Infinity,
    y2 = -Infinity;
  [...text].forEach((ch, i) => {
    const b = font.glyphForCodePoint(ch.codePointAt(0)).path.bbox;
    if (!Number.isFinite(b.minX)) return;
    const gx = x0 + xs[i] * size;
    x1 = Math.min(x1, gx + b.minX * scale);
    x2 = Math.max(x2, gx + b.maxX * scale);
    y1 = Math.min(y1, baseline - b.maxY * scale);
    y2 = Math.max(y2, baseline - b.minY * scale);
  });
  return { x1, y1, x2, y2 };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const nameXs = await penPositions(page, ROMAN_FILE, name);
const subXs = await penPositions(page, ITALIC_FILE, sub);
await browser.close();

const NAME_SIZE = 44;
const SUB_SIZE = 44;
const GAP = 12;
const nameBox = box(roman, name, nameXs, 0, NAME_SIZE, NAME_SIZE);
const subX = nameBox.x2 + GAP;
const subBox = box(italic, sub, subXs, subX, NAME_SIZE, SUB_SIZE);
const nameD = textPath(roman, name, nameXs, 0, NAME_SIZE, NAME_SIZE);
const subD = textPath(italic, sub, subXs, subX, NAME_SIZE, SUB_SIZE);

const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 100) / 100));
const pad = 2;
const x0 = Math.floor(Math.min(nameBox.x1, subBox.x1)) - pad;
const y0 = Math.floor(Math.min(nameBox.y1, subBox.y1)) - pad;
const w = Math.ceil(Math.max(nameBox.x2, subBox.x2)) + pad - x0;
const h = Math.ceil(Math.max(nameBox.y2, subBox.y2)) + pad - y0;
const label = `${name} ${sub}`.trim();

for (const [file, ink, soft] of [
  ['src/assets/logo-light.svg', '#1F1B18', '#7A4A40'],
  ['src/assets/logo-dark.svg', '#EEE7DD', '#D6A898'],
]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="${label}">
  <path fill="${ink}" d="${round(nameD)}"/>
  <path fill="${soft}" d="${round(subD)}"/>
</svg>
`;
  writeFileSync(file, svg);
  console.log(`wrote ${file} (${w}x${h})`);
}

// The favicon (also the Studio's mark): the name's first letter in Bodoni italic,
// paper on a dusk square, at optical size 11 (the sturdy small cut, since the mark is
// mostly seen at 16 to 32px). `npm run favicon` builds the PNG set from it.
{
  const size = 64;
  const mark = openInstance(ITALIC_FILE, { wght: 400, opsz: 11 });
  const g = mark.glyphForCodePoint((name.trim()[0] || 'T').codePointAt(0));
  const glyphSize = 52;
  const s = glyphSize / mark.unitsPerEm;
  const b = g.path.bbox;
  const gw = (b.maxX - b.minX) * s;
  const gh = (b.maxY - b.minY) * s;
  const x = (size - gw) / 2 - b.minX * s;
  const y = (size - gh) / 2 + b.maxY * s;
  const d = round(g.path.scale(s, -s).translate(x, y).toSVG());
  writeFileSync(
    'public/favicon.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#7A4A40"/>
  <path fill="#F3EEE7" d="${d}"/>
</svg>
`,
  );
  console.log('wrote public/favicon.svg');
}
