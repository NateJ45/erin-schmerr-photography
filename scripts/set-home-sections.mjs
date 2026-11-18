// Safe to edit by hand
// =============================================================================
// set-home-sections.mjs - the home page that sells the person and the process
// =============================================================================
// One-off content write for the home page (2026-11-18): replaces the homePage
// document's `pageBuilder` with the order below, so the page reads person first,
// then proof, who it is for, the work, the process, the craft, who is behind it
// and a signed close:
//
//   cover slides (with her portrait in the headline) -> proof strip -> who it
//   is for -> selected stories -> how a session works -> how I get the look ->
//   crew list -> tear sheets -> signed close
//
// The copy is a DRAFT for Erin, written from her own captions and interviews
// and the existing Sessions and About wording; nothing in it is invented (no
// clients, numbers or quotes she did not say). Keys are stable, so a re-run is
// a no-op on an unchanged document.
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify.
//
//   node scripts/set-home-sections.mjs                 # dry run: prints the plan
//   NCS_PRODUCTION_WRITE=yes node scripts/set-home-sections.mjs --apply
//
// The sections are exported (HOME_SECTIONS) so a local preview can build the
// page from them before the write; importing this file writes nothing.
// =============================================================================

import { pathToFileURL } from 'node:url';

/** Her portrait from the About page (from her CanvasRebel interview), cropped to her face. */
const PORTRAIT_ASSET = 'image-71c89d3edc3f69f61c398897b37707c418f2d0ce-1080x1620-jpg';

