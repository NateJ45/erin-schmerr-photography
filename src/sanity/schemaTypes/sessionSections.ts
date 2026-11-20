// scaffold-file: sessions
// Safe to edit by hand
// The Sessions page's own blocks (picked 2026-11-20, "a couture house, not a
// pricing table"): an opening line, the sittings side by side, the experience
// with a pinned photo, heirlooms as a spec sheet, a note on investment and the
// questions. Each draws one band on the plain page ground (SELF_CONTAINED in
// sectionCadence.ts) and carries no colour field (rule 9). Components:
// src/components/sessions/, styles: src/styles/page-sessions.css.
//
// Money is never typed in code: the only figure on the page is the
// "Investment from" field each sitting carries, typed by the photographer in the
// Studio, and the row hides while every sitting leaves it empty.

import { defineArrayMember, defineField, defineType } from 'sanity';
import { TextIcon } from '@sanity/icons/Text';
import { ThLargeIcon } from '@sanity/icons/ThLarge';
import { OlistIcon } from '@sanity/icons/Olist';
import { ImagesIcon } from '@sanity/icons/Images';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { HelpCircleIcon } from '@sanity/icons/HelpCircle';

const eyebrowField = () =>
  defineField({
    name: 'eyebrow',
    title: 'Small line above the heading (optional)',
    type: 'string',
    validation: (Rule) => Rule.max(60),
  });

const headingField = (initial: string) =>
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'string',
    initialValue: initial,
    validation: (Rule) => Rule.required().max(90),
  });

const introField = () =>
  defineField({
    name: 'intro',
    title: 'A sentence under the heading (optional)',
    type: 'text',
    rows: 2,
    validation: (Rule) => Rule.max(320),
  });

/** A photo with its own description, the same shape the other portfolio blocks use. */
const photoField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'image',
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Describe the photo',
        type: 'string',
        description: 'For people who cannot see it: who is in it and what is happening.',
        validation: (Rule) => Rule.max(200),
      }),
    ],
  });

/** Plain paragraphs with bold and italic, nothing else. */
const simpleBlocks = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [{ title: 'Normal', value: 'normal' }],
        lists: [],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [],
        },
      }),
    ],
  });

// ── 1. The opening line ─────────────────────────────────────────────────────
export const sessionsOpening = defineType({
  name: 'sessionsOpening',
  title: 'Opening line',
  type: 'object',
  icon: TextIcon,
  description: 'One very large line to open the page, with a few words turned to italic.',
  fields: [
    eyebrowField(),
    defineField({
      name: 'line',
      title: 'The line',
      type: 'string',
      description: 'The page title, set very large. One sentence reads best.',
      validation: (Rule) => Rule.required().max(140),
    }),
    defineField({
      name: 'turn',
      title: 'Words set in italic (optional)',
      type: 'string',
      description:
        'Copy a few words from the line exactly as they are written there; they turn to italic.',
      validation: (Rule) =>
        Rule.max(80).custom((turn, context) => {
          const line = (context.parent as { line?: string } | undefined)?.line;
          if (!turn || !line) return true;
          return line.includes(turn)
            ? true
            : {
                message: 'These words are not in the line, so nothing turns italic.',
                level: 'warning',
              };
        }),
    }),
    introField(),
    photoField('photo', 'A small photo beside the line (optional)'),
  ],
  preview: {
    select: { title: 'line', media: 'photo' },
    prepare: ({ title, media }) => ({
      title: title || 'Opening line',
      subtitle: 'Opening line',
      media,
    }),
  },
});

