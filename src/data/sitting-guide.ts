// Safe to edit by hand
// "The sitting guide" (2026-11-20, phase 2 booking funnel): what to wear, how to prepare and
// what to expect, the lead magnet offered on /guide/ and read in full on /guide/read/.
//
// DRAFT COPY IN ERIN'S VOICE, written for her to approve or rewrite. Nothing here is copied
// from another photographer. Every line that states a fact only she can confirm (what is
// included, how long a sitting runs, when the portraits are seen) is a `placeholder: true`
// note, which the pages print visibly as "Placeholder:" until she supplies it (docs/PENDING.md,
// "The sitting guide"). No prices or figures, ever (they live in Sanity only).
//
// It is code rather than a Studio document on purpose for now: one long piece, edited rarely,
// and the pages, the email and the invitation all read the same file. If she wants to edit it
// herself, it moves to a singleton later.

export interface GuideNote {
  heading: string;
  body: string;
  /** A fact only Erin can confirm: printed as a labelled placeholder. */
  placeholder?: boolean;
}

export interface GuideChapter {
  id: string;
  numeral: string;
  title: string;
  /** The word of the title set in the display italic. */
  turn: string;
  /** One sentence under the title, also the preview's teaser. */
  lede: string;
  notes: GuideNote[];
}

export const GUIDE = {
  title: 'The sitting guide',
  /** The page and the email's one line. */
  dek: 'What to wear, how to prepare and what to expect, from your first message to the portrait on your wall.',
  /** The pull line on the preview, in her voice. */
  pull: 'You do not need to know how to pose. You only need to come as yourself, a little dressed up.',
  readPath: '/guide/read/',
  chapters: [
    {
      id: 'wear',
      numeral: 'I',
      title: 'What to wear',
      turn: 'wear',
      lede: 'Start from a feeling, not an outfit, and let the clothes follow.',
      notes: [
        {
          heading: 'Begin with the story',
          body: 'Tell me the decade, the film or the book you keep coming back to, and we will build the clothes from there. A 1950s kitchen asks for something very different from a fairy-tale wood.',
        },
        {
          heading: 'Texture over logos',
          body: 'Wool, lace, linen, velvet and soft old cotton all photograph beautifully. Big logos, neon and busy little prints pull the eye away from your face.',
        },
        {
          heading: 'For a family, a palette',
          body: 'Choose two or three quiet colours and let each person wear their own version of them. Nobody needs to match, and the portrait looks calmer when nobody does.',
        },
        {
          heading: 'Fit before new',
          body: 'Something that fits well and lets you move will always look better than something bought for the day and worn once.',
        },
        {
          heading: 'Bring choices',
          body: 'Bring two or three options, on hangers if you can, and we will choose together when you arrive.',
        },
        {
          heading: 'Borrowing pieces',
          body: 'Placeholder: whether I keep pieces you can borrow for a sitting, and what they are.',
          placeholder: true,
        },
      ],
    },
    {
      id: 'prepare',
      numeral: 'II',
      title: 'How to prepare',
      turn: 'prepare',
      lede: 'A little looking, a good night’s sleep, and nothing new on your skin.',
      notes: [
        {
          heading: 'Collect what moves you',
          body: 'Save a handful of pictures that make you feel something: paintings, film stills, a photograph of your grandmother. They tell me more than any description could.',
        },
        {
          heading: 'Hair and makeup',
          body: 'Placeholder: whether hair and makeup is part of the sitting, and who does it.',
          placeholder: true,
        },
        {
          heading: 'For little ones',
          body: 'Plan around naps, feed everyone well beforehand, and bring one small comfort from home. A child who has eaten and slept is the easiest person in the world to photograph.',
        },
        {
          heading: 'If you dislike the camera',
          body: 'Most people tell me they hate having their picture taken. You do not need to know how to pose: I guide you the whole way, one small change at a time.',
        },
        {
          heading: 'The night before',
          body: 'Sleep, drink water, and skip any new skincare. Pack your choices, and something warm to wear between frames if we are outdoors.',
        },
      ],
    },
    {
      id: 'expect',
      numeral: 'III',
      title: 'What to expect',
      turn: 'expect',
      lede: 'Unhurried, quiet, and a little like playing dress-up.',
      notes: [
        {
          heading: 'Arriving',
          body: 'We start slowly. We look at your clothes together, talk through the plan once more, and only then pick up the camera.',
        },
        {
          heading: 'How long it takes',
          body: 'Placeholder: how long a sitting usually runs.',
          placeholder: true,
        },
        {
          heading: 'Light and place',
          body: 'Whether we are in the studio or out on location, we choose the place and the hour for the light. It matters more than anything else in the frame.',
        },
        {
          heading: 'Being guided',
          body: 'I will tell you where to stand, where to look and what to do with your hands. All you have to do is listen, breathe, and let it be a little fun.',
        },
      ],
    },
    {
      id: 'after',
      numeral: 'IV',
      title: 'After the sitting',
      turn: 'After',
      lede: 'A portrait is made to be kept, so we plan where it will live.',
      notes: [
        {
          heading: 'Seeing your portraits',
          body: 'Placeholder: when and how you see your portraits for the first time, and how soon after the sitting.',
          placeholder: true,
        },
        {
          heading: 'Made to be kept',
          body: 'A portrait belongs on a wall or in your hands, not in a folder on a phone. We will talk about what suits your home: one large print, a small group, or an album to pass down.',
        },
        {
          heading: 'Looking after prints',
          body: 'Hang them out of direct sun and keep albums somewhere dry. Good paper and good framing will outlast all of us.',
        },
      ],
    },
  ] satisfies GuideChapter[],
};

/** "What to wear" with its turn word in the display italic: [before, turn, after]. */
export function splitTurn(title: string, turn: string): [string, string, string] {
  const at = title.indexOf(turn);
  if (at < 0) return [title, '', ''];
  return [title.slice(0, at), turn, title.slice(at + turn.length)];
}
