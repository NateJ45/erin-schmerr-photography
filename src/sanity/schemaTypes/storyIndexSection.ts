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

// Home page block: "Cover hero". The opening of the home page: the featured
// stories' covers, full bleed, crossfading one into the next, each easing from
// blur to sharp (DESIGN.md "everything comes into focus"), with the headline and
// two buttons over a soft scrim. The covers come from the Stories list (the
// ones ticked Featured); the block holds only its words and buttons. No colour
// field (rule 9); SELF_CONTAINED in sectionCadence.ts.
export const coverHero = defineType({
  name: 'coverHero',
  title: 'Cover hero',
  type: 'object',
  icon: ImagesIcon,
  description:
    'The featured stories, one per screen, each pulling into focus as you scroll. Your headline sits on the first.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the headline',
      type: 'string',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required().max(90),
    }),
    defineField({
      name: 'subhead',
      title: 'A sentence under it',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({ name: 'primaryCta', title: 'First button', type: 'ctaBlock' }),
    defineField({ name: 'secondaryCta', title: 'Second button', type: 'ctaBlock' }),
    defineField({
      name: 'limit',
      title: 'How many covers',
      type: 'number',
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(8).integer(),
    }),
  ],
  preview: {
    select: { headline: 'headline' },
    prepare: ({ headline }) => ({
      title: headline || 'Cover hero',
      subtitle: 'Featured story covers, fading one into the next',
    }),
  },
});
