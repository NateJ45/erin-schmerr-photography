// scaffold-file: testimonials
// Safe to edit by hand
// =============================================================================
// kindWords - "Kind words", the site's own testimonial block (2026-11-20)
// =============================================================================
// A client's square portrait beside a long quote in the display face, with
// their name and the kind of sitting in small capitals, as ruled editorial
// rows (KindWords.astro). The words live in Testimonial documents (testimonial.ts),
// so one quote can sit on the home page and About without being typed twice:
//   - pick quotes here to choose them and their order, or
//   - leave the list empty and the block shows every testimonial, featured
//     first, then newest (self-filling, pageBuilderConfig.ts).
// A testimonial that is not ticked "Confirmed" shows "Placeholder: replace with
// a real client's words" above it, so a stand-in can never pass for a client.
// No colour field (rule 9): it sits on the plain page ground (sectionCadence.ts).
// =============================================================================
import { defineArrayMember, defineField, defineType } from 'sanity';
import { CommentIcon } from '@sanity/icons/Comment';

export const kindWords = defineType({
  name: 'kindWords',
  title: 'Kind words',
  type: 'object',
  icon: CommentIcon,
  description:
    "Clients' words beside their portraits, as ruled rows (from Testimonials). Leave the list empty to show them all.",
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description:
        'Put one word between underscores to set it in italic, for example "Kind _words_".',
      initialValue: 'Kind _words_',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'quotes',
      title: 'Quotes (optional)',
      type: 'array',
      description:
        'Pick the testimonials to show, in order. Leave empty to show every testimonial, featured first.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
      validation: (Rule) => Rule.max(8).unique(),
    }),
    defineField({
      name: 'crossfade',
      title: 'One at a time',
      type: 'boolean',
      description:
        'Show one quote at a time and cross-fade slowly to the next (with a Pause button). Off shows them all as rows.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { heading: 'heading', quotes: 'quotes', crossfade: 'crossfade' },
    prepare: ({ heading, quotes, crossfade }) => {
      const n = Array.isArray(quotes) ? quotes.length : 0;
      return {
        title: (heading || 'Kind words').replace(/_/g, ''),
        subtitle: `${n ? `${n} chosen` : 'Every testimonial'}${crossfade ? ', one at a time' : ''}`,
      };
    },
  },
});
