#!/usr/bin/env node
// Safe to edit by hand. This site's own (not PORTABLE) companion to `npm run font-fallback`.
//
//   npm run font-fallback:variable          # write src/styles/font-fallbacks.css
//   npm run font-fallback:variable -- --dry # print it, write nothing
//
// The PORTABLE generator (scripts/font-fallback.mjs, card 188) reads a .woff with opentype.js.
// Both brand faces here come from @fontsource-variable packages, which ship woff2 only, and
// the display face has an optical-size axis whose widths it could not pick anyway. So this
// opens each woff2 at a fixed instance (scripts/lib/woff2-instance.mjs), measures it the same
// way, and runs the numbers through the same maths (scripts/lib/font-fallback.mjs):
//   - Bodoni Moda Variable at wght 400, opsz 72: titles, which are what wrap and shift, run
//     at 40px and up, where `font-optical-sizing: auto` picks a high optical size. Widths
//     barely move across the axis (915 at opsz 48 to 96, 922 at 18), so one instance serves.
//   - Jost Variable at wght 400 over Arial and its Linux twins (Liberation Sans, Arimo), so
//     running text breaks where the real face will.
// Rerun after any change of brand face.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fallbackCss, weightedAverageWidth } from './lib/font-fallback.mjs';
import { openInstance } from './lib/woff2-instance.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');

const FACES = [
  {
    family: 'Bodoni Moda Variable',
    generic: 'serif',
    file: 'node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-normal.woff2',
    settings: { wght: 400, opsz: 72 },
  },
  {
    family: 'Jost Variable',
    generic: 'sans-serif',
    file: 'node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2',
    settings: { wght: 400 },
  },
];

function metrics(face) {
  const font = openInstance(resolve(root, face.file), face.settings);
  return {
    upm: font.unitsPerEm,
    ascent: font.hhea.ascent,
    descent: font.hhea.descent,
    lineGap: font.hhea.lineGap,
    xWidthAvg: weightedAverageWidth((ch) => {
      const g = font.glyphForCodePoint(ch.codePointAt(0));
      return g && g.id !== 0 ? g.advanceWidth : undefined;
    }, font['OS/2'].xAvgCharWidth),
  };
}

const blocks = FACES.map((face) => {
  const web = metrics(face);
  return [
    '/* ' +
      face.family +
      ': ' +
      face.file.replace('node_modules/', '') +
      ' at ' +
      JSON.stringify(face.settings) +
      ' (upm ' +
      web.upm +
      ', hhea ' +
      web.ascent +
      ' / ' +
      web.descent +
      ', weighted width ' +
      web.xWidthAvg +
      '). */',
    fallbackCss(face.family, face.generic, web),
  ].join('\n');
});

const css = [
  '/* Safe to edit by hand, but WRITTEN BY `npm run font-fallback:variable`',
  '   (scripts/font-fallback-variable.mjs; the maths is PORTS.md card 188). Metric-matched stand-ins',
  "   for the two brand faces while they load: a local font scaled to the web font's average letter",
  '   width and given its ascent and descent, so a line drawn in the fallback breaks where the real',
  '   one will and the page does not jump when the font arrives. Named second in each stack',
  '   (brand.config.json fonts.display.familyValue and fonts.body.familyValue). The Times and Arial',
  '   faces also name their Linux metric twins (Liberation, Tinos, Arimo), so CI draws the same. */',
  ...blocks,
  '',
].join('\n');

if (dry) process.stdout.write(css);
else {
  writeFileSync(resolve(root, 'src/styles/font-fallbacks.css'), css);
  console.log('Wrote src/styles/font-fallbacks.css');
}
