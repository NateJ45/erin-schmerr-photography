// scaffold-file: stories
// Safe to edit by hand
// Home page block: "Stories". The featured stories as a grid of covers or a
// plain list of titles. The stories come from the Stories list itself (the
// ones ticked Featured, newest order first); the block holds only its heading,
// its layout and how many to show. No colour field (rule 9); SELF_CONTAINED in
// sectionCadence.ts and self-filling in pageBuilderConfig.ts.

import { defineType, defineField } from 'sanity';
import { ImagesIcon } from '@sanity/icons/Images';
import { OlistIcon } from '@sanity/icons/Olist';
import { UsersIcon } from '@sanity/icons/Users';
import { EditIcon } from '@sanity/icons/Edit';

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
    // A small portrait set inside the headline, the way a person-first site
    // opens ("I make portraits [her face] slowly brought into focus"). Optional:
    // empty, the headline is plain words and nothing else changes.
    defineField({
      name: 'portrait',
      title: 'Your portrait in the headline (optional)',
      type: 'image',
      description:
        'A small picture of you, set inside the headline between two words. Use the hotspot to centre your face. Leave it empty and the headline reads as plain words.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'portraitAfterWord',
      title: 'Put the portrait after word number',
      type: 'number',
      description: '1 puts it after the first word of the headline.',
      initialValue: 1,
      hidden: ({ parent }) => !(parent as { portrait?: { asset?: unknown } })?.portrait?.asset,
      validation: (Rule) => Rule.min(1).max(12).integer(),
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
    select: { headline: 'headline', media: 'portrait' },
    prepare: ({ headline, media }) => ({
      title: headline || 'Cover hero',
      subtitle: 'Featured story covers, one per screen',
      media,
    }),
  },
});

// Home page block: "How I get the look". The craft, set as numbered notes
// beside a heading that stays put on a wide screen (CraftNotes.astro). Each note
// is a short title and a sentence or two. No colour field (rule 9);
// SELF_CONTAINED in sectionCadence.ts.
export const craftNotes = defineType({
  name: 'craftNotes',
  title: 'Notes on the craft',
  type: 'object',
  icon: OlistIcon,
  description: 'Numbered notes on how the work is made: a short title and a sentence each.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the heading (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'How I get the look',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'intro',
      title: 'A sentence under the heading (optional)',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'array',
      validation: (Rule) => Rule.required().min(2).max(8),
      of: [
        {
          type: 'object',
          name: 'craftNote',
          title: 'Note',
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
              validation: (Rule) => Rule.max(300),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'body' } },
        },
      ],
    }),
  ],
  preview: {
    select: { heading: 'heading', notes: 'notes' },
    prepare: ({ heading, notes }) => ({
      title: heading || 'Notes on the craft',
      subtitle: `Craft notes${Array.isArray(notes) ? ` (${notes.length})` : ''}`,
    }),
  },
});

// Home page block: "One person, start to finish". A short paragraph beside a
// crew list set like a magazine credit (role, then name; CreditBlock's look).
// CrewList.astro. No colour field (rule 9); SELF_CONTAINED in sectionCadence.ts.
export const crewSection = defineType({
  name: 'crewSection',
  title: 'Crew list',
  type: 'object',
  icon: UsersIcon,
  description:
    'A short paragraph beside a list of roles and who does them, like a magazine credit.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the heading (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'body',
      title: 'Paragraph',
      type: 'array',
      of: [
        {
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
        },
      ],
    }),
    defineField({
      name: 'crewHeading',
      title: 'Small line above the list',
      type: 'string',
      initialValue: 'The crew',
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: 'crew',
      title: 'Roles',
      type: 'array',
      validation: (Rule) => Rule.min(1).max(10),
      of: [
        {
          type: 'object',
          name: 'crewRole',
          title: 'Role',
          fields: [
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              validation: (Rule) => Rule.required().max(40),
            }),
            defineField({
              name: 'name',
              title: 'Who',
              type: 'string',
              validation: (Rule) => Rule.required().max(60),
            }),
          ],
          preview: { select: { title: 'role', subtitle: 'name' } },
        },
      ],
    }),
    defineField({ name: 'link', title: 'Link under the list (optional)', type: 'ctaBlock' }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'Crew list', subtitle: 'Paragraph and crew' }),
  },
});

// Home page block: the signed close. A heading, a sentence or two, one filled
// button and a signature set in the display italic (no script font; DESIGN.md).
// SignedClose.astro. It is the page's one booking ask, so its button keeps the
// accent (SectionRenderer's budget). No colour field (rule 9); SELF_CONTAINED.
export const signedClose = defineType({
  name: 'signedClose',
  title: 'Signed close',
  type: 'object',
  icon: EditIcon,
  description: 'The last word on the page: a heading, a short note, one button and your name.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the heading (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required().max(90),
    }),
    defineField({
      name: 'body',
      title: 'A sentence or two',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(320),
    }),
    defineField({ name: 'cta', title: 'Button', type: 'ctaBlock' }),
    defineField({
      name: 'signature',
      title: 'Signed',
      type: 'string',
      description: 'Your first name, set in the italic of the heading font.',
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: 'signatureImage',
      title: 'Your handwritten signature (optional)',
      type: 'image',
      description:
        'A scan of your signature, dark ink on a clear (transparent) background. Shown in place of the typed name; the typed name is still read out to screen readers.',
    }),
  ],
  preview: {
    select: { heading: 'heading', signature: 'signature' },
    prepare: ({ heading, signature }) => ({
      title: heading || 'Signed close',
      subtitle: signature ? `Signed, ${signature}` : 'Signed close',
    }),
  },
});
