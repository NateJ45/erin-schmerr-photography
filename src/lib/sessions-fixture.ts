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

const ph = 'Placeholder photo, a warm tonal gradient';

// The phase 2 page (2026-11-20), in the order scripts/set-sessions.mjs writes.
export const SESSIONS_FIXTURE = [
  {
    _type: 'sessionsOpening',
    _key: 'fx-opening',
    eyebrow: 'Sessions',
    line: 'Every sitting begins with a story.',
    turn: 'a story',
    intro:
      'Placeholder: a sentence or two on what a sitting with you feels like and who it is for.',
    photo: photo(PORTRAIT[0], ph),
  },
  {
    _type: 'sessionExperience',
    _key: 'fx-experience',
    eyebrow: 'How it goes',
    heading: 'The experience',
    intro: 'Placeholder: one line on how long it takes from the first call to the wall.',
    photo: photo(PORTRAIT[3], ph),
    signatureLabel: 'The signature moment',
    steps: [
      ['consult', 'First', 'The consultation call', 'Placeholder: how the first call goes.'],
      ['style', 'Before the day', 'Style guide and wardrobe', 'Placeholder: planning the look.'],
      ['hair', 'On the day', 'Hair and makeup', 'Placeholder: the chair before the camera.'],
      ['sitting', '', 'The sitting', 'Placeholder: what the day is like.'],
      ['reveal', 'When they are ready', 'The reveal', 'Placeholder: the big screen.'],
      ['delivery', 'Last', 'Framed art, delivered', 'Placeholder: when the art arrives.'],
    ].map(([k, when, title, body], i) => ({
      _key: k,
      _type: 'experienceStep',
      when,
      title,
      body,
      photo: photo(PORTRAIT[i % PORTRAIT.length], ph),
      signature: k === 'reveal',
    })),
  },
  {
    _type: 'sessionOffers',
    _key: 'fx-offers',
    eyebrow: 'Sessions',
    heading: 'Three ways in',
    intro: 'Placeholder: one line on choosing where to begin.',
    featuredLabel: 'Most chosen',
    askLabel: 'Ask about this session',
    offers: [
      {
        _key: 'family',
        _type: 'sessionOffer',
        kicker: 'For families and couples',
        name: 'Portrait and family',
        line: 'Placeholder: an heirloom sitting, finished as wall art and albums.',
        photo: photo(PORTRAIT[1], ph),
        includes: ['The consultation call', 'Hair and makeup', 'Your reveal, in person'],
        fromLabel: 'Sessions from',
        from: '',
      },
      {
        _key: 'creative',
        _type: 'sessionOffer',
        kicker: 'For models, artists and brands',
        name: 'Creative',
        line: 'Placeholder: editorial and conceptual work, in three tiers.',
        photo: photo(PORTRAIT[2], ph),
        from: '',
        tiers: [
          ['test', 'Test', 'Placeholder: one focused look.', false],
          ['editorial', 'Editorial', 'Placeholder: a whole story, made to be published.', true],
          ['commission', 'Fine-art commission', 'Placeholder: a piece built from nothing.', false],
        ].map(([k, name, line, featured]) => ({
          _key: k as string,
          _type: 'offerTier',
          name,
          line,
          featured,
          from: '',
        })),
        tierRows: [
          ['looks', 'Looks', ['1', '2 to 3', 'As needed']],
          ['time', 'Time', ['1 hour', 'Half a day', 'A full day']],
          ['images', 'Retouched images', ['5', '12', '20 or more']],
          ['turn', 'Turnaround', ['2 weeks', '2 weeks', '3 to 4 weeks']],
          ['usage', 'Usage', ['Portfolio', 'Publication', 'In writing']],
        ].map(([k, label, values]) => ({ _key: k as string, _type: 'tierRow', label, values })),
      },
      {
        _key: 'digitals',
        _type: 'sessionOffer',
        kicker: 'For new faces',
        name: 'Digitals',
        line: 'Placeholder: the simple pictures an agency asks for.',
        photo: photo(PORTRAIT[4], ph),
        includes: ['Natural light', 'Front, profile and full length'],
        from: '',
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
    range: '',
    fee: '',
    feeNote: 'Placeholder: what the session fee covers.',
    financingNote: 'Placeholder: a line on payment plans.',
  },
  {
    _type: 'heirloomsSpec',
    _key: 'fx-heirlooms',
    eyebrow: 'Made to be handed down',
    heading: 'Heirlooms',
    intro: 'Placeholder: a sentence on why the work is printed.',
    sizes: [
      ['mini', 'Mini', 8, 10],
      ['classic', 'Classic', 16, 20],
      ['grand', 'Grand', 24, 36],
      ['statement', 'Statement', 40, 60],
    ].map(([k, name, width, height]) => ({
      _key: k as string,
      _type: 'wallSize',
      name,
      dims: `${width} x ${height} in`,
      feeling: 'Placeholder: how it feels on a wall.',
      width,
      height,
    })),
    pieces: [
      {
        _key: 'print',
        _type: 'heirloomPiece',
        kind: 'Wall art',
        name: 'The framed portrait',
        body: 'Placeholder: what the piece is and who makes it.',
        specs: [
          { _key: 'p', _type: 'heirloomSpec', label: 'Paper', value: 'Placeholder' },
          { _key: 's', _type: 'heirloomSpec', label: 'Frame', value: 'Placeholder' },
          { _key: 'f', _type: 'heirloomSpec', label: 'Finish', value: 'Placeholder' },
        ],
        photos: [{ _key: 'a', ...photo(PORTRAIT[5], ph) }],
      },
      {
        _key: 'album',
        _type: 'heirloomPiece',
        kind: 'Album',
        name: 'The heirloom album',
        body: 'Placeholder: what the album is, and how it is bound.',
        specs: [
          { _key: 'p', _type: 'heirloomSpec', label: 'Pages', value: 'Placeholder' },
          { _key: 's', _type: 'heirloomSpec', label: 'Size', value: 'Placeholder' },
        ],
        photos: [{ _key: 'a', ...photo(PORTRAIT[1], ph) }],
      },
    ],
    walls: [
      { _key: 'w1', ...photo(LANDSCAPE[0], ph), caption: 'Placeholder: a client’s wall' },
      { _key: 'w2', ...photo(PORTRAIT[2], ph), caption: 'Placeholder: a client’s wall' },
    ],
  },
  {
    _type: 'sessionTeam',
    _key: 'fx-team',
    eyebrow: 'Credits',
    heading: 'The team',
    intro: 'Placeholder: a line on the people beside you.',
    members: [
      ['hair', 'Hair', 'Hair stylist name'],
      ['makeup', 'Makeup', 'Makeup artist name'],
      ['styling', 'Styling', 'Stylist name'],
    ].map(([k, role, name]) => ({
      _key: k,
      _type: 'teamMember',
      role,
      person: { name },
      line: 'Placeholder: a line about them.',
    })),
  },
  {
    _type: 'sessionQuestions',
    _key: 'fx-questions',
    eyebrow: 'Before you book',
    worriesHeading: 'What people worry about',
    worries: [
      ['photos', 'I hate photos of myself.'],
      ['toddler', 'My toddler won’t sit still.'],
      ['wear', 'I have no idea what to wear.'],
    ].map(([k, worry]) => ({
      _key: k,
      _type: 'sessionWorry',
      worry,
      reply: 'Placeholder: your answer, in a sentence or two.',
    })),
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
  {
    _type: 'sessionsClose',
    _key: 'fx-close',
    eyebrow: 'When you are ready',
    word: 'Begin',
    photo: photo(PORTRAIT[3], ph),
    heading: 'Reserve a complimentary consultation',
    body: 'Placeholder: a sentence inviting them to tell you who the portrait is for.',
    cta: { _type: 'ctaBlock', label: 'Reserve a consultation', href: '/contact/' },
    replyNote: 'Placeholder: how soon you reply.',
  },
];
