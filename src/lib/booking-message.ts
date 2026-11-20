// Safe to edit by hand
// The consultation request's answers folded into the contact route's one message
// (2026-11-20, phase 2: consult-first, branching by who the portrait is for).
// Used by the browser (src/scripts/booking-form.ts), by the no-JS route
// (src/pages/api/booking.ts) and by the form itself (src/components/booking/BookingForm.astro
// reads the kinds and the choices from here), so all three agree on the questions.
//
// The contact backend only knows name, email, subject and message; the answers travel as
// "Label: answer" lines, so nothing downstream had to change. Only the questions that belong
// to the chosen kind are written: a visitor who looked at the family questions, then chose
// "Model or creative", never sends half-filled family lines. Nothing here reaches Sanity.
//
// No imports on purpose: node runs this file directly in the unit tests.

/** Chapter I: who the portrait is for. The value is what the form posts. */
export const BOOKING_KINDS = {
  family: 'Family and children',
  portrait: 'Portrait (just me)',
  creative: 'Model or creative',
  other: 'Something else',
} as const;
export type BookingKind = keyof typeof BOOKING_KINDS;
export const KIND_ORDER: BookingKind[] = ['family', 'portrait', 'creative', 'other'];

export const isKind = (v: unknown): v is BookingKind =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(BOOKING_KINDS, v);

/** The fixed choices offered as chips. Free text everywhere else. */
export const BOOKING_CHOICES = {
  included: ['Parents', 'Children', 'Grandparents', 'Brothers and sisters', 'A pet'],
  setting: ['In the studio', 'On location', 'Not sure yet'],
  wall: ['One large piece', 'A small group', 'An album', 'Not sure yet'],
  agency: ['New face', 'Signed with an agency', 'Freelance'],
  goal: ['Agency submission', 'Comp card', 'Brand or campaign', 'Something else'],
} as const;

interface Question {
  name: string;
  label: string;
  /** The kinds this question is asked for. */
  kinds: readonly BookingKind[];
  max: number;
}

/** Every question after chapter I, in the order they appear on the page and in the email. */
export const BOOKING_QUESTIONS: readonly Question[] = [
  { name: 'childrenAges', label: 'Children’s ages', kinds: ['family'], max: 120 },
  { name: 'included', label: 'Who is included', kinds: ['family'], max: 200 },
  { name: 'setting', label: 'Studio or location', kinds: ['family'], max: 60 },
  { name: 'hang', label: 'Where the portraits will hang', kinds: ['family'], max: 200 },
  { name: 'occasion', label: 'The occasion', kinds: ['portrait'], max: 200 },
  { name: 'wall', label: 'On the wall', kinds: ['portrait'], max: 60 },
  { name: 'wallNote', label: 'What they picture', kinds: ['portrait'], max: 300 },
  { name: 'agency', label: 'Agency status', kinds: ['creative'], max: 60 },
  { name: 'goal', label: 'The goal', kinds: ['creative'], max: 200 },
  { name: 'moodboard', label: 'Mood board', kinds: ['creative'], max: 300 },
  {
    name: 'timing',
    label: 'Rough timing or dates',
    kinds: ['family', 'portrait', 'creative', 'other'],
    max: 200,
  },
  {
    name: 'phone',
    label: 'Phone',
    kinds: ['family', 'portrait', 'creative', 'other'],
    max: 40,
  },
];

/** The names a draft keeps and the scripts read, chapter I and the story included. */
export const BOOKING_FIELD_NAMES = [
  'kind',
  ...BOOKING_QUESTIONS.map((q) => q.name),
  'story',
  'name',
  'email',
];

/** An answer is text, or (for "tick any that apply") a list of texts. */
export type BookingAnswers = Record<string, string | string[] | undefined>;

const clean = (v: unknown, max: number): string => {
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean)
      .join(', ')
      .slice(0, max);
  }
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
};

export function composeBooking(a: BookingAnswers): { subject: string; message: string } {
  const kind = isKind(a.kind) ? a.kind : null;
  const name = clean(a.name, 120);
  const lines: string[] = [];
  if (kind) {
    lines.push(`For: ${BOOKING_KINDS[kind]}`);
    for (const q of BOOKING_QUESTIONS) {
      if (!q.kinds.includes(kind)) continue;
      const v = clean(a[q.name], q.max);
      if (v) lines.push(`${q.label}: ${v}`);
    }
  }
  const story = clean(a.story, 4000);
  // With neither a kind nor a story the message is empty, so the route's own check
  // ("Please write a message.") answers, rather than an email of nothing.
  const message = [lines.join('\n'), story].filter(Boolean).join('\n\n');
  const subject = `Consultation request${kind ? `: ${BOOKING_KINDS[kind]}` : ''}${name ? ` (${name})` : ''}`;
  return { subject: subject.slice(0, 200), message };
}
