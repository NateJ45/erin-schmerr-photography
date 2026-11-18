// Safe to edit by hand
// =============================================================================
// seed-pages.mjs - the Sessions page and the About page, as labelled placeholders
// =============================================================================
// Writes the two pages a visitor reads before booking, in the portfolio's own
// shape, so the client has something in her voice's place to edit rather than
// the starter's small-business placeholders:
//
//   - a Studio page at /sessions/ (custom `page`, slug "sessions"): how a session
//     works (steps), a client's words (quote), questions (fold-outs) and the
//     booking band. All blocks a custom page already offers.
//   - the About page's sections: a hero, how it started, the approach, a
//     portrait beside a few lines, the booking band.
//
// Every visitor-facing string either starts "Placeholder:" or is structurally
// neutral (PORTS.md card 44), so nothing here can ship as if it were her words.
// No prices: whether prices show on the site is her call.
//
// Dry by default. Writing needs --apply, and on production also
// NCS_PRODUCTION_WRITE=yes in the same command (backup, dry run, apply, verify):
//   node scripts/seed-pages.mjs
//   NCS_PRODUCTION_WRITE=yes node scripts/seed-pages.mjs --apply
// Idempotent: the Sessions page has a fixed _id and is replaced whole; About's
// pageBuilder is replaced whole. Run `npm run audit:data` afterwards.
// =============================================================================

import { APPLY, apply, client, done } from './lib/sanity-lib.mjs';

const block = (key, text) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
});
// Buttons point at a page document, as an editor's would from the page picker.
const pageCta = (label, id) => ({
  _type: 'ctaBlock',
  label,
  linkType: 'internal',
  internalLink: { _type: 'reference', _ref: id },
});

const sessions = {
  _id: 'page-sessions',
  _type: 'page',
  title: 'Sessions',
  slug: { _type: 'slug', current: 'sessions' },
  navLabel: 'Sessions',
  seoDescription:
    'How a fine-art portrait session works, from the first message to the finished prints.',
  pageBuilder: [
    {
      _type: 'heroSection',
      _key: 'sessions-hero',
      eyebrow: 'Sessions',
      headline: 'A portrait, made slowly.',
      subhead:
        'Placeholder: a sentence or two on what a session with you feels like and who it is for.',
      size: 'short',
    },
    {
      _type: 'stepsRailSection',
      _key: 'sessions-steps',
      heading: 'How a session works',
      steps: [
        {
          _type: 'railStep',
          _key: 'step-1',
          title: 'We talk',
          body: 'Placeholder: how the first conversation goes, and what you ask about.',
        },
        {
          _type: 'railStep',
          _key: 'step-2',
          title: 'We plan the look',
          body: 'Placeholder: wardrobe, styling, location and light, planned together.',
        },
        {
          _type: 'railStep',
          _key: 'step-3',
          title: 'The session',
          body: 'Placeholder: how long it lasts and what the day is like.',
        },
        {
          _type: 'railStep',
          _key: 'step-4',
          title: 'Your portraits',
          body: 'Placeholder: when the gallery arrives and how prints and albums work.',
        },
      ],
      firstStepCard: false,
    },
    {
      _type: 'quoteSection',
      _key: 'sessions-quote',
      quote: 'Placeholder: a client in their own words, used with their permission.',
      attribution: 'Client name',
    },
    {
      _type: 'accordionSection',
      _key: 'sessions-faq',
      heading: 'Questions',
      items: [
        ['What should I wear?', 'Placeholder: your guidance on wardrobe and styling.'],
        ['Where do sessions happen?', 'Placeholder: studio, outdoors, or a place you choose.'],
        ['How long until I see my photos?', 'Placeholder: how many days or weeks.'],
        ['Do you offer prints?', 'Placeholder: prints, albums and wall art.'],
        ['How do I book?', 'Placeholder: send a message and we find a date.'],
      ].map(([question, answer], i) => ({
        _type: 'accordionItem',
        _key: `faq-${i + 1}`,
        question,
        answer: [block(`faq-${i + 1}-a`, answer)],
      })),
    },
    {
      _type: 'ctaBandSection',
      _key: 'sessions-cta',
      eyebrow: 'Book',
      headline: "Let's make something quiet and beautiful.",
      subhead: 'Placeholder: a line on how booking works.',
      cta: pageCta('Get in touch', 'contactPage'),
    },
  ],
};

const aboutBuilder = [
  {
    _type: 'heroSection',
    _key: 'about-hero',
    eyebrow: 'About',
    headline: 'Placeholder: a line about you, in your own words.',
    subhead: 'Fine-art portrait photographer, Cincinnati and West Chester, Ohio.',
    size: 'short',
  },
  {
    _type: 'imageTextSection',
    _key: 'about-start',
    eyebrow: 'How it started',
    heading: 'Placeholder: how you came to photography.',
    imageSide: 'right',
    body: [
      block(
        'about-start-1',
        'Placeholder: the story of how you started. A few short paragraphs in your own voice work best.',
      ),
      block('about-start-2', 'Placeholder: a portrait of you goes beside this text.'),
    ],
  },
  {
    _type: 'richTextSection',
    _key: 'about-approach',
    eyebrow: 'Approach',
    heading: 'Placeholder: what you look for in a portrait.',
    body: [
      block(
        'about-approach-1',
        'Placeholder: how you work with the people in front of the camera, and the dreamy, painterly look you are known for.',
      ),
    ],
  },
  {
    _type: 'ctaBandSection',
    _key: 'about-cta',
    eyebrow: 'Sessions',
    headline: 'See how a session works.',
    subhead: 'Placeholder: a line inviting someone to book.',
    cta: pageCta('Sessions', 'page-sessions'),
  },
];

let changes = 0;
await apply('createOrReplace page-sessions (/sessions/)', async () => {
  await client.createOrReplace(sessions);
});
changes++;
await apply('replace aboutPage.pageBuilder (4 sections)', async () => {
  await client.patch('aboutPage').set({ pageBuilder: aboutBuilder }).commit();
});
changes++;
if (!APPLY)
  console.log(
    JSON.stringify({
      sessions: sessions.pageBuilder.map((b) => b._type),
      about: aboutBuilder.map((b) => b._type),
    }),
  );
done(changes);
