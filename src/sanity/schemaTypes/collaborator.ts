// scaffold-file: stories
// Safe to edit by hand
// A person credited on a story: a model, a makeup artist, a stylist. Typed once
// here and referenced from each story's credits, so a name or link is fixed in
// one place. `defaultRole` fills a credit whose own role is left empty.

import { defineType, defineField } from 'sanity';

export const collaborator = defineType({
  name: 'collaborator',
  title: 'Collaborator',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'As they like to be credited.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'defaultRole',
      title: 'Usual role',
      type: 'string',
      description:
        'For example "Makeup" or "Styling". Used on a story credit that does not name a role of its own.',
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      description: 'Optional. Their name links here in story credits.',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram handle',
      type: 'string',
      description: 'Optional, without the @. Used for the link when there is no website.',
      validation: (Rule) =>
        Rule.regex(/^[A-Za-z0-9._]{1,30}$/, { name: 'handle' }).error(
          'Just the handle: letters, numbers, dots and underscores, no @ or link.',
        ),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'defaultRole' },
  },
  orderings: [{ title: 'Name', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] }],
});
