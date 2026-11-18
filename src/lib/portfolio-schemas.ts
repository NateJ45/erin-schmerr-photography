// scaffold-file: stories
// Safe to edit by hand
// JSON-LD for the portfolio (the starter's src/lib/schemas.ts covers the
// business, breadcrumbs and the rest). Two shapes:
//
//   - personSchema(): the photographer, on About, tied to the site-wide
//     LocalBusiness by its @id so search engines read one entity, not two.
//   - storySchema(): one story as a CreativeWork: its cover and photos, the
//     date and place, the photographer as creator and every credited
//     collaborator as a contributor with their role.
//
// Only real image files are listed (a placeholder photo has no asset), so
// nothing here points Google at a stand-in.
import { site } from '@/data/site';
import { urlFor } from '@/lib/sanity';
import type { PortfolioPhoto } from '@/lib/portfolio';
import type { Story } from '@/lib/storyQueries';

/** The photographer. Her name stays the same whatever the business is called. */
export const PHOTOGRAPHER = {
  name: 'Erin Schmerr',
  jobTitle: 'Fine-art portrait photographer',
  homeLocation: 'West Chester, Ohio',
};

const PERSON_ID = `${site.url}/#photographer`;
const BUSINESS_ID = `${site.url}/#business`;

function photoUrl(photo: PortfolioPhoto | null | undefined): string | null {
  if (!photo?.asset) return null;
  try {
    return urlFor(photo).width(1600).quality(80).auto('format').url();
  } catch {
    return null;
  }
}

export function personSchema(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PHOTOGRAPHER.name,
    jobTitle: PHOTOGRAPHER.jobTitle,
    homeLocation: { '@type': 'Place', name: PHOTOGRAPHER.homeLocation },
    url: `${site.url}/about/`,
    worksFor: { '@id': BUSINESS_ID },
  });
}

export function storySchema(story: Story): string {
  const images = [story.cover, ...(story.photos ?? [])]
    .map(photoUrl)
    .filter((u): u is string => Boolean(u));
  const contributors = (story.credits ?? [])
    .filter((c) => c?.name)
    .map((c) => ({
      '@type': 'Person',
      name: c.name,
      ...(c.role ? { description: c.role } : {}),
      ...(c.url ? { url: c.url } : {}),
    }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${site.url}/stories/${story.slug}/#story`,
    name: story.title,
    url: `${site.url}/stories/${story.slug}/`,
    ...(story.dek ? { description: story.dek } : {}),
    ...(story.date ? { dateCreated: story.date } : {}),
    ...(story.location ? { locationCreated: { '@type': 'Place', name: story.location } } : {}),
    ...(images.length ? { image: images } : {}),
    creator: { '@id': PERSON_ID, '@type': 'Person', name: PHOTOGRAPHER.name },
    ...(contributors.length ? { contributor: contributors } : {}),
    publisher: { '@id': BUSINESS_ID },
  });
}
