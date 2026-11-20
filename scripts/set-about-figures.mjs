// Safe to edit by hand
// =============================================================================
// set-about-figures.mjs - stand-in photos for About's "Behind the scenes" (2026-11-20)
// =============================================================================
// One-off content write. The About page's processFigures block (`about-process`)
// had no photos, so it drew five labelled placeholder gradients. Until Erin sends
// real behind-the-scenes shots, this fills its five slots with photos from her
// own stories, picked for the set and the scene more than the face (a sign
// museum, a glittering wardrobe, a 1950s living room, a chair on a pine path, a
// lit porch) and in slot order: wide, tall, large, small, small. Each caption
// names the story it comes from, so nothing claims to be a behind-the-scenes
// shot that is not one. When her photos arrive she replaces them in the Studio
// (About page, "About: behind the scenes"); this script is then history.
//
// Only that one block's `figures` changes; the rest of the About page (and any
// block added since set-about-sections.mjs) is left alone.
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify.
//
//   node scripts/set-about-figures.mjs                  # dry run: prints the plan
//   NCS_PRODUCTION_WRITE=yes node scripts/set-about-figures.mjs --apply
// =============================================================================

const BLOCK_KEY = 'about-process';

const figure = (key, ref, alt, caption) => ({
  _type: 'image',
  _key: key,
  alt,
  caption,
  asset: { _type: 'reference', _ref: ref },
});

export const FIGURES = [
  figure(
    'fig-1',
    'image-3aa143216d09830a574448176cc46a081cd7b174-1080x719-jpg',
    'A woman in white with arms raised among giant old letters and a Jewelers sign',
    'From American Sign Museum',
  ),
  figure(
    'fig-2',
    'image-476e7fa6408d8ed18791cb86df3e0a916d8c21bb-1080x1350-jpg',
    'In a pink-lit wardrobe of glittering jackets and boots',
    'From Taking Up Space',
  ),
  figure(
    'fig-3',
    'image-2693aa2f66f3c63a70d029a93d78381afbe02a12-1080x1343-jpg',
    'The whole party on the floor of the living room, cards and drinks between them',
    'From A 1950s Halloween at home',
  ),
  figure(
    'fig-4',
    'image-1246e556127ba3cfc0bcde7cd1268d398a2b2196-1080x1350-jpg',
    'Standing on a chair in the middle of a pine path',
    'From The vintage dress',
  ),
  figure(
    'fig-5',
    'image-793c551c1f315391249daec267f439b1f06aa6c3-1080x1350-jpg',
    'A porch glowing orange at night',
    'From Pink Halloween',
  ),
];

const { client, dataset, apply, done } = await import('./lib/sanity-lib.mjs');
const current = await client.fetch('*[_id == "aboutPage"][0]{ _rev, pageBuilder }');
if (!current) throw new Error(`No aboutPage document in ${dataset}.`);
const block = (current.pageBuilder ?? []).find((s) => s._key === BLOCK_KEY);
if (!block || block._type !== 'processFigures') {
  throw new Error(`aboutPage has no processFigures block keyed ${BLOCK_KEY}.`);
}
console.log(`aboutPage in ${dataset}, revision ${current._rev}`);
console.log(`  now:   ${(block.figures ?? []).length} figures`);
console.log(`  after: ${FIGURES.map((f) => f.caption).join(' | ')}`);
// Compare what matters (the photo and its words); the API returns keys in its own order.
const sig = (figs) => JSON.stringify(figs.map((f) => [f._key, f.asset?._ref, f.alt, f.caption]));
if (sig(block.figures ?? []) === sig(FIGURES)) {
  console.log('Already in place; nothing to write.');
  done(0);
} else {
  // ifRevisionId: refuse if someone edited the page since the read above.
  await apply('aboutPage: set the behind-the-scenes stand-in photos', () =>
    client
      .patch('aboutPage')
      .ifRevisionId(current._rev)
      .set({ [`pageBuilder[_key=="${BLOCK_KEY}"].figures`]: FIGURES })
      .commit(),
  );
  done(1);
}
