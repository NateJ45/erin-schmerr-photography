// scaffold-file: press
// Safe to edit by hand
// Two home page blocks fed by the Publications list:
//   publishedMarquee  the magazine names, once each, in a strip
//   tearSheetStack    the publications' tear sheets
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

export const pressSectionSchemas = [publishedMarquee, tearSheetStack];
