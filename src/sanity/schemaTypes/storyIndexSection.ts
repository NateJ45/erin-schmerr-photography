// scaffold-file: stories
// Safe to edit by hand
// Home page block: "Stories". The featured stories as a grid of covers or a
// plain list of titles. The stories come from the Stories list itself (the
// ones ticked Featured, newest order first); the block holds only its heading,
// its layout and how many to show. No colour field (rule 9); SELF_CONTAINED in
// sectionCadence.ts and self-filling in pageBuilderConfig.ts.

import { defineType, defineField } from 'sanity';
import { ImagesIcon } from '@sanity/icons/Images';

export const storyIndex = defineType({
  name: 'storyIndex',
  title: 'Stories',
  type: 'object',
  icon: ImagesIcon,
  description: 'The featured stories, as covers or as a list of titles.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Selected stories',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: 'layout',
      title: 'Show them as',
      type: 'string',
      initialValue: 'grid',
      options: {
        list: [
          { title: 'A grid of covers', value: 'grid' },
          { title: 'A list of titles', value: 'list' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'limit',
      title: 'How many',
      type: 'number',
      initialValue: 6,
      validation: (Rule) => Rule.min(1).max(12).integer(),
    }),
  ],
  preview: {
    select: { heading: 'heading', layout: 'layout' },
    prepare: ({ heading, layout }) => ({
      title: heading || 'Stories',
      subtitle: layout === 'list' ? 'Featured stories, as a list' : 'Featured stories, as covers',
    }),
  },
});
