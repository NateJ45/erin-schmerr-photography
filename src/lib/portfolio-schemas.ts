// scaffold-file: stories
// Safe to edit by hand
// JSON-LD for one story (the business and the photographer live in
// src/lib/site-graph.ts, linked by @id, and the starter's src/lib/schemas.ts
// covers breadcrumbs and the rest).
//
//   storySchema(): one story as a CreativeWork: its photos as ImageObjects
//   (each credited to her, with a copyright line), the date and place, the
//   photographer as creator and every credited collaborator as a contributor
//   with their role.
//
// Only real image files are listed (a placeholder photo has no asset), so
// nothing here points Google at a stand-in.
import { site } from '@/data/site';
import { urlFor } from '@/lib/sanity';
import { realText } from '@/lib/page-meta';
import { BUSINESS_ID, PERSON_ID, PHOTOGRAPHER } from '@/lib/site-graph';
import type { PortfolioPhoto } from '@/lib/portfolio';
import type { Story } from '@/lib/storyQueries';

function photoUrl(photo: PortfolioPhoto | null | undefined): string | null {
  if (!photo?.asset) return null;
  try {
    return urlFor(photo).width(1600).quality(80).auto('format').url();
  } catch {
    return null;
  }
}

const CREATOR = { '@type': 'Person', '@id': PERSON_ID, name: PHOTOGRAPHER.name };

/** One photograph as an ImageObject, credited to her. Null for a photo with no file. */
export function photoImageObject(
  photo: PortfolioPhoto | null | undefined,
  year: number,
): Record<string, unknown> | null {
  const url = photoUrl(photo);
  if (!url) return null;
  const alt = realText(photo?.alt);
  const caption = realText(photo?.caption);
  const dims = photo?.asset?.metadata?.dimensions;
  return {
    '@type': 'ImageObject',
    contentUrl: url,
    url,
    ...(alt ? { name: alt } : {}),
    ...(caption ? { caption } : alt ? { caption: alt } : {}),
    ...(dims?.width && dims?.height ? { width: dims.width, height: dims.height } : {}),
    creator: CREATOR,
    copyrightHolder: CREATOR,
    creditText: PHOTOGRAPHER.name,
    copyrightNotice: `© ${year} ${PHOTOGRAPHER.name}`,
    copyrightYear: year,
  };
}

export function storySchema(story: Story): string {
  const year = Number((story.date ?? '').slice(0, 4)) || new Date().getFullYear();
  const seen = new Set<string>();
  const images = [story.cover, ...(story.photos ?? [])]
    .map((p) => photoImageObject(p, year))
    .filter((img): img is Record<string, unknown> => {
      if (!img) return false;
      const u = String(img.contentUrl);
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  const contributors = (story.credits ?? [])
    .filter((c) => c?.name)
    .map((c) => ({
      '@type': 'Person',
      name: c.name,
      ...(c.role ? { description: c.role } : {}),
      ...(c.url ? { url: c.url } : {}),
    }));
  const dek = realText(story.dek);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${site.url}/stories/${story.slug}/#story`,
    name: story.title,
    url: `${site.url}/stories/${story.slug}/`,
    ...(dek ? { description: dek } : {}),
    ...(story.date ? { dateCreated: story.date } : {}),
    ...(story.location ? { locationCreated: { '@type': 'Place', name: story.location } } : {}),
    ...(images.length ? { image: images, thumbnailUrl: images[0].contentUrl } : {}),
    creator: CREATOR,
    copyrightHolder: CREATOR,
    ...(contributors.length ? { contributor: contributors } : {}),
    publisher: { '@id': BUSINESS_ID },
  });
}
