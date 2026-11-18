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
  proofItems,
  splitAfterWord,
  storyCast,
  storyFrames,
  storySequence,
  withoutSeedPlaceholders,
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

test('storyFrames opens on the cover and never shows the same photo twice', () => {
  const a = { asset: { _id: 'image-a-1080x1350-jpg' } };
  const b = { asset: { _id: 'image-b-1080x1350-jpg' } };
  const c = { asset: { _id: 'image-c-1350x1080-jpg' } };
  assert.deepEqual(storyFrames(a, [b, a, c]), [a, b, c]);
  assert.deepEqual(storyFrames(null, [b, c]), [b, c]);
  assert.deepEqual(storyFrames(a, null), [a]);
  const p1 = placeholderPhoto(1);
  const p2 = placeholderPhoto(2);
  assert.equal(storyFrames(p1, [p1, p2]).length, 3);
});

test('withoutSeedPlaceholders: seeded placeholders step aside once one real document exists', () => {
  const seedOnly = [{ _id: 'placeholder-story-one' }, { _id: 'drafts.placeholder-story-two' }];
  assert.deepEqual(withoutSeedPlaceholders(seedOnly), seedOnly);
  const mixed = [
    { _id: 'placeholder-story-one' },
    { _id: 'ig-story-abc' },
    { _id: 'drafts.placeholder-x' },
  ];
  assert.deepEqual(withoutSeedPlaceholders(mixed), [{ _id: 'ig-story-abc' }]);
  assert.deepEqual(withoutSeedPlaceholders([]), []);
});

test('splitAfterWord puts the portrait after the named word', () => {
  assert.deepEqual(splitAfterWord('Portraits, slowly brought into focus.', 1), [
    'Portraits,',
    'slowly brought into focus.',
  ]);
  assert.deepEqual(splitAfterWord('One two three', 2), ['One two', 'three']);
  // Past the last word, or one word only: everything before, nothing after.
  assert.deepEqual(splitAfterWord('One two', 5), ['One two', '']);
  assert.deepEqual(splitAfterWord('Alone', 1), ['Alone', '']);
  assert.deepEqual(splitAfterWord('One two', 0), ['One', 'two']);
});

test('storyCast drops a venue already named as the place', () => {
  const credits = [
    { name: 'vampirebby' },
    { name: 'American Sign Museum' },
    { name: 'vampirebby' },
    { name: '' },
  ];
  assert.deepEqual(storyCast(credits, 'American Sign Museum, Cincinnati'), ['vampirebby']);
  assert.deepEqual(storyCast(credits, null), ['vampirebby', 'American Sign Museum']);
  assert.deepEqual(storyCast(null, 'Anywhere'), []);
});

test('proofItems lists each feature once and spreads the quotes between them', () => {
  const pubs = [
    { magazine: 'A', issue: 'One' },
    { magazine: 'B', issue: null },
    { magazine: 'B', issue: null },
    { magazine: 'C', issue: 'Three' },
    { magazine: 'D' },
  ];
  const quotes = [{ text: 'First', credit: 'Me' }, { text: 'Second' }, { text: '  ' }];
  const items = proofItems(pubs, quotes);
  assert.deepEqual(
    items.map((i) => i.text),
    ['A', 'B', 'First', 'C', 'D', 'Second'],
  );
  assert.equal(items[0].credit, 'One');
  assert.equal(items[2].credit, 'Me');
  assert.deepEqual(
    proofItems([], quotes).map((i) => i.kind),
    ['quote', 'quote'],
  );
  assert.deepEqual(proofItems(pubs, []).length, 4);
});
