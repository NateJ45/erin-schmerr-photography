// Safe to edit by hand
// One photograph: the image type every portfolio field uses (a story's cover and
// sequence, a publication's tear sheet). Deliberately NOT a scaffold capability:
// both `stories` and `press` use it, so it stays whichever one a fork removes.
//
// Camera, lens, aperture, shutter, ISO and focal length are NOT fields here.
// They are read at query time from the uploaded file's own EXIF
// (asset->metadata.exif, kept because `metadata` below asks Sanity to extract
// it), so nobody can retype a number that disagrees with the file (rule 15).
// `lqip` is the tiny blurred preview FocusImage.astro draws under the photo
// while it loads; `palette` is there for later colour-aware layouts. Location
// metadata is NOT requested: a photo's GPS position never reaches the dataset.

import { defineType, defineField } from 'sanity';

export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'image',
  options: {
    hotspot: true,
    metadata: ['exif', 'image', 'lqip', 'palette'],
  },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'What is in the photo, for people who cannot see it. One plain sentence: who, doing what, where.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption (optional)',
      type: 'string',
      description: 'A short line shown under the photo.',
    }),
    defineField({
      name: 'inArchive',
      title: 'Show in the archive',
      type: 'boolean',
      initialValue: true,
      description: 'Untick to keep this photo in its story but out of the /archive/ wall.',
    }),
  ],
  preview: {
    select: { title: 'alt', subtitle: 'caption', media: 'asset' },
    prepare: ({ title, subtitle, media }) => ({
      title: title || 'Photo (no alt text yet)',
      subtitle,
      media,
    }),
  },
});
