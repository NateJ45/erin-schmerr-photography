// scaffold-file: sessions
// Safe to edit by hand
// The Sessions page as it is meant to be composed, in fixed placeholder data,
// for /styleguide/sessions/ (and its Playwright spec). Every line of copy
// reads as a placeholder for the photographer's own words, and no money figure
// appears anywhere: "Investment from" is left empty on purpose, so the row
// stays hidden, exactly as it does on the live page until she types one in.
//
// The photos are the dataset's licence-free placeholder images (placeholder-*
// assets, already public in the snapshot), referenced by asset id only.

const PORTRAIT = [
  'image-8fa4ab892e846a60065791ddba4990907895da0b-1600x2000-jpg',
  'image-e9bdfe97969f55c0ed1e81b484f9700f5269af80-1600x2000-jpg',
  'image-860d8cd191636ebd4d5ad65780759113ac4ef557-1600x2000-jpg',
  'image-8dc842c4a21c97ca86f32ce5b7e611247f255fbf-1600x2000-jpg',
  'image-8f643a3837e7cd0d0b58ec4072cda0a8c0f9c47f-1600x2000-jpg',
  'image-fd12f3723cce83e65d2d12cfc909b9ed4b2f549d-1600x2000-jpg',
];
const LANDSCAPE = ['image-555dbd53d263d9d5effeec15b0003b579404cd38-2100x1400-jpg'];

const photo = (ref: string, alt: string) => ({
  _type: 'image',
  alt,
  asset: { _type: 'reference', _ref: ref },
});

const para = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-s`, marks: [], text }],
});

const rows = [
  ['styling', 'Styling', true, true],
  ['wardrobe', 'Wardrobe', true, true],
  ['hair', 'Hair and makeup', true, true],
  ['sitting', 'The sitting', true, true],
  ['reveal', 'The reveal', true, true],
  ['heirlooms', 'Heirlooms', true, false],
] as const;

export const SESSIONS_FIXTURE = [
  {
    _type: 'sessionsOpening',
    _key: 'fx-opening',
    eyebrow: 'Sessions',
    line: 'A portrait, made slowly and kept for generations.',
    turn: 'made slowly',
    intro:
      'Placeholder: a sentence or two on what a sitting with you feels like and who it is for.',
    photo: photo(PORTRAIT[0], 'Placeholder photo, a warm tonal gradient'),
  },
  {
    _type: 'sessionSittings',
    _key: 'fx-sittings',
    eyebrow: 'The house offers',
    heading: 'The sittings',
    intro: 'Placeholder: one line on how the two kinds of sitting differ.',
    sittings: [
      {
        _key: 's1',
        _type: 'sitting',
        name: 'Fine-art portrait',
        line: 'Placeholder: who this sitting is for and what you make together.',
        photo: photo(PORTRAIT[1], 'Placeholder photo, a warm tonal gradient'),
        investmentFrom: '',
      },
      {
        _key: 's2',
        _type: 'sitting',
        name: 'Editorial collaboration',
        line: 'Placeholder: a sitting made like a magazine story, with a team.',
        photo: photo(PORTRAIT[2], 'Placeholder photo, a warm tonal gradient'),
        investmentFrom: '',
      },
    ],
    rows: rows.map(([key, label, a, b]) => ({
      _key: key,
      _type: 'sittingRow',
      label,
      inFirst: a,
      inSecond: b,
    })),
    investmentLabel: 'Investment from',
  },
  {
    _type: 'sessionExperience',
    _key: 'fx-experience',
    eyebrow: 'From first letter to heirloom',
    heading: 'The experience',
    photo: photo(PORTRAIT[3], 'Placeholder photo, a warm tonal gradient'),
    steps: [
      ['consult', 'Consultation', 'Placeholder: how the first conversation goes.'],
      ['styling', 'Styling', 'Placeholder: wardrobe, hair and makeup, planned together.'],
      ['sitting', 'The sitting', 'Placeholder: how long it lasts and what the day is like.'],
      ['reveal', 'The reveal', 'Placeholder: how and where the portraits are first seen.'],
      ['delivery', 'Delivery', 'Placeholder: when the prints and albums arrive.'],
    ].map(([k, title, body]) => ({ _key: k, _type: 'experienceStep', title, body })),
  },
  {
    _type: 'heirloomsSpec',
    _key: 'fx-heirlooms',
    eyebrow: 'Made to be handed down',
    heading: 'Heirlooms',
    intro: 'Placeholder: a sentence on why the work is printed.',
    pieces: [
      {
        _key: 'print',
        _type: 'heirloomPiece',
        kind: 'Print',
        name: 'The fine-art print',
        body: 'Placeholder: what the print is and who makes it.',
        specs: [
          { _key: 'p', _type: 'heirloomSpec', label: 'Paper', value: 'Placeholder' },
          { _key: 's', _type: 'heirloomSpec', label: 'Size', value: 'Placeholder' },
          { _key: 'f', _type: 'heirloomSpec', label: 'Finish', value: 'Placeholder' },
        ],
        photos: [
          { _key: 'a', ...photo(PORTRAIT[4], 'Placeholder photo, a warm tonal gradient') },
          { _key: 'b', ...photo(LANDSCAPE[0], 'Placeholder photo, a warm tonal gradient') },
        ],
      },
      {
        _key: 'album',
        _type: 'heirloomPiece',
        kind: 'Album',
        name: 'The bound album',
        body: 'Placeholder: what the album is, and how it is bound.',
        specs: [
          { _key: 'p', _type: 'heirloomSpec', label: 'Paper', value: 'Placeholder' },
          { _key: 's', _type: 'heirloomSpec', label: 'Size', value: 'Placeholder' },
          { _key: 'f', _type: 'heirloomSpec', label: 'Finish', value: 'Placeholder' },
        ],
        photos: [{ _key: 'a', ...photo(PORTRAIT[5], 'Placeholder photo, a warm tonal gradient') }],
      },
    ],
  },
  {
    _type: 'investmentNote',
    _key: 'fx-note',
    heading: 'A note on investment',
    body: [
      para('n1', 'Placeholder: a warm paragraph on how you think about the investment.'),
      para('n2', 'Placeholder: a second paragraph on what it includes and how to ask.'),
    ],
    signature: 'Placeholder',
  },
  {
    _type: 'sessionQuestions',
    _key: 'fx-questions',
    heading: 'Questions',
    items: [
      ['wear', 'What should I wear?', 'Placeholder: your guidance on wardrobe and styling.'],
      [
        'where',
        'Where do sittings happen?',
        'Placeholder: studio, outdoors, or a place you choose.',
      ],
      ['long', 'How long until I see my portraits?', 'Placeholder: how many days or weeks.'],
      ['book', 'How do I book?', 'Placeholder: send a message and we find a date.'],
    ].map(([k, question, answer]) => ({
      _key: k,
      _type: 'sessionQuestion',
      question,
      answer: [para(`${k}-a`, answer)],
    })),
    cta: { _type: 'ctaBlock', label: 'Book a session', href: '/contact/' },
  },
];
