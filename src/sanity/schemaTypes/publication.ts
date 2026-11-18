// scaffold-file: press
// Safe to edit by hand
// One time the work appeared in print or online: a magazine, an issue, a date.
// Listed on /press/ (grouped by year, worked out from `date`), named in the
// home page's Published marquee, and linked from a story's "Published in" note.

import { defineType, defineField } from 'sanity';
import { previewDate, previewSubtitle } from '../../lib/studio-icons';

export const publication = defineType({
  name: 'publication',
  title: 'Publication',
  type: 'document',
  fields: [
    defineField({
      name: 'magazine',
      title: 'Magazine or outlet',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'issue',
      title: 'Issue',
      type: 'string',
      description: 'Optional. For example "Issue 12" or "Spring 2026".',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'When it came out. The press page groups by the year of this date.',
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      description: 'Optional. Where to read it online.',
    }),
    defineField({
      name: 'tearSheet',
      title: 'Tear sheet',
      type: 'photo',
      description: 'A photo or scan of the printed page.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Optional. A line or two from the piece.',
      validation: (Rule) => Rule.max(300),
    }),
  ],
  preview: {
    select: { title: 'magazine', issue: 'issue', date: 'date', media: 'tearSheet' },
    prepare: ({ title, issue, date, media }) => ({
      title: title || 'Untitled publication',
      subtitle: previewSubtitle(issue ?? '', previewDate(date) || 'No date yet'),
      media,
    }),
  },
  orderings: [
    { title: 'Newest first', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
  ],
});
