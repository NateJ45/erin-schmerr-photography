// scaffold-file: about
// Safe to edit by hand
// The About page's own blocks (the boutique About, 2026-11-20; DESIGN.md "About page"):
//   aboutOpening    a headline that rises line by line beside a slow photo
//   aboutStory      a tall portrait beside the story, paragraphs lightening in
//   aboutApproach   a short statement, then a line in her voice over a photo
//   processFigures  behind the scenes: five figures, "Fig 01." to "Fig 05."
// The "As seen in" line is `pressContents` (pressSections.ts, the press
// capability) and the close is `signedClose` (storyIndexSection.ts).
//
// No colour field on any of them (rule 9): each is SELF_CONTAINED in
// sectionCadence.ts and draws on the page's paper. No dropdowns, so nothing
// for NON_STEGA_FIELDS (rule 8b). Nothing here is computable from data (rule
// 15): every field is words or a picture only she can supply.

import { defineArrayMember, defineField, defineType } from 'sanity';
import { BlockquoteIcon } from '@sanity/icons/Blockquote';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { ImagesIcon } from '@sanity/icons/Images';
import { UserIcon } from '@sanity/icons/User';

/** A photo with alt text, the shape every picture field on these blocks takes. */
const photoField = (name: string, title: string, description: string) =>
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
        description: 'For people who cannot see it. Name who is in it.',
        validation: (Rule) => Rule.max(160),
      }),
    ],
  });

export const aboutOpening = defineType({
  name: 'aboutOpening',
  title: 'About: opening',
  type: 'object',
  icon: DocumentTextIcon,
  description: 'A large headline that rises line by line, beside one photo.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the headline (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description:
        'One sentence. Put a word between underscores to set it in italic: I was afraid of _forgetting_ it all.',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'subhead',
      title: 'Line under the headline (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
    photoField('image', 'Photo', 'One of your photographs. It drifts slowly as the page scrolls.'),
  ],
  preview: {
    select: { title: 'headline', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'About: opening',
      subtitle: 'Opening',
      media,
    }),
  },
});

export const aboutStory = defineType({
  name: 'aboutStory',
  title: 'About: portrait and story',
  type: 'object',
  icon: UserIcon,
  description: 'A tall portrait of you beside your story.',
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
      validation: (Rule) => Rule.required().max(90),
    }),
    defineField({
      name: 'body',
      title: 'Your story',
      type: 'array',
      description: 'A few short paragraphs. Each one comes up to full ink as it scrolls in.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
        }),
      ],
    }),
    photoField('portrait', 'Portrait of you', 'A tall (portrait-shaped) photo of you works best.'),
  ],
  preview: {
    select: { title: 'heading', media: 'portrait' },
    prepare: ({ title, media }) => ({
      title: title || 'About: portrait and story',
      subtitle: 'Portrait and story',
      media,
    }),
  },
});

export const aboutApproach = defineType({
  name: 'aboutApproach',
  title: 'About: approach',
  type: 'object',
  icon: BlockquoteIcon,
  description: 'A short statement in large type, then a line in your voice over a photo.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the statement (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'statement',
      title: 'Statement',
      type: 'string',
      description: 'One sentence, set very large.',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'body',
      title: 'A paragraph or two (optional)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
        }),
      ],
    }),
    defineField({
      name: 'voice',
      title: 'A line in your voice',
      type: 'text',
      rows: 2,
      description: 'Set in italic over the photo. Something you have said, in your words.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'voiceCredit',
      title: 'Where you said it (optional)',
      type: 'string',
      validation: (Rule) => Rule.max(80),
    }),
    photoField('image', 'Photo', 'One of your soft-light photographs, wide or tall.'),
  ],
  preview: {
    select: { title: 'statement', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'About: approach',
      subtitle: 'Approach',
      media,
    }),
  },
});

export const processFigures = defineType({
  name: 'processFigures',
  title: 'About: behind the scenes',
  type: 'object',
  icon: ImagesIcon,
  description: 'Up to five photos from your shoots, numbered "Fig 01." to "Fig 05."',
  fields: [
    defineField({
      name: 'label',
      title: 'Small label in brackets',
      type: 'string',
      initialValue: 'Process',
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Two or three words. The first sits on the left, the rest on the right.',
      initialValue: 'Behind the scenes',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'figures',
      title: 'Photos',
      type: 'array',
      description:
        'Five work best: the first wide, the second tall, the third large, the last two small.',
      validation: (Rule) => Rule.max(5),
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo',
              type: 'string',
              validation: (Rule) => Rule.max(160),
            }),
            defineField({
              name: 'caption',
              title: 'Caption (optional)',
              type: 'string',
              description: 'A few words under the photo: a set, a light, a fitting.',
              validation: (Rule) => Rule.max(80),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'heading', figures: 'figures', media: 'figures.0' },
    prepare: ({ title, figures, media }) => ({
      title: title || 'About: behind the scenes',
      subtitle: `${Array.isArray(figures) ? figures.length : 0} of 5 photos`,
      media,
    }),
  },
});

export const aboutSectionSchemas = [aboutOpening, aboutStory, aboutApproach, processFigures];
