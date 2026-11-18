// Draws the site wordmark as outlined SVG paths (src/assets/logo-light.svg and
// logo-dark.svg) from Instrument Serif, so it renders in the brand face even as
// an <img>, where web fonts never load. Re-run after a name change:
//   node scripts/build-wordmark.mjs "Erin Schmerr" "Photography"
// The brand name is still an open question for the client, so this is a script,
// not a hand-drawn file.
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';

const [name = 'Erin Schmerr', sub = 'Photography'] = process.argv.slice(2);
const dir = 'node_modules/@fontsource/instrument-serif/files/';
const load = (f) => {
  const buf = readFileSync(dir + f);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const roman = load('instrument-serif-latin-400-normal.woff');
const italic = load('instrument-serif-latin-400-italic.woff');

// Lays glyphs out by hand (cmap plus kerning): opentype.js's shaper throws on
// this font's contextual substitution tables.
function textPath(font, text, x, y, size) {
  const path = new opentype.Path();
  const scale = size / font.unitsPerEm;
  let prev = null;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) x += font.getKerningValue(prev, g) * scale;
    path.extend(g.getPath(x, y, size));
    x += g.advanceWidth * scale;
    prev = g;
  }
  return path;
}

const NAME_SIZE = 44;
const SUB_SIZE = 44;
const GAP = 12;
const namePath = textPath(roman, name, 0, NAME_SIZE, NAME_SIZE);
const nameBox = namePath.getBoundingBox();
const subPath = textPath(italic, sub, nameBox.x2 + GAP, NAME_SIZE, SUB_SIZE);
const subBox = subPath.getBoundingBox();

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
  <path fill="${ink}" d="${namePath.toPathData(2)}"/>
  <path fill="${soft}" d="${subPath.toPathData(2)}"/>
</svg>
`;
  writeFileSync(file, svg);
  console.log(`wrote ${file} (${w}x${h})`);
}

// The favicon (also the Studio's mark): an italic "E" in paper on a dusk
// square. `npm run favicon` builds the PNG set from it.
{
  const size = 64;
  const g = italic.charToGlyph(name.trim()[0] || 'E');
  const glyphSize = 58;
  const probe = g.getPath(0, 0, glyphSize).getBoundingBox();
  const x = (size - (probe.x2 - probe.x1)) / 2 - probe.x1;
  const y = (size - (probe.y2 - probe.y1)) / 2 - probe.y1;
  const d = g.getPath(x, y, glyphSize).toPathData(2);
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
