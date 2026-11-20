// scaffold-file: press
// Safe to edit by hand
// Two home page blocks fed by the Publications list:
//   publishedMarquee  the magazine names, once each, in a strip
//   tearSheetStack    the publications' tear sheets
//   proofStrip        press features between short quotes
//   pressContents     the About page's "As seen in" contents line
// Each holds only its heading; the names and pictures come from the list, so a
// new publication shows up with no page edit. No colour field (rule 9); both
// SELF_CONTAINED in sectionCadence.ts and self-filling in pageBuilderConfig.ts.

import { defineType, defineField } from 'sanity';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { StackIcon } from '@sanity/icons/Stack';

export const publishedMarquee = defineType({
  name: 'publishedMarquee',
  title: 'Published in',
  type: 'object',
  icon: DocumentsIcon,
  description: 'The names of the magazines the work has appeared in.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'As published in',
      validation: (Rule) => Rule.max(60),
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({
      title: heading || 'Published in',
      subtitle: 'Magazine names, from Publications',
    }),
  },
});

export const tearSheetStack = defineType({
  name: 'tearSheetStack',
  title: 'Tear sheets',
  type: 'object',
  icon: StackIcon,
  description: 'The tear sheets from Publications, newest first.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'In print',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: 'limit',
      title: 'How many',
      type: 'number',
      initialValue: 4,
      validation: (Rule) => Rule.min(1).max(8).integer(),
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({
      title: heading || 'Tear sheets',
      subtitle: 'Tear sheets, from Publications',
    }),
  },
});

// The proof strip: a slow, pausable line of credited proof, the press features
// from Publications (magazine and what ran) between short lines in your own
// words with where you said them. ProofStrip.astro; the marquee works like the
// Published one (still under reduced motion, without JS, or with few lines).
export const proofStrip = defineType({
  name: 'proofStrip',
  title: 'Proof strip',
  type: 'object',
  icon: DocumentsIcon,
  description:
    'A slow line of press features (from Publications) and short quotes, each with where it came from.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Label (read by screen readers)',
      type: 'string',
      initialValue: 'Press and interviews',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'showPress',
      title: 'Include the press features from Publications',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'quotes',
      title: 'Quotes',
      type: 'array',
      validation: (Rule) => Rule.max(8),
      of: [
        {
          type: 'object',
          name: 'proofQuote',
          title: 'Quote',
          fields: [
            defineField({
              name: 'text',
              title: 'The words',
              type: 'string',
              description: 'Without quotation marks; they are added for you.',
              validation: (Rule) => Rule.required().max(140),
            }),
            defineField({
              name: 'credit',
              title: 'Where it came from',
              type: 'string',
              description: 'Like "Erin, in BleachFilm".',
              validation: (Rule) => Rule.max(60),
            }),
          ],
          preview: { select: { title: 'text', subtitle: 'credit' } },
        },
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading', quotes: 'quotes' },
    prepare: ({ heading, quotes }) => ({
      title: heading || 'Proof strip',
      subtitle: `Press features and ${Array.isArray(quotes) ? quotes.length : 0} quotes`,
    }),
  },
});

// As seen in (the About page, 2026-11-20): every magazine once, set very large in the
// display italic and parted by slashes like a contents line. Pointing at or focusing one
// dims the others and shows that issue's tear sheet and date. PressContents.astro; the
// names come from Publications, so the block holds only its label.
export const pressContents = defineType({
  name: 'pressContents',
  title: 'As seen in',
  type: 'object',
  icon: DocumentsIcon,
  description:
    'Every magazine your work has run in, as one large contents line (from Publications).',
  fields: [
    defineField({
      name: 'heading',
      title: 'Label',
      type: 'string',
      initialValue: 'As seen in',
      validation: (Rule) => Rule.max(60),
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({
      title: heading || 'As seen in',
      subtitle: 'The magazines, from Publications',
    }),
  },
});

export const pressSectionSchemas = [publishedMarquee, tearSheetStack, proofStrip, pressContents];
