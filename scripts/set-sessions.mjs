// Safe to edit by hand
// =============================================================================
// set-sessions.mjs - the phase 2 Sessions page (2026-11-20)
// =============================================================================
// One-off content write for /sessions/ (the custom page `page-sessions`):
// replaces its `pageBuilder`, which still holds the starter's hero, steps rail,
// quote, fold-outs and closing band, with the Sessions blocks in this order
// (DESIGN.md "Sessions page"):
//
//   opening line across a photo (sessionsOpening) -> the experience, six steps
//   with the reveal as the signature moment (sessionExperience) -> three ways
//   in (sessionOffers: portrait and family; creative with Test / Editorial /
//   Fine-art commission tiers; digitals) -> a note on investment with its
//   ledger (investmentNote) -> heirlooms, sizes Mini to Statement and the
//   pieces (heirloomsSpec) -> the team (sessionTeam) -> worries, then
//   questions (sessionQuestions) -> the close, reserve a complimentary
//   consultation (sessionsClose)
//
// The words are original, written in her voice for her to approve or rewrite;
// the old fold-outs' questions and answers are carried over as they were. Any
// fact only she can confirm reads "Placeholder: ..." on the page. NO MONEY
// FIGURE is set here: every "from", the typical spend and the session fee are
// left empty, so those lines stay hidden until she types them in the Studio.
// The photos are her own, from her stories (asset references only). The team
// points at the seeded placeholder collaborators (hair, makeup, styling) until
// her real collaborators are entered.
//
// Before anything else it writes the current page document, verbatim, to a
// JSON file OUTSIDE the repo (default: ../_backups/ beside the repo folder, or
// --backup-dir <dir>), so the old page can be put back with
// scripts/restore-doc.mjs.
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify. Run it only
// after the PR that adds these blocks has deployed, or the Studio meets block
// types it does not know (rule 1).
//
//   node scripts/set-sessions.mjs                  # dry run: prints the plan
//   NCS_PRODUCTION_WRITE=yes node scripts/set-sessions.mjs --apply
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/set-sessions.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
// =============================================================================

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAGE_ID = 'page-sessions';

