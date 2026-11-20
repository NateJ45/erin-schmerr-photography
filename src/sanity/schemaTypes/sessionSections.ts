// scaffold-file: sessions
// Safe to edit by hand
// The Sessions page's own blocks (picked 2026-11-20, "a couture house, not a
// pricing table"): an opening line, the sittings side by side, the experience
// with a pinned photo, heirlooms as a spec sheet, a note on investment and the
// questions. Each draws one band on the plain page ground (SELF_CONTAINED in
// sectionCadence.ts) and carries no colour field (rule 9). Components:
// src/components/sessions/, styles: src/styles/page-sessions.css.
//
// Phase 2 (2026-11-20) added the offers (one chapter per kind of client, with
// tiers), the team and the close, and gave the experience a photo per step and
// a signature moment, heirlooms their sizes and real walls, the note its
// ledger and the questions their worries.
//
// Money is never typed in code: every figure on the page ("Investment from",
// an offer's or a tier's "from", the typical spend, the session fee) is a field
// typed by the photographer in the Studio, and each hides while it is empty.

import { defineArrayMember, defineField, defineType } from 'sanity';
import { TextIcon } from '@sanity/icons/Text';
import { ThLargeIcon } from '@sanity/icons/ThLarge';
import { OlistIcon } from '@sanity/icons/Olist';
import { ImagesIcon } from '@sanity/icons/Images';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { HelpCircleIcon } from '@sanity/icons/HelpCircle';
import { StackIcon } from '@sanity/icons/Stack';
import { UsersIcon } from '@sanity/icons/Users';
import { LaunchIcon } from '@sanity/icons/Launch';

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
    photoField(
      'photo',
      'The photo the line runs across (optional)',
      'One of your portraits, set large at the right; the line crosses its edge, ink on the paper and paper on the photo. A portrait shape works best, with the face in the upper half (the line sits low).',
    ),
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
  description:
    'The steps of a session one by one, each with its own photo, which changes in a frame that stays in view as they pass.',
  fields: [
    eyebrowField(),
    headingField('The experience'),
    introField(),
    photoField(
      'photo',
      'A tall photo',
      'Shown for any step without a photo of its own. A portrait-shaped photo works best.',
    ),
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
              name: 'when',
              title: 'When (optional)',
              type: 'string',
              description: 'A small line above the title, for example "Two weeks before".',
              validation: (Rule) => Rule.max(40),
            }),
            defineField({
              name: 'body',
              title: 'A sentence or two',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.max(360),
            }),
            photoField('photo', 'A photo for this step (optional)'),
            defineField({
              name: 'signature',
              title: 'The signature moment',
              type: 'boolean',
              initialValue: false,
              description:
                'Tick one step, the moment you most want people to remember. It is drawn larger, and its photo is shown on a screen, like the reveal.',
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'when', media: 'photo', signature: 'signature' },
            prepare: ({ title, subtitle, media, signature }) => ({
              title,
              subtitle: [signature ? 'Signature moment' : '', subtitle].filter(Boolean).join(' · '),
              media,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'signatureLabel',
      title: 'Label on the signature moment',
      type: 'string',
      initialValue: 'The signature moment',
      validation: (Rule) => Rule.max(40),
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
    defineField({
      name: 'sizesHeading',
      title: 'Heading over the wall-art sizes',
      type: 'string',
      initialValue: 'Wall art, by size',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'sizes',
      title: 'Wall-art sizes (optional)',
      type: 'array',
      description:
        'Smallest first. Each is drawn to scale on one wall, so the width and height in inches matter; leave them empty and the size shows as a name only.',
      validation: (Rule) => Rule.max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'wallSize',
          title: 'Size',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'For example Mini, Classic or Statement.',
              validation: (Rule) => Rule.required().max(30),
            }),
            defineField({
              name: 'dims',
              title: 'Size as it should read',
              type: 'string',
              description: 'For example 16 x 20 in.',
              validation: (Rule) => Rule.max(30),
            }),
            defineField({
              name: 'feeling',
              title: 'How it feels on a wall',
              type: 'string',
              validation: (Rule) => Rule.max(90),
            }),
            defineField({
              name: 'width',
              title: 'Width in inches (for the drawing)',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(120),
            }),
            defineField({
              name: 'height',
              title: 'Height in inches (for the drawing)',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(120),
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'dims' } },
        }),
      ],
    }),
    defineField({
      name: 'wallsHeading',
      title: 'Heading over the photos of real walls',
      type: 'string',
      initialValue: 'Framed on real walls',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'walls',
      title: 'Photos of your work on real walls (optional)',
      type: 'array',
      description: 'Your clients’ homes, with their permission. Two to five read best.',
      validation: (Rule) => Rule.max(6),
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
            defineField({
              name: 'caption',
              title: 'Caption (optional)',
              type: 'string',
              description: 'For example "A Statement piece over the mantel, West Chester".',
              validation: (Rule) => Rule.max(90),
            }),
          ],
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
    // The ledger under the note. Every figure is typed here by the photographer,
    // never in code; a row whose figure is empty is not drawn.
    defineField({
      name: 'rangeLabel',
      title: 'Name of the typical-spend line',
      type: 'string',
      initialValue: 'Most clients invest between',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'range',
      title: 'Typical spend (optional)',
      type: 'string',
      description:
        'Typed exactly as it should read, for example a low and a high figure. Empty hides the line.',
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: 'feeLabel',
      title: 'Name of the session-fee line',
      type: 'string',
      initialValue: 'The session fee',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'fee',
      title: 'Session fee (optional)',
      type: 'string',
      description: 'Typed exactly as it should read. Empty hides the line.',
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: 'feeNote',
      title: 'What the session fee covers (optional)',
      type: 'string',
      description: 'One line under the fee, for example that the art is chosen separately.',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'financingNote',
      title: 'A note on payment plans (optional)',
      type: 'string',
      description: 'One small line at the foot, for example how a payment plan works.',
      validation: (Rule) => Rule.max(200),
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
  description:
    'The worries people bring, answered in your words, then questions that open with a tap, and a link to book.',
  fields: [
    eyebrowField(),
    defineField({
      name: 'worriesHeading',
      title: 'Heading over the worries',
      type: 'string',
      initialValue: 'What people worry about',
      validation: (Rule) => Rule.max(90),
    }),
    defineField({
      name: 'worries',
      title: 'Worries (optional)',
      type: 'array',
      description:
        'What clients say before a session, in their words ("I hate photos of myself"), and your answer. Three read best.',
      validation: (Rule) => Rule.max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sessionWorry',
          title: 'Worry',
          fields: [
            defineField({
              name: 'worry',
              title: 'The worry, as a client says it',
              type: 'string',
              validation: (Rule) => Rule.required().max(90),
            }),
            defineField({
              name: 'reply',
              title: 'Your answer',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.max(360),
            }),
          ],
          preview: { select: { title: 'worry', subtitle: 'reply' } },
        }),
      ],
    }),
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

// ── 7. The offers (phase 2, 2026-11-20) ─────────────────────────────────────
// One chapter per kind of client (portrait and family, creative, digitals),
// each with its own photo, what it includes and an optional "from" figure. An
// offer can carry tiers (Test, Editorial, Fine-art commission) compared on the
// same rows, with one marked as the most chosen. Money is typed here only.
export const sessionOffers = defineType({
  name: 'sessionOffers',
  title: 'The offers',
  type: 'object',
  icon: StackIcon,
  description:
    'Each kind of session as its own chapter with a photo; an offer can hold tiers compared side by side.',
  fields: [
    eyebrowField(),
    headingField('Three ways in'),
    introField(),
    defineField({
      name: 'offers',
      title: 'Offers',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sessionOffer',
          title: 'Offer',
          fields: [
            defineField({
              name: 'kicker',
              title: 'Who it is for (small line above the name)',
              type: 'string',
              validation: (Rule) => Rule.max(60),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required().max(50),
            }),
            defineField({
              name: 'line',
              title: 'A sentence or two',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.max(360),
            }),
            photoField('photo', 'A photo'),
            defineField({
              name: 'includes',
              title: 'What it includes',
              type: 'array',
              of: [defineArrayMember({ type: 'string', validation: (Rule) => Rule.max(80) })],
              validation: (Rule) => Rule.max(8),
            }),
            defineField({
              name: 'fromLabel',
              title: 'Name of the price line',
              type: 'string',
              initialValue: 'Sessions from',
              validation: (Rule) => Rule.max(40),
            }),
            defineField({
              name: 'from',
              title: 'Price from (optional)',
              type: 'string',
              description: 'Typed exactly as it should read. Empty hides the line.',
              validation: (Rule) => Rule.max(40),
            }),
            defineField({
              name: 'tiers',
              title: 'Tiers (optional)',
              type: 'array',
              description: 'Up to four, compared on the rows below. Tick one as the most chosen.',
              validation: (Rule) => Rule.max(4),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'offerTier',
                  title: 'Tier',
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Name',
                      type: 'string',
                      validation: (Rule) => Rule.required().max(40),
                    }),
                    defineField({
                      name: 'line',
                      title: 'A short line',
                      type: 'string',
                      validation: (Rule) => Rule.max(120),
                    }),
                    defineField({
                      name: 'featured',
                      title: 'The most chosen',
                      type: 'boolean',
                      initialValue: false,
                    }),
                    defineField({
                      name: 'from',
                      title: 'Price from (optional)',
                      type: 'string',
                      description: 'Typed exactly as it should read. Empty hides it.',
                      validation: (Rule) => Rule.max(40),
                    }),
                  ],
                  preview: {
                    select: { title: 'name', subtitle: 'line', featured: 'featured' },
                    prepare: ({ title, subtitle, featured }) => ({
                      title: featured ? `${title} (most chosen)` : title,
                      subtitle,
                    }),
                  },
                }),
              ],
            }),
            defineField({
              name: 'tierRows',
              title: 'What each tier includes',
              type: 'array',
              description:
                'One line each: its name, then a value for each tier in the same order (for example "2 looks", "4 looks", "6 looks"). An empty value shows a small dot.',
              validation: (Rule) => Rule.max(8),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'tierRow',
                  title: 'Line',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'What it is',
                      type: 'string',
                      validation: (Rule) => Rule.required().max(40),
                    }),
                    defineField({
                      name: 'values',
                      title: 'Value for each tier',
                      type: 'array',
                      of: [
                        defineArrayMember({ type: 'string', validation: (Rule) => Rule.max(40) }),
                      ],
                      validation: (Rule) => Rule.max(4),
                    }),
                  ],
                  preview: { select: { title: 'label' } },
                }),
              ],
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'kicker', media: 'photo' } },
        }),
      ],
    }),
    defineField({
      name: 'featuredLabel',
      title: 'Label on the most chosen tier',
      type: 'string',
      initialValue: 'Most chosen',
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: 'askLabel',
      title: 'Link under each offer',
      type: 'string',
      initialValue: 'Ask about this session',
      description: 'Goes to the Contact page.',
      validation: (Rule) => Rule.max(40),
    }),
  ],
  preview: {
    select: { heading: 'heading', offers: 'offers' },
    prepare: ({ heading, offers }) => ({
      title: heading || 'The offers',
      subtitle: `Offers${Array.isArray(offers) ? ` (${offers.length})` : ''}`,
    }),
  },
});