// ── 2. The sittings ─────────────────────────────────────────────────────────
// The rows are typed once for the whole block, so every sitting shows the same
// ruled list; each row says which sittings include it, and a sitting that does
// not is shown greyed in that row, never left out (so the two can be compared
// line by line).
export const sessionSittings = defineType({
  name: 'sessionSittings',
  title: 'The sittings',
  type: 'object',
  icon: ThLargeIcon,
  description:
    'Your kinds of session side by side, each with a photo and the same list of what it includes.',
  fields: [
    eyebrowField(),
    headingField('The sittings'),
    introField(),
    defineField({
      name: 'sittings',
      title: 'Sittings',
      type: 'array',
      description: 'Two or three read best. They count from the left: the first is sitting 1.',
      validation: (Rule) => Rule.required().min(1).max(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sitting',
          title: 'Sitting',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required().max(50),
            }),
            defineField({
              name: 'line',
              title: 'A sentence about it',
              type: 'text',
              rows: 2,
              validation: (Rule) => Rule.max(240),
            }),
            photoField('photo', 'A sample photo'),
            defineField({
              name: 'investmentFrom',
              title: 'Investment from (optional)',
              type: 'string',
              description:
                'Typed exactly as it should read. Leave it empty on every sitting and the row is not shown.',
              validation: (Rule) => Rule.max(40),
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'line', media: 'photo' } },
        }),
      ],
    }),
    defineField({
      name: 'rows',
      title: 'What a sitting includes',
      type: 'array',
      description:
        'One line each. Untick a sitting that does not include it: the line is greyed in that sitting.',
      validation: (Rule) => Rule.max(10),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sittingRow',
          title: 'Line',
          fields: [
            defineField({
              name: 'label',
              title: 'What it is',
              type: 'string',
              validation: (Rule) => Rule.required().max(40),
            }),
            defineField({
              name: 'inFirst',
              title: 'In sitting 1',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'inSecond',
              title: 'In sitting 2',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'inThird',
              title: 'In sitting 3',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    defineField({
      name: 'investmentLabel',
      title: 'Name of the investment line',
      type: 'string',
      initialValue: 'Investment from',
      validation: (Rule) => Rule.max(40),
    }),
  ],
  preview: {
    select: { heading: 'heading', sittings: 'sittings' },
    prepare: ({ heading, sittings }) => ({
      title: heading || 'The sittings',
      subtitle: `Sittings${Array.isArray(sittings) ? ` (${sittings.length})` : ''}`,
    }),
  },
});

// ── 3. The experience ───────────────────────────────────────────────────────
export const sessionExperience = defineType({
  name: 'sessionExperience',
  title: 'The experience, step by step',
  type: 'object',
  icon: OlistIcon,
  description: 'A tall photo that stays in view while the numbered steps pass beside it.',
  fields: [
    eyebrowField(),
    headingField('The experience'),
    photoField('photo', 'A tall photo', 'A portrait-shaped photo works best.'),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (Rule) => Rule.required().min(2).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'experienceStep',
          title: 'Step',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required().max(60),
            }),
            defineField({
              name: 'body',
              title: 'A sentence or two',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.max(360),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'body' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading', steps: 'steps', media: 'photo' },
    prepare: ({ heading, steps, media }) => ({
      title: heading || 'The experience',
      subtitle: `Steps${Array.isArray(steps) ? ` (${steps.length})` : ''}`,
      media,
    }),
  },
});

// ── 4. Heirlooms ────────────────────────────────────────────────────────────
export const heirloomsSpec = defineType({
  name: 'heirloomsSpec',
  title: 'Heirlooms',
  type: 'object',
  icon: ImagesIcon,
  description: 'Prints, albums and wall pieces, each as photos beside a short spec sheet.',
  fields: [
    eyebrowField(),
    headingField('Heirlooms'),
    introField(),
    defineField({
      name: 'pieces',
      title: 'Pieces',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heirloomPiece',
          title: 'Piece',
          fields: [
            defineField({
              name: 'kind',
              title: 'Kind (small line above the name)',
              type: 'string',
              description: 'For example Print, Album or Wall piece.',
              validation: (Rule) => Rule.max(40),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required().max(60),
            }),
            defineField({
              name: 'body',
              title: 'A sentence or two (optional)',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.max(320),
            }),
            defineField({
              name: 'specs',
              title: 'Spec sheet',
              type: 'array',
              description: 'Each line shows its name in brackets, like a gallery label.',
              initialValue: [
                { _type: 'heirloomSpec', label: 'Paper' },
                { _type: 'heirloomSpec', label: 'Size' },
                { _type: 'heirloomSpec', label: 'Finish' },
              ],
              validation: (Rule) => Rule.max(6),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'heirloomSpec',
                  title: 'Line',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Name',
                      type: 'string',
                      validation: (Rule) => Rule.required().max(30),
                    }),
                    defineField({
                      name: 'value',
                      title: 'Value',
                      type: 'string',
                      validation: (Rule) => Rule.max(80),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'value' } },
                }),
              ],
            }),
            defineField({
              name: 'photos',
              title: 'Photos',
              type: 'array',
              validation: (Rule) => Rule.max(4),
              of: [
                defineArrayMember({
                  type: 'image',
                  options: { hotspot: true },
                  fields: [
                    defineField({
                      name: 'alt',
                      title: 'Describe the photo',
                      type: 'string',
                      validation: (Rule) => Rule.max(200),
                    }),
                  ],
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'kind', media: 'photos.0' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading', pieces: 'pieces' },
    prepare: ({ heading, pieces }) => ({
      title: heading || 'Heirlooms',
      subtitle: `Pieces${Array.isArray(pieces) ? ` (${pieces.length})` : ''}`,
    }),
  },
});

// ── 5. A note on investment ─────────────────────────────────────────────────
export const investmentNote = defineType({
  name: 'investmentNote',
  title: 'A note on investment',
  type: 'object',
  icon: DocumentTextIcon,
  description: 'A short, warm note in two columns: the heading, then your words beside it.',
  fields: [
    eyebrowField(),
    headingField('A note on investment'),
    simpleBlocks('body', 'The note'),
    defineField({
      name: 'signature',
      title: 'Signed (optional)',
      type: 'string',
      description: 'Your first name, set in the italic of the heading font.',
      validation: (Rule) => Rule.max(40),
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'A note on investment', subtitle: 'Note' }),
  },
});

// ── 6. Questions ────────────────────────────────────────────────────────────
// The answers are offered to Google as an FAQPage when they are real words
// (sectionFaqs() in src/lib/page-meta.ts skips "Placeholder: ..." answers).
export const sessionQuestions = defineType({
  name: 'sessionQuestions',
  title: 'Questions, then booking',
  type: 'object',
  icon: HelpCircleIcon,
  description: 'Questions that open with a tap, in ruled rows, and a link to book.',
  fields: [
    eyebrowField(),
    headingField('Questions'),
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(12),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sessionQuestion',
          title: 'Question',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required().max(120),
            }),
            simpleBlocks('answer', 'Answer'),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Booking link',
      type: 'ctaBlock',
      description: 'Left empty, it reads "Book a session" and goes to the Contact page.',
    }),
  ],
  preview: {
    select: { heading: 'heading', items: 'items' },
    prepare: ({ heading, items }) => ({
      title: heading || 'Questions',
      subtitle: `Questions${Array.isArray(items) ? ` (${items.length})` : ''}`,
    }),
  },
});

export const sessionSectionSchemas = [
  sessionsOpening,
  sessionSittings,
  sessionExperience,
  heirloomsSpec,
  investmentNote,
  sessionQuestions,
];
