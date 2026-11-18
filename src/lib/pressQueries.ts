// scaffold-file: press
// Safe to edit by hand
// =============================================================================
// Publications: the press page, the Published in strip and the tear sheets.
// =============================================================================
// Co-located so the press capability is one set of files. Every read goes
// through sanityFetch(); with no Sanity data (CI, a fresh clone, an empty
// dataset) the callers get PLACEHOLDER_PUBLICATIONS, named as placeholders.
// =============================================================================

import { sanityFetch } from './sanity';
import { PHOTO_PROJECTION, placeholderPhoto, type PortfolioPhoto } from './portfolio';

export interface Publication {
  _id: string;
  magazine: string;
  issue?: string | null;
  date?: string | null;
  url?: string | null;
  excerpt?: string | null;
  tearSheet?: PortfolioPhoto | null;
  isPlaceholder?: boolean;
}

export const PLACEHOLDER_PUBLICATIONS: Publication[] = [
  {
    _id: 'placeholder-publication-one',
    magazine: 'Magazine name',
    issue: 'Issue 00',
    date: '2026-03-01',
    excerpt: 'A line or two from the piece goes here. Replace it in the Studio.',
    tearSheet: placeholderPhoto(0, 'Placeholder tear sheet, Magazine name, Issue 00'),
    isPlaceholder: true,
  },
  {
    _id: 'placeholder-publication-two',
    magazine: 'Second magazine name',
    issue: 'Issue 00',
    date: '2025-10-01',
    excerpt: 'A line or two from the piece goes here. Replace it in the Studio.',
    tearSheet: placeholderPhoto(2, 'Placeholder tear sheet, Second magazine name, Issue 00'),
    isPlaceholder: true,
  },
];

/** Every publication, newest first, or the placeholders when there are none. */
export async function getPublications(): Promise<Publication[]> {
  const rows = await sanityFetch<Publication>(
    `*[_type == "publication" && defined(magazine)] | order(date desc){
      _id, magazine, issue, date, url, excerpt,
      tearSheet${PHOTO_PROJECTION}
    }`,
    {},
    [],
  );
  return rows.length ? rows : PLACEHOLDER_PUBLICATIONS;
}

/** Each magazine name once, in order of its newest appearance. */
export function magazineNames(publications: Publication[]): string[] {
  return [...new Set(publications.map((p) => p.magazine?.trim()).filter(Boolean) as string[])];
}
