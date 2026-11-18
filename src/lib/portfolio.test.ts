// Safe to edit by hand
// Pins the portfolio's pure helpers (src/lib/portfolio.ts): the EXIF line that
// is derived from the file (rule 15), the year grouping on /press/, and the
// placeholder photos every route falls back to with no Sanity data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collaboratorHref,
  formatExif,
  formatShutter,
  groupByYear,
  photoRatio,
  placeholderPhoto,
  storySequence,
  yearOf,
} from './portfolio.ts';

test('formatShutter reads fast and slow exposures', () => {
  assert.equal(formatShutter(0.004), '1/250s');
  assert.equal(formatShutter(1 / 60), '1/60s');
  assert.equal(formatShutter(2), '2s');
  assert.equal(formatShutter(0.5), '0.5s');
  assert.equal(formatShutter(null), '');
  assert.equal(formatShutter(0), '');
});

test('formatExif joins what the file carried, and nothing else', () => {
  assert.equal(
    formatExif({
      camera: 'Camera body',
      lens: 'Lens name',
      focalLength: 85,
      aperture: 1.8,
      shutter: 0.004,
      iso: 200,
    }),
    'Camera body · Lens name · 85mm · f/1.8 · 1/250s · ISO 200',
  );
  assert.equal(formatExif({ aperture: 2.8, iso: null }), 'f/2.8');
  assert.equal(formatExif({}), '');
  assert.equal(formatExif(null), '');
});

test('the EXIF line never carries an em-dash (rule 2)', () => {
  const line = formatExif({ camera: 'A', lens: 'B', aperture: 4, shutter: 0.01, iso: 100 });
  assert.ok(!line.includes('—'));
});

test('groupByYear puts the newest year first and undated last', () => {
  const groups = groupByYear([
    { date: '2024-05-01', id: 'a' },
    { date: null, id: 'b' },
    { date: '2026-01-10', id: 'c' },
    { date: '2024-11-01', id: 'd' },
  ]);
  assert.deepEqual(
    groups.map((g) => [g.year, g.items.map((i) => i.id)]),
    [
      [2026, ['c']],
      [2024, ['a', 'd']],
      [null, ['b']],
    ],
  );
  assert.equal(yearOf('2025-02-03'), 2025);
  assert.equal(yearOf(undefined), null);
});

test('placeholder photos have no asset, a label-able alt, and mixed shapes', () => {
  const photos = Array.from({ length: 6 }, (_, i) => placeholderPhoto(i));
  for (const p of photos) {
    assert.equal(p.asset, undefined);
    assert.ok(p.placeholder);
    assert.match(p.alt ?? '', /placeholder/i);
  }
  const ratios = new Set(photos.map((p) => photoRatio(p)));
  assert.ok(ratios.has(4 / 5) && ratios.has(3 / 2), 'both portrait and landscape');
});

test('photoRatio reads the asset id when the dimensions were not projected', () => {
  assert.equal(photoRatio({ asset: { _id: 'image-abc-1600x900-jpg' } }), 1600 / 900);
});

test('collaboratorHref prefers the website, then Instagram', () => {
  assert.equal(
    collaboratorHref({ url: 'https://example.com', instagram: 'x' }),
    'https://example.com',
  );
  assert.equal(collaboratorHref({ instagram: '@handle' }), 'https://www.instagram.com/handle/');
  assert.equal(collaboratorHref({}), null);
});

test('storySequence runs landscapes wide, pairs portraits and alternates lone portraits', () => {
  const p = (ratio: 'portrait' | 'landscape', n: number) => ({
    ...placeholderPhoto(n, 'x'),
    placeholder: { tone: 'paper' as const, ratio },
  });
  const rows = storySequence([
    p('portrait', 1),
    p('landscape', 2),
    p('portrait', 3),
    p('portrait', 4),
    p('portrait', 5),
    p('landscape', 6),
    p('portrait', 7),
  ]);
  assert.deepEqual(
    rows.map((r) => r.kind),
    ['single', 'wide', 'pair', 'single', 'wide', 'single'],
  );
  assert.deepEqual(
    rows.filter((r) => r.kind === 'single').map((r) => (r.kind === 'single' ? r.align : '')),
    ['start', 'end', 'start'],
  );
  assert.deepEqual(storySequence([]), []);
});