const image = (ref, alt) => ({ _type: 'image', alt, asset: { _type: 'reference', _ref: ref } });
const keyed = (key, value) => ({ _key: key, ...value });
const block = (k, text) => ({
  _type: 'block',
  _key: k,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${k}s`, marks: [], text }],
});
const toContact = (label) => ({
  _type: 'ctaBlock',
  label,
  linkType: 'internal',
  internalLink: { _type: 'reference', _ref: 'contactPage' },
});

// Her photos, from her stories (the alt text is the one already on each story).
const PHOTO = {
  opening: image(
    'image-e0c046975e7e174417e8ed258b05be5b6b339efe-1080x1350-jpg',
    'She leans on the trunk of an old tree in autumn leaves and looks at the camera',
  ),
  fallback: image(
    'image-c477f75f6b79cbcdb4c5eef56351607bd7be50bf-1080x1350-jpg',
    'She stands against a tree with autumn leaves',
  ),
  consult: image(
    'image-e77698f0dab3f260d7b16343f146c25c90d0efce-1080x1350-jpg',
    'Eyes closed, holding flowers among tall pines',
  ),
  wardrobe: image(
    'image-499b70beccb938248a0b355d6c0ba64bd1e8d30f-1080x1350-jpg',
    'Reclining on a pink velvet chaise with a pink guitar',
  ),
  hair: image(
    'image-efa8c956fd8c8f1891cd526bdb7d9dee337c6840-1080x1350-jpg',
    'The fairy in profile, her hand at her cheek',
  ),
  sitting: image(
    'image-316a844610310cb55bbaf77237a371bef8d4ac56-1080x1350-jpg',
    'Elvis on the sofa while a beauty queen and Pierrot sit behind him, in black and white',
  ),
  reveal: image(
    'image-f1eeb122ec31f454694ff4e7ff41fc1ec32fb630-1080x1350-jpg',
    'Pink-haired, lit by a red sign',
  ),
  delivered: image(
    'image-044a7b34a623bbb5221c0e3be5c00dc7eb87814f-1080x1350-jpg',
    'Sitting on a chair far down the pine path',
  ),
  family: image(
    'image-fa85188661d64790efd4db36c1d36a0f3afe29b1-1080x1350-jpg',
    'Elvis in an armchair, the beauty queen perched behind him',
  ),
  creative: image(
    'image-f86ca3b541a0c0404b7955e5a07d4efa6fc97084-1080x1350-jpg',
    'Under a giant lit boot and a REGAL sign',
  ),
  digitals: image(
    'image-895ee91a64149befeb1d613b8faf53ba34126dca-1080x1350-jpg',
    'He stands in the woods in a denim jacket and pale trousers',
  ),
  album: image(
    'image-793c551c1f315391249daec267f439b1f06aa6c3-1080x1350-jpg',
    'The whole porch glowing orange at night',
  ),
  wall: image(
    'image-a65e79d5f5d1832e50c011b057e82a025c2444be-1440x1440-jpg',
    'Kneeling in tall dry grass',
  ),
  close: image(
    'image-5fc1ee7a8e7aee0117c3a6230972d2bd4dfee3f3-1080x1350-jpg',
    'Arm raised, light falling across her dress',
  ),
};

// The old fold-outs (accordionSection "sessions-faq"), carried over word for word.
const OLD_FAQ = [
  [
    'faq-1',
    'What should I wear?',
    'Something that fits the story we’re telling. We’ll plan it together, and I have a few vintage pieces of my own.',
  ],
  [
    'faq-2',
    'Where do sessions happen?',
    'Outdoors, on a set, or somewhere that means something to you. A few favorites: the American Sign Museum, graffiti alley in Oakley, and the woods at golden hour.',
  ],
  ['faq-3', 'How long until I see my photos?', 'Placeholder: how many days or weeks.'],
  ['faq-4', 'Do you offer prints?', 'Placeholder: prints, albums and wall art.'],
  ['faq-5', 'How do I book?', 'Placeholder: send a message and we find a date.'],
];

export const SESSIONS_SECTIONS = [
  {
    _key: 'sx-opening',
    _type: 'sessionsOpening',
    eyebrow: 'Sessions',
    line: 'Every sitting begins with a story.',
    turn: 'a story',
    intro:
      'Portraits for families, faces and creative work in Cincinnati and West Chester, planned with you from the first call to the frame on your wall.',
    photo: PHOTO.opening,
  },
  {
    _key: 'sx-experience',
    _type: 'sessionExperience',
    eyebrow: 'How it goes',
    heading: 'The experience',
    intro:
      'Six steps from the first conversation to the portrait on your wall. You are looked after at every one of them.',
    photo: PHOTO.fallback,
    signatureLabel: 'The signature moment',
    steps: [
      keyed('step-consult', {
        _type: 'experienceStep',
        when: 'First',
        title: 'The consultation call',
        body: 'We talk about who the portrait is for, the story you would like it to tell and where it will hang. It costs nothing and you are not signing up to anything.',
        photo: PHOTO.consult,
      }),
      keyed('step-style', {
        _type: 'experienceStep',
        when: 'Before the day',
        title: 'Style guide and wardrobe',
        body: 'I send you a style guide and we plan the wardrobe together, down to the era, the colours and the props. I have a few vintage pieces of my own.',
        photo: PHOTO.wardrobe,
      }),
      keyed('step-hair', {
        _type: 'experienceStep',
        when: 'On the day',
        title: 'Hair and makeup',
        body: 'You start in the chair with my hair and makeup team, so you step in front of the camera already feeling like the character.',
        photo: PHOTO.hair,
      }),
      keyed('step-sitting', {
        _type: 'experienceStep',
        title: 'The sitting',
        body: 'Then we shoot, slowly. I direct every pose and every turn of the head, so you never have to wonder what to do with your hands.',
        photo: PHOTO.sitting,
      }),
      keyed('step-reveal', {
        _type: 'experienceStep',
        when: 'When they are ready',
        title: 'The reveal',
        body: 'You come back and see your portraits for the first time, large, on a big screen, with no rush and nobody else in the room. Then you choose the ones you cannot live without.',
        photo: PHOTO.reveal,
        signature: true,
      }),
      keyed('step-delivered', {
        _type: 'experienceStep',
        when: 'Last',
        title: 'Framed art, delivered',
        body: 'Your prints, albums and wall art are finished, framed and brought to you, ready to hang.',
        photo: PHOTO.delivered,
      }),
    ],
  },
  {
    _key: 'sx-offers',
    _type: 'sessionOffers',
    eyebrow: 'Sessions',
    heading: 'Three ways in',
    intro: 'Whoever you are bringing to the camera, there is a way to begin.',
    featuredLabel: 'Most chosen',
    askLabel: 'Ask about this session',
    offers: [
      keyed('offer-family', {
        _type: 'sessionOffer',
        kicker: 'For families, couples and the people you love',
        name: 'Portrait and family',
        line: 'An heirloom sitting for the people who matter most, planned around your home and finished as wall art and albums you will hand down.',
        photo: PHOTO.family,
        includes: [
          'The consultation call and a style guide',
          'Wardrobe planning together',
          'Hair and makeup',
          'The sitting, outdoors, on a set or somewhere that means something to you',
          'Your reveal, in person',
          'Wall art and albums, chosen at the reveal',
        ],
        fromLabel: 'Sessions from',
        from: '',
      }),
      keyed('offer-creative', {
        _type: 'sessionOffer',
        kicker: 'For models, artists and brands',
        name: 'Creative',
        line: 'Editorial and conceptual work that starts from a decade, a book or a film, for your book, your agency or your own project. Placeholder: Erin sets the looks, hours, images, turnaround and usage for each tier.',
        photo: PHOTO.creative,
        fromLabel: 'Sessions from',
        from: '',
        tiers: [
          keyed('tier-test', {
            _type: 'offerTier',
            name: 'Test',
            line: 'One focused look to try an idea and grow your book.',
            featured: false,
            from: '',
          }),
          keyed('tier-editorial', {
            _type: 'offerTier',
            name: 'Editorial',
            line: 'A whole story with styling and a team, made to be published.',
            featured: true,
            from: '',
          }),
          keyed('tier-commission', {
            _type: 'offerTier',
            name: 'Fine-art commission',
            line: 'A conceptual piece built from nothing: the story, the set and the cast.',
            featured: false,
            from: '',
          }),
        ],
        tierRows: [
          keyed('row-looks', {
            _type: 'tierRow',
            label: 'Looks',
            values: ['1', '2 to 3', 'As the story needs'],
          }),
          keyed('row-hours', {
            _type: 'tierRow',
            label: 'Time',
            values: ['1 hour', 'Half a day', 'A full day'],
          }),
          keyed('row-images', {
            _type: 'tierRow',
            label: 'Retouched images',
            values: ['5', '12', '20 or more'],
          }),
          keyed('row-turnaround', {
            _type: 'tierRow',
            label: 'Turnaround',
            values: ['2 weeks', '2 weeks', '3 to 4 weeks'],
          }),
          keyed('row-usage', {
            _type: 'tierRow',
            label: 'Usage',
            values: ['Portfolio', 'Portfolio and publication', 'Agreed in writing'],
          }),
        ],
      }),
      keyed('offer-digitals', {
        _type: 'sessionOffer',
        kicker: 'For new faces',
        name: 'Digitals',
        line: 'The clean, simple pictures an agency asks for: natural light, very little makeup, you as you look on an ordinary day. A gentle first time in front of a camera.',
        photo: PHOTO.digitals,
        includes: [
          'Natural light',
          'Front, profile and full length',
          'Fitted clothes you already own',
          'Lightly corrected, never reshaped',
        ],
        fromLabel: 'Digitals from',
        from: '',
      }),
    ],
  },
  {
    _key: 'sx-investment',
    _type: 'investmentNote',
    eyebrow: 'Investment',
    heading: 'A note on investment',
    body: [
      block(
        'inv-1',
        'I would rather you know how this works before we meet. The session fee holds your date and covers the planning and the sitting itself. Your art is chosen separately, at the reveal, once you have seen your portraits and know which ones you want on your walls.',
      ),
      block(
        'inv-2',
        'Nobody is ever asked to buy something they do not love, and we talk it all through on the consultation call.',
      ),
    ],
    signature: 'Erin',
    rangeLabel: 'Most clients invest between',
    range: '',
    feeLabel: 'The session fee',
    fee: '',
    feeNote: 'Covers the planning and the sitting. Your art is chosen separately, at the reveal.',
    financingNote: 'Placeholder: a line on payment plans, if Erin offers them.',
  },
  {
    _key: 'sx-heirlooms',
    _type: 'heirloomsSpec',
    eyebrow: 'What you keep',
    heading: 'Heirlooms',
    intro:
      'Your portraits are made to leave the phone. I would rather print one picture you love than send you a hundred you never open. Placeholder: the sizes, papers and finishes until Erin confirms her print menu.',
    sizesHeading: 'Wall art, by size',
    sizes: [
      keyed('size-mini', {
        _type: 'wallSize',
        name: 'Mini',
        dims: '8 x 10 in',
        feeling: 'A small secret on a desk or a bookshelf',
        width: 8,
        height: 10,
      }),
      keyed('size-petite', {
        _type: 'wallSize',
        name: 'Petite',
        dims: '11 x 14 in',
        feeling: 'Beside the bed, at eye level',
        width: 11,
        height: 14,
      }),
      keyed('size-classic', {
        _type: 'wallSize',
        name: 'Classic',
        dims: '16 x 20 in',
        feeling: 'Over a dresser or a reading chair',
        width: 16,
        height: 20,
      }),
      keyed('size-grand', {
        _type: 'wallSize',
        name: 'Grand',
        dims: '24 x 36 in',
        feeling: 'The first thing you see in the hallway',
        width: 24,
        height: 36,
      }),
      keyed('size-statement', {
        _type: 'wallSize',
        name: 'Statement',
        dims: '40 x 60 in',
        feeling: 'Over the sofa or the mantel, the heart of the room',
        width: 40,
        height: 60,
      }),
    ],
    pieces: [
      keyed('piece-wall', {
        _type: 'heirloomPiece',
        kind: 'Wall art',
        name: 'The framed portrait',
        body: 'Printed, framed and brought to your door ready to hang, in the size that suits the wall.',
        specs: [
          keyed('wall-paper', { _type: 'heirloomSpec', label: 'Paper', value: 'Placeholder' }),
          keyed('wall-frame', { _type: 'heirloomSpec', label: 'Frame', value: 'Placeholder' }),
          keyed('wall-finish', { _type: 'heirloomSpec', label: 'Finish', value: 'Placeholder' }),
        ],
        photos: [keyed('wall-photo', PHOTO.wall)],
      }),
      keyed('piece-album', {
        _type: 'heirloomPiece',
        kind: 'Album',
        name: 'The heirloom album',
        body: 'Your story in the order it was shot, bound to be handed down.',
        specs: [
          keyed('album-pages', { _type: 'heirloomSpec', label: 'Pages', value: 'Placeholder' }),
          keyed('album-size', { _type: 'heirloomSpec', label: 'Size', value: 'Placeholder' }),
          keyed('album-cover', { _type: 'heirloomSpec', label: 'Cover', value: 'Placeholder' }),
        ],
        photos: [keyed('album-photo', PHOTO.album)],
      }),
    ],
    wallsHeading: 'Framed on real walls',
    walls: [],
  },
  {
    _key: 'sx-team',
    _type: 'sessionTeam',
    eyebrow: 'Credits',
    heading: 'The team',
    intro:
      'I don’t work alone. These are the people who make the look happen before I pick up the camera.',
    members: [
      keyed('team-hair', {
        _type: 'teamMember',
        role: 'Hair',
        collaborator: { _type: 'reference', _ref: 'placeholder-collaborator-hair' },
        line: 'Placeholder: a line about them.',
      }),
      keyed('team-makeup', {
        _type: 'teamMember',
        role: 'Makeup',
        collaborator: { _type: 'reference', _ref: 'placeholder-collaborator-makeup' },
        line: 'Placeholder: a line about them.',
      }),
      keyed('team-styling', {
        _type: 'teamMember',
        role: 'Styling',
        collaborator: { _type: 'reference', _ref: 'placeholder-collaborator-stylist' },
        line: 'Placeholder: a line about them.',
      }),
    ],
  },
  {
    _key: 'sx-questions',
    _type: 'sessionQuestions',
    eyebrow: 'Before you book',
    worriesHeading: 'What people worry about',
    worries: [
      keyed('worry-photos', {
        _type: 'sessionWorry',
        worry: 'I hate photos of myself.',
        reply:
          'Almost everyone tells me that on the first call. I direct every pose and every turn of the head, so you never have to guess, and some of my favourite portraits are of people who swore they were not photogenic.',
      }),
      keyed('worry-toddler', {
        _type: 'sessionWorry',
        worry: 'My toddler won’t sit still.',
        reply:
          'They don’t have to. We plan short scenes around their day and let them move; some of the best frames happen in between the poses.',
      }),
      keyed('worry-wear', {
        _type: 'sessionWorry',
        worry: 'I have no idea what to wear.',
        reply:
          'That part is my job. You get a style guide, we plan the wardrobe together, and I have a few vintage pieces of my own.',
      }),
    ],
    heading: 'Questions',
    items: [
      keyed('faq-consult', {
        _type: 'sessionQuestion',
        question: 'Is the consultation really free?',
        answer: [
          block(
            'faq-consult-a',
            'Yes. It is a conversation, not a sales call, and there is nothing to sign.',
          ),
        ],
      }),
      ...OLD_FAQ.map(([k, question, answer]) =>
        keyed(k, { _type: 'sessionQuestion', question, answer: [block(`${k}-a`, answer)] }),
      ),
    ],
    cta: toContact('Book a session'),
  },
  {
    _key: 'sx-close',
    _type: 'sessionsClose',
    eyebrow: 'When you are ready',
    word: 'Begin',
    photo: PHOTO.close,
    heading: 'Reserve a complimentary consultation',
    body: 'Tell me who the portrait is for and the story you have in mind. We will plan the rest together on a call.',
    cta: toContact('Reserve a consultation'),
    replyNote: 'Placeholder: how soon Erin replies.',
  },
];

/** Pure: the plan as printable lines for a page document. */
export function planSessions(doc) {
  const blocks = doc?.pageBuilder ?? [];
  const show = (b) => `${b._type}:${b._key}`;
  return {
    lines: [
      `  now:   ${blocks.map(show).join(', ') || 'empty'}`,
      `  after: ${SESSIONS_SECTIONS.map(show).join(', ')}`,
    ],
    same: JSON.stringify(blocks) === JSON.stringify(SESSIONS_SECTIONS),
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await main();

async function main() {
  const { client, dataset, apply, done, ROOT } = await import('./lib/sanity-lib.mjs');
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i > -1 ? process.argv[i + 1] : undefined;
  };
  // The repo's own folder, even when this runs from a worktree inside it: a
  // backup in there would be inside the repo.
  const repoTop = ROOT.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0];
  const backupDir = resolve(arg('--backup-dir') ?? resolve(repoTop, '..', '_backups'));
  const inside = (dir, top) =>
    dir === top || dir.startsWith(top + '\\') || dir.startsWith(top + '/');
  if (inside(backupDir, repoTop) || inside(backupDir, ROOT)) {
    console.error(`The backup must live outside the repo, not in ${backupDir}.`);
    process.exit(1);
  }

  const current = await client.fetch('*[_id == $id][0]', { id: PAGE_ID });
  if (!current) throw new Error(`No ${PAGE_ID} document in ${dataset}.`);
  if (current.slug?.current !== 'sessions') {
    throw new Error(`${PAGE_ID} has the address "${current.slug?.current}", not "sessions".`);
  }
  const { lines, same } = planSessions(current);
  console.log(`${PAGE_ID} in ${dataset}, revision ${current._rev}`);
  console.log(lines.join('\n'));
  if (same) {
    console.log('Already in place; nothing to write.');
    done(0);
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = resolve(backupDir, `${PAGE_ID}-${dataset}-${stamp}.json`);
  // The backup comes first; the page is written only if it succeeded.
  await apply(`backup: write the current ${PAGE_ID} to ${file}`, async () => {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
  });
  // ifRevisionId: refuse if someone edited the page since the read above.
  await apply(
    `${PAGE_ID}: set pageBuilder to the phase 2 Sessions page (${SESSIONS_SECTIONS.length} sections)`,
    () =>
      client
        .patch(PAGE_ID)
        .ifRevisionId(current._rev)
        .set({ pageBuilder: SESSIONS_SECTIONS })
        .commit(),
  );
  done(2);
}
