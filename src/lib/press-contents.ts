// scaffold-file: press
// Safe to edit by hand
// The About page's "As seen in" line (PressContents.astro), worked out from
// Publications. A pure file (type-only import) so node --test can check it.
import type { Publication } from './pressQueries';

/** One magazine in the line. */
export interface ContentsEntry {
  magazine: string;
  /** Its newest feature: the issue, the date and the tear sheet the hover card shows. */
  latest: Publication;
  /** How many features it has run. */
  count: number;
  /** Where its name links: that year on the press page (press.astro's ids). */
  href: string;
}

/**
 * Each magazine once, in order of its newest feature (the list arrives newest
 * first from getPublications), with that newest feature as the one to show.
 * Derived, never typed (rule 15).
 */
export function contentsEntries(publications: Publication[]): ContentsEntry[] {
  const byName = new Map<string, ContentsEntry>();
  for (const pub of publications) {
    const name = pub.magazine?.trim();
    if (!name) continue;
    const seen = byName.get(name);
    if (seen) {
      seen.count += 1;
      continue;
    }
    const year = pub.date?.slice(0, 4);
    byName.set(name, {
      magazine: name,
      latest: pub,
      count: 1,
      href: `/press/#press-${year && /^\d{4}$/.test(year) ? year : 'undated'}`,
    });
  }
  return [...byName.values()];
}