// ── 8. The team ─────────────────────────────────────────────────────────────
// The people who work beside her (hair, makeup, styling), credited like a
// masthead. Each points at a Collaborator, the same list story credits use, so
// a name and its link are typed once.
export const sessionTeam = defineType({
  name: 'sessionTeam',
  title: 'The team',
  type: 'object',
  icon: UsersIcon,
  description: 'Your hair, makeup and styling collaborators, credited like a magazine masthead.',
  fields: [
    eyebrowField(),
    headingField('The team'),
    introField(),
    photoField('photo', 'A photo of the team at work (optional)'),
    defineField({
      name: 'members',
      title: 'People',
      type: 'array',
      validation: (Rule) => Rule.required().min(1).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'teamMember',
          title: 'Person',
          fields: [
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              description: 'For example Hair, Makeup or Styling.',
              validation: (Rule) => Rule.required().max(40),
            }),
            defineField({
              name: 'collaborator',
              title: 'Who (from Collaborators)',
              type: 'reference',
              to: [{ type: 'collaborator' }],
            }),
            defineField({
              name: 'line',
              title: 'A line about them (optional)',
              type: 'string',
              validation: (Rule) => Rule.max(160),
            }),
          ],
          preview: {
            select: { title: 'collaborator.name', subtitle: 'role' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading', members: 'members', media: 'photo' },
    prepare: ({ heading, members, media }) => ({
      title: heading || 'The team',
      subtitle: `People${Array.isArray(members) ? ` (${members.length})` : ''}`,
      media,
    }),
  },
});

// ── 9. The close ────────────────────────────────────────────────────────────
// The page's one booking ask: one huge word cut out of the paper so a photo
// shows through it, beside the heading, a line, the one filled button and a
// reply promise.
export const sessionsClose = defineType({
  name: 'sessionsClose',
  title: 'The close: reserve a consultation',
  type: 'object',
  icon: LaunchIcon,
  description:
    'The last band: one huge word with a photo showing through it, and the button to reserve a consultation.',
  fields: [
    eyebrowField(),
    defineField({
      name: 'word',
      title: 'The big word',
      type: 'string',
      description: 'One short word, cut out of the paper so the photo shows through.',
      initialValue: 'Begin',
      validation: (Rule) => Rule.max(12),
    }),
    photoField('photo', 'The photo inside the word'),
    headingField('Reserve a complimentary consultation'),
    defineField({
      name: 'body',
      title: 'A sentence or two',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(320),
    }),
    defineField({
      name: 'cta',
      title: 'Button',
      type: 'ctaBlock',
      description: 'Left empty, it reads "Reserve a consultation" and goes to the Contact page.',
    }),
    defineField({
      name: 'replyNote',
      title: 'A small line under the button (optional)',
      type: 'string',
      description: 'For example how soon you reply.',
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: { heading: 'heading', media: 'photo' },
    prepare: ({ heading, media }) => ({
      title: heading || 'The close',
      subtitle: 'Close',
      media,
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
  sessionOffers,
  sessionTeam,
  sessionsClose,
];

/** Every Sessions block's type name: the Sessions page's own insert list (SessionsPageBuilderInput). */
export const SESSION_SECTION_TYPES = sessionSectionSchemas.map((s) => s.name);
