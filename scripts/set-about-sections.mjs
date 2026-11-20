// Safe to edit by hand
// =============================================================================
// set-about-sections.mjs - the boutique About page (2026-11-20)
// =============================================================================
// One-off content write for the About page: replaces the aboutPage document's
// `pageBuilder` with the six bands of the boutique About (DESIGN.md "About
// page"):
//
//   opening (aboutOpening) -> portrait and story (aboutStory) -> approach
//   (aboutApproach) -> behind the scenes (processFigures) -> as seen in
//   (pressContents) -> signed close (signedClose)
//
// Every word is hers, carried over from the About page as it stood on
// 2026-11-20 (the hero, "Through my dad's lens", the approach) and from her
// interview lines on the home page's proof strip. Nothing is invented. Two
// things stay placeholders until she sends them: the behind-the-scenes photos
// (processFigures has none, so it draws five labelled placeholders) and a scan
// of her signature (signedClose shows her typed name in the display italic).
// The two photos are covers of her own stories, picked to stand in until she
// chooses; she can swap them in the Studio.
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify. Run it only
// after the PR that adds these block types has deployed, or the Studio meets
// blocks it does not know (rule 1).
//
//   node scripts/set-about-sections.mjs                  # dry run: prints the plan
//   NCS_PRODUCTION_WRITE=yes node scripts/set-about-sections.mjs --apply
//   node scripts/set-about-sections.mjs --snapshot       # CI's content copy only
//
// --snapshot writes the same sections into ci/sanity-snapshot.ndjson.gz (the
// pinned content CI builds from, PORTS.md card 138) and touches nothing else,
// so CI renders the page the dataset will hold. The photos are not in that
// snapshot, so CI draws them as placeholders.
// =============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const image = (ref, alt) => ({
  _type: 'image',
  alt,
  asset: { _type: 'reference', _ref: ref },
});

const block = (k, text) => ({
  _type: 'block',
  _key: k,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${k}s`, marks: [], text }],
});

export const ABOUT_SECTIONS = [
  {
    _key: 'about-hero',
    _type: 'aboutOpening',
    eyebrow: 'About',
    headline: 'I started photography because I was afraid of _forgetting_ it all.',
    subhead: 'Editorial and conceptual portraits, Cincinnati and West Chester, Ohio.',
    // The cover of her Sleepy Hollow story.
    image: image(
      'image-ce858e4c6e05d280b40acaa3aedc0419d3487628-1080x1350-jpg',
      'A woman in black lace in a field at dusk, looking up',
    ),
  },
  {
    _key: 'about-start',
    _type: 'aboutStory',
    eyebrow: 'How it started',
    heading: 'Through my dad’s lens.',
    body: [
      block(
        'about-start-1',
        'My dad was a self-proclaimed picture nerd my entire childhood. He always had a camera strap around his neck, and he loved to document the world around him, especially nature.',
      ),
      block(
        'about-start-2',
        'When he died, his camera sat on my dresser for seven years. When I finally turned it on again, I saw the last photo he ever took: the fall leaves from our kitchen window. It struck me how much it matters to notice the beauty we would otherwise take for granted.',
      ),
      block(
        'about-start-3',
        'Through his lens I fell in love with photography. I’m mostly self-taught, and my work has since run in BleachFilm, Hollyway, Elysium and Fienfh, and on PhotoVogue.',
      ),
    ],
    portrait: image(
      'image-71c89d3edc3f69f61c398897b37707c418f2d0ce-1080x1620-jpg',
      'Erin in a pink dress among tall dry grass, holding her camera',
    ),
  },
  {
    _key: 'about-approach',
    _type: 'aboutApproach',
    eyebrow: 'Approach',
    statement: 'I want to capture a person’s essence.',
    body: [
      block(
        'about-approach-1',
        'I never prioritize beauty standards. Most of my shoots start from a decade, a book or a film: Tuck Everlasting, A Midsummer Night’s Dream, a 1950s Halloween party at home.',
      ),
      block(
        'about-approach-2',
        'Then I chase the look of an authentic vintage photograph, which means doing almost everything opposite to a modern shoot: grain on purpose, a slower shutter, highlights allowed to run. For every photo I take, I tend to edit several variations before one feels right.',
      ),
    ],
    voice: 'I like my work to evoke emotion.',
    voiceCredit: 'Erin, in CanvasRebel',
    // The cover of her Midsummer Night's Dream story.
    image: image(
      'image-898f65f91792769481299578c0a3a70e92ea2aa5-1080x1350-jpg',
      'A fairy with lavender hair and pale wings, her back to the camera, among leaves',
    ),
  },
  {
    _key: 'about-process',
    _type: 'processFigures',
    label: 'Process',
    heading: 'Behind the scenes',
    figures: [],
  },
  {
    _key: 'about-press',
    _type: 'pressContents',
    heading: 'As seen in',
  },
  {
    _key: 'about-cta',
    _type: 'signedClose',
    eyebrow: 'Sessions',
    heading: 'Tell me the era or the story you have in mind.',
    body: 'We’ll plan a session around it. I read every message myself.',
    cta: {
      _type: 'ctaBlock',
      label: 'Book a session',
      linkType: 'internal',
      internalLink: { _type: 'reference', _ref: 'contactPage' },
    },
    signature: 'Erin',
  },
];

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = resolve(ROOT, 'ci/sanity-snapshot.ndjson.gz');

/** Put the sections into the CI snapshot's aboutPage; nothing else in the file changes. */
function writeSnapshot() {
  const lines = gunzipSync(readFileSync(SNAPSHOT)).toString('utf8').split('\n');
  let found = false;
  const out = lines.map((line) => {
    if (!line) return line;
    const doc = JSON.parse(line);
    if (doc._id !== 'aboutPage') return line;
    found = true;
    return JSON.stringify({ ...doc, pageBuilder: ABOUT_SECTIONS });
  });
  if (!found) throw new Error('No aboutPage in the snapshot.');
  writeFileSync(SNAPSHOT, gzipSync(Buffer.from(out.join('\n'), 'utf8')));
  console.log(`Snapshot: aboutPage.pageBuilder set (${ABOUT_SECTIONS.length} sections).`);
}

// Run directly: write the snapshot, or write (by default, print) the live pageBuilder.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--snapshot')) {
    writeSnapshot();
  } else {
    const { client, dataset, apply, done } = await import('./lib/sanity-lib.mjs');
    const current = await client.fetch('*[_id == "aboutPage"][0]{ _rev, pageBuilder }');
    if (!current) throw new Error(`No aboutPage document in ${dataset}.`);
    const before = (current.pageBuilder ?? []).map((s) => `${s._type}:${s._key}`);
    const after = ABOUT_SECTIONS.map((s) => `${s._type}:${s._key}`);
    console.log(`aboutPage in ${dataset}, revision ${current._rev}`);
    console.log(`  now:   ${before.join(', ')}`);
    console.log(`  after: ${after.join(', ')}`);
    if (JSON.stringify(current.pageBuilder) === JSON.stringify(ABOUT_SECTIONS)) {
      console.log('Already in place; nothing to write.');
      done(0);
    } else {
      // ifRevisionId: refuse if someone edited the page since the read above.
      await apply('aboutPage: set pageBuilder to the boutique About', () =>
        client
          .patch('aboutPage')
          .ifRevisionId(current._rev)
          .set({ pageBuilder: ABOUT_SECTIONS })
          .commit(),
      );
      done(1);
    }
  }
}
