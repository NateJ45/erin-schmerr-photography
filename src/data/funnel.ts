// Safe to edit by hand
// The booking funnel's own words (2026-11-20, phase 2): the consultation page's promises, its
// four steps, the cards of chapter I and the questions beside the form. DRAFTS in Erin's voice
// for her to approve or rewrite (docs/PENDING.md, "The consultation page"). Nothing is copied
// from another photographer, and nothing here names a price.
//
// `confirmed: false` marks a fact only she can confirm; the page prints it with a small
// "Placeholder" tag until it is flipped to true. Her own steps, typed in the Studio (Contact
// page, "Post-inquiry roadmap"), replace STEPS automatically.

import type { BookingKind } from '@/lib/booking-message';

export interface FunnelPromise {
  text: string;
  confirmed: boolean;
}

/** The three lines beside the headline and the form. */
export const PROMISES: FunnelPromise[] = [
  { text: 'Complimentary', confirmed: true },
  { text: 'No obligation', confirmed: true },
  { text: 'I reply within one business day', confirmed: false },
];

/** "How it unfolds": the consult-first path, used until she writes her own. */
export const STEPS = [
  {
    title: 'We talk',
    body: 'A relaxed conversation, free and with no obligation. You tell me who the portrait is for and what you picture, and I listen.',
  },
  {
    title: 'We plan',
    body: 'The clothes, the place, the light and the story behind it. You get the sitting guide, and we choose everything together.',
  },
  {
    title: 'The sitting',
    body: 'Unhurried and guided the whole way, in the studio or out on location, so all you have to do is be yourself.',
  },
  {
    title: 'Your portraits',
    body: 'We choose the portraits you love and decide how they will live with you: on a wall, in an album, or both.',
  },
];

/** Chapter I: one line under each kind. */
export const KIND_LINES: Record<BookingKind, string> = {
  family: 'Children, parents, grandparents, the whole table.',
  portrait: 'A portrait of you, for a milestone or for no reason at all.',
  creative: 'Tests, comp cards, agency submissions and editorial work.',
  other: 'Tell me the idea and we will find its shape together.',
};

export interface Question {
  q: string;
  a: string;
  placeholder?: boolean;
  /** A link at the end of the answer. */
  link?: { label: string; href: string };
}

/** Beside the form (under it on a phone). */
export const QUESTIONS: Question[] = [
  {
    q: 'Is the consultation really free?',
    a: 'Yes. It is a conversation, not a sales call, and you are under no obligation to book anything afterwards.',
  },
  {
    q: 'How long is it, and where?',
    a: 'Placeholder: how long a consultation usually runs, and whether it is a call, a video call or a coffee.',
    placeholder: true,
  },
  {
    q: 'Where do sittings happen?',
    a: 'Around Cincinnati and West Chester, Ohio. We choose the place together, from a field at dusk to your own living room.',
  },
  {
    q: 'What if I do not know what I want yet?',
    a: 'That is what the consultation is for. Bring a feeling, a photograph you love, or nothing at all, and we will find it together.',
  },
  {
    q: 'What should we wear?',
    a: 'The sitting guide covers it: what to wear, how to prepare and what to expect on the day.',
    link: { label: 'Get the sitting guide', href: '/guide/' },
  },
];
