// scaffold-file: stories
// Safe to edit by hand
// A story: one shoot or editorial, told as a cover and a sequence of photos,
// with the people who made it credited underneath. Lives at /stories/<slug>/;
// every photo it holds (unless untucked from the archive) also shows on
// /archive/.
//
// Ordering follows the starter's collection pattern: the orderable-document-list
// plugin drags rows in the Studio and writes `orderRank` (see structure.ts), and
// the site orders by it, newest date next.
//
// Camera settings are not fields: they come from each file's EXIF at query time
// (see photo.ts and rule 15).

import { defineType, defineField, defineArrayMember } from 'sanity';
import { previewDate, previewSubtitle } from '../../lib/studio-icons';
import { seoFields } from './_seoFields';

export const story = defineType({
  name: 'story',
  title: 'Story',
  type: 'document',
  groups: [
    { name: 'story', title: 'Story', default: true },
    { name: 'photos', title: 'Photos' },
    { name: 'credits', title: 'Credits' },
    { name: 'seo', title: 'Search & sharing' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'story',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      group: 'story',
      description: 'The story lives at /stories/{this}/. Made from the title.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dek',
      title: 'Short line',
      type: 'string',
      group: 'story',
      description:
        'One line under the title, on the story and its card. Also the Google description when that is empty.',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      group: 'story',
      description: 'When it was shot.',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      group: 'story',
      description: 'Optional. A town, a studio, a landscape.',
    }),
    defineField({
      name: 'startedFrom',
      title: 'Where the idea came from',
      type: 'string',
      group: 'story',
      description:
        'Optional. The decade, book, film or character the shoot started from, like "A 1950s Halloween party" or "Sleepy Hollow". Shown under "How this was made" at the end of the story.',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: 'cover',
      title: 'Cover photo',
      type: 'photo',
      group: 'story',
      description: 'Opens the story and shows on its card.',
    }),
    // Derived, never typed (rule 15): scripts/make-cutouts.mjs writes it. The
    // person in the cover on a transparent ground, at the cover's own size, so
    // the home page can set the title BEHIND them (DESIGN.md "Cover frame").
    // `cutoutOf` is the cover asset it was made from: when the cover changes,
    // the site ignores the stale cut-out until the script is run again.
    defineField({
      name: 'coverCutout',
      title: 'Cover cut-out (made automatically)',
      type: 'image',
      group: 'story',
      readOnly: true,
      description:
        'Made by a script from the cover photo, for the home page. Nothing to do here: change the cover and it is remade.',
      fields: [
        defineField({ name: 'cutoutOf', title: 'Made from', type: 'string', readOnly: true }),
        defineField({
          name: 'subject',
          title: 'Where the person is',
          type: 'object',
          readOnly: true,
          options: { collapsible: true, collapsed: true },
          fields: [
            'top',
            'bottom',
            'left',
            'right',
            'headTop',
            'headBottom',
            'headX',
            'coverage',
          ].map((name) => defineField({ name, type: 'number', readOnly: true })),
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'story',
      initialValue: false,
      description: 'Featured stories are the ones the home page "Stories" block shows.',
    }),
    // scaffold: press
    defineField({
      name: 'publication',
      title: 'Published in',
      type: 'reference',
      group: 'story',
      to: [{ type: 'publication' }],
      description: 'Optional. Adds a "Published in" note to the story.',
    }),
    // scaffold:end
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      group: 'photos',
      description:
        'The sequence, in order. Drop several files on the list at once to add them together, then drag to reorder.',
      of: [defineArrayMember({ type: 'photo' })],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'array',
      group: 'credits',
      description:
        'Everyone who made the story. Add a person once under Collaborators, then pick them here.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'credit',
          title: 'Credit',
          fields: [
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              description: 'For example "Makeup". Leave empty to use their usual role.',
            }),
            defineField({
              name: 'collaborator',
              title: 'Person',
              type: 'reference',
              to: [{ type: 'collaborator' }],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              role: 'role',
              name: 'collaborator.name',
              fallback: 'collaborator.defaultRole',
            },
            prepare: ({ role, name, fallback }) => ({
              title: name || 'Pick a person',
              subtitle: role || fallback || 'No role yet',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'orderRank',
      title: 'Order rank',
      type: 'string',
      hidden: true,
      description: 'Managed by the orderable-document-list plugin. Drag to reorder in the Studio.',
    }),
    ...seoFields({ group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', date: 'date', featured: 'featured', media: 'cover' },
    prepare: ({ title, date, featured, media }) => ({
      title: title || 'Untitled story',
      subtitle: previewSubtitle(featured ? 'Featured' : '', previewDate(date) || 'No date yet'),
      media,
    }),
  },
  orderings: [
    { title: 'Newest first', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
  ],
});
