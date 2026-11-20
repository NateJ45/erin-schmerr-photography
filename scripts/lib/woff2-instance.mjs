// Safe to edit by hand. This site's own helper (not PORTABLE): one instance of a
// variable WOFF2 font, with outlines and advance widths at the given axis values.
//
// Why it exists: the brand faces (Bodoni Moda, Jost) come from @fontsource-variable
// packages, which ship only woff2. opentype.js cannot read woff2, and fontkitten
// (already in the tree under astro's fontace) reads it but cannot instance it:
// its getVariation() rebuilds a plain TTF reader over the woff2 bytes, and its
// woff2 glyph decoder never applies gvar deltas. So this takes fontkitten's
// decoded default outlines and runs them through its own variation processor
// (gvar for the points, HVAR for the advances), which is the part that works.
// Used by scripts/build-wordmark.mjs and scripts/font-fallback-variable.mjs.
import { readFileSync } from 'node:fs';
import { create } from 'fontkitten';

/** Copy of a fontkitten Point (same prototype, so path building still works). */
const clonePoint = (p) => Object.assign(Object.create(Object.getPrototypeOf(p)), p);

/**
 * Open a variable woff2 at fixed axis values, e.g. { wght: 400, opsz: 96 }.
 * Returns a fontkitten font whose glyphForCodePoint(...).path and .advanceWidth
 * are the instance's. Axes left out take their default.
 * @param {string} file path to the .woff2
 * @param {Record<string, number>} settings
 */
export function openInstance(file, settings = {}) {
  const buf = readFileSync(file);
  const base = create(buf);
  if (!base.fvar) return base;
  const coords = base.fvar.axis.map((a) => {
    const tag = a.axisTag.trim();
    const v = settings[tag] ?? a.defaultValue;
    return Math.max(a.minValue, Math.min(a.maxValue, v));
  });
  // Decode the default outlines once, with no variation processor in play.
  base._transformGlyfTable();
  const Stream = base.stream.constructor;
  const vf = new base.constructor(new Stream(buf), coords);
  const proc = vf._variationProcessor;
  const dummyPhantoms = () => {
    const P = base._transformedGlyphs.find((g) => g?.points?.length)?.points[0];
    return [0, 1, 2, 3].map(() => Object.assign(clonePoint(P), { x: 0, y: 0, endContour: true }));
  };
  vf._transformedGlyphs = base._transformedGlyphs.map((g, id) => {
    if (!g) return g;
    const copy = Object.assign(Object.create(Object.getPrototypeOf(g)), g);
    if (g.points?.length) {
      const pts = g.points.map(clonePoint);
      const all = pts.concat(dummyPhantoms());
      proc.transformPoints(id, all);
      copy.points = all.slice(0, pts.length);
    } else if (g.components?.length) {
      const P = dummyPhantoms()[0];
      const offs = g.components.map((c) => Object.assign(clonePoint(P), { x: c.dx, y: c.dy }));
      const all = offs.concat(dummyPhantoms());
      proc.transformPoints(id, all);
      copy.components = g.components.map((c, i) =>
        Object.assign(Object.create(Object.getPrototypeOf(c)), c, { dx: all[i].x, dy: all[i].y }),
      );
    }
    return copy;
  });
  return vf;
}