const block = (k, text) => ({
  _type: 'block',
  _key: k,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${k}s`, marks: [], text }],
});

const ME = 'Erin Schmerr';

export const HOME_SECTIONS = [
  {
    _key: 'home-hero',
    _type: 'coverHero',
    eyebrow: 'Fine-art portraits, Cincinnati and West Chester.',
    headline: 'I make portraits, slowly brought into focus.',
    subhead:
      'They look like they were found in an old album: vintage clothes, stories from books and films, and a lot of soft light.',
    portrait: {
      _type: 'image',
      asset: { _type: 'reference', _ref: PORTRAIT_ASSET },
      crop: { _type: 'sanity.imageCrop', top: 0.27, bottom: 0.51, left: 0.18, right: 0.38 },
      hotspot: { _type: 'sanity.imageHotspot', x: 0.43, y: 0.38, width: 0.3, height: 0.2 },
    },
    portraitAfterWord: 3,
    limit: 5,
    primaryCta: {
      _type: 'ctaBlock',
      label: 'Book a session',
      linkType: 'internal',
      internalLink: { _type: 'reference', _ref: 'contactPage' },
    },
    secondaryCta: {
      _type: 'ctaBlock',
      label: 'See the stories',
      linkType: 'external',
      externalUrl: '/stories/',
    },
  },
  {
    _key: 'home-proof',
    _type: 'proofStrip',
    heading: 'Press and interviews',
    showPress: true,
    quotes: [
      {
        _key: 'proof-essence',
        _type: 'proofQuote',
        text: "I never prioritize beauty standards. I want to capture a person's essence.",
        credit: 'Erin, in BleachFilm',
      },
      {
        _key: 'proof-emotion',
        _type: 'proofQuote',
        text: 'I like my work to evoke emotion',
        credit: 'Erin, in CanvasRebel',
      },
    ],
  },
  {
    _key: 'home-for',
    _type: 'richTextSection',
    eyebrow: 'Who I work with',
    heading:
      'Fine-art portrait sessions, editorials and creative collaborations, in Cincinnati and West Chester.',
    width: 'normal',
    align: 'left',
  },
  {
    _key: 'home-stories',
    _type: 'storyIndex',
    heading: 'Selected stories',
    layout: 'grid',
    limit: 6,
  },
  {
    _key: 'home-session',
    _type: 'stepsRailSection',
    heading: 'How a session works',
    firstStepCard: false,
    steps: [
      {
        _key: 'home-step-1',
        _type: 'railStep',
        title: 'We pick a decade, a character or a story',
        body: 'Tell me what you love: a film, a book, an era, a color. I’ll ask about you, too.',
      },
      {
        _key: 'home-step-2',
        _type: 'railStep',
        title: 'I find the clothes and the place',
        body: 'Wardrobe, styling, location and light, planned together. I love a good vintage find.',
      },
      {
        _key: 'home-step-3',
        _type: 'railStep',
        title: 'The day itself, unhurried',
        body: 'We take our time. I’ll show you a few frames as we go, so you can see it coming together.',
      },
      {
        _key: 'home-step-4',
        _type: 'railStep',
        title: 'The edit, and your gallery',
        body: 'I edit every frame by hand, often in several versions, then send you your gallery.',
      },
    ],
  },
  {
    _key: 'home-craft',
    _type: 'craftNotes',
    heading: 'How I get the look',
    intro:
      'I’ve spent years trying to perfect the look of an authentic vintage photograph, which means doing almost everything opposite to a modern shoot.',
    notes: [
      {
        _key: 'craft-grain',
        _type: 'craftNote',
        title: 'Grain on purpose',
        body: 'The pictures are meant to be grainy, the way an old film camera saw things.',
      },
      {
        _key: 'craft-shutter',
        _type: 'craftNote',
        title: 'The shutter speed turned down',
        body: 'A slower shutter keeps a little softness and movement in the frame.',
      },
      {
        _key: 'craft-exposure',
        _type: 'craftNote',
        title: 'Overexposed in places',
        body: 'I let the bright parts run, the way they did on my dad’s old camera.',
      },
      {
        _key: 'craft-edit',
        _type: 'craftNote',
        title: 'Edited by hand, in several versions',
        body: 'For every photo I take, I tend to edit multiple variations before one feels right.',
      },
      {
        _key: 'craft-dad',
        _type: 'craftNote',
        title: 'It started with my dad’s camera',
        body: 'Through his lens I fell in love with photography, and the look of his old pictures is the one I still chase.',
      },
    ],
  },
  {
    _key: 'home-crew',
    _type: 'crewSection',
    eyebrow: 'About',
    heading: 'It started with my dad’s camera.',
    body: [
      block(
        'home-intro-1',
        'My dad was a self-proclaimed picture nerd, never without a camera around his neck. Years after he died, I finally turned his camera on again and found the last photo he ever took: fall leaves, from our kitchen window.',
      ),
      block(
        'home-intro-2',
        'Through his lens I fell in love with photography. Now I chase the look of a real vintage photograph, one story at a time.',
      ),
    ],
    crewHeading: 'The crew',
    crew: [
      { _key: 'crew-concept', _type: 'crewRole', role: 'Concept', name: ME },
      { _key: 'crew-wardrobe', _type: 'crewRole', role: 'Wardrobe', name: ME },
      { _key: 'crew-location', _type: 'crewRole', role: 'Location', name: ME },
      { _key: 'crew-photography', _type: 'crewRole', role: 'Photography', name: ME },
      { _key: 'crew-edit', _type: 'crewRole', role: 'The edit', name: ME },
    ],
    link: {
      _type: 'ctaBlock',
      label: 'More about me',
      linkType: 'internal',
      internalLink: { _type: 'reference', _ref: 'aboutPage' },
    },
  },
  {
    _key: 'home-tearsheets',
    _type: 'tearSheetStack',
    heading: 'Tear sheets',
    limit: 4,
  },
  {
    _key: 'home-close',
    _type: 'signedClose',
    eyebrow: 'Booking sessions in Cincinnati and West Chester',
    heading: 'Bring me a decade, a character or a story.',
    body: 'Tell me the era or the story you have in mind, and we’ll plan a session around it. I read every message myself.',
    cta: {
      _type: 'ctaBlock',
      label: 'Book a session',
      linkType: 'internal',
      internalLink: { _type: 'reference', _ref: 'contactPage' },
    },
    signature: 'Erin',
  },
];

// Run directly: write (or, by default, print) the new pageBuilder.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { client, dataset, apply, done } = await import('./lib/sanity-lib.mjs');
  const current = await client.fetch('*[_id == "homePage"][0]{ _rev, pageBuilder }');
  if (!current) throw new Error(`No homePage document in ${dataset}.`);
  const before = (current.pageBuilder ?? []).map((s) => `${s._type}:${s._key}`);
  const after = HOME_SECTIONS.map((s) => `${s._type}:${s._key}`);
  console.log(`homePage in ${dataset}, revision ${current._rev}`);
  console.log(`  now:   ${before.join(', ')}`);
  console.log(`  after: ${after.join(', ')}`);
  const same = JSON.stringify(current.pageBuilder) === JSON.stringify(HOME_SECTIONS);
  if (same) {
    console.log('Already in place; nothing to write.');
    done(0);
  } else {
    // ifRevisionId: refuse if someone edited the page since the read above.
    await apply('homePage: set pageBuilder to the selling order', () =>
      client
        .patch('homePage')
        .ifRevisionId(current._rev)
        .set({ pageBuilder: HOME_SECTIONS })
        .commit(),
    );
    done(1);
  }
}
