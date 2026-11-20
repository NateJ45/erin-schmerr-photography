// scaffold-file: stories
// Safe to edit by hand
// =============================================================================
// Stories, credits and the archive: every read goes through sanityFetch().
// =============================================================================
// Co-located here (not in queries.ts) so the stories capability is one set of
// files a scaffold removal deletes whole. The press link on a story is the only
// cross-capability piece, and it carries the press marker, so removing press
// leaves a valid query behind.
//
// NO-DATA FALLBACK. CI and a fresh clone build with no Sanity project, and an
// empty dataset returns []; either way the routes render PLACEHOLDER_STORIES,
// which say "placeholder" in their own words (rule: a placeholder must look
// like one). The moment one real story is published, the placeholders go.
// =============================================================================

import { sanityFetch } from './sanity';
import {
  PHOTO_PROJECTION,
  placeholderPhoto,
  withoutSeedPlaceholders,
  type PortfolioPhoto,
} from './portfolio';

export interface StoryCredit {
  _key: string;
  role?: string | null;
  name?: string | null;
  url?: string | null;
  instagram?: string | null;
}

export interface StoryPublication {
  magazine?: string | null;
  issue?: string | null;
  date?: string | null;
  url?: string | null;
}

/** Where the person is in a cut-out, as fractions (0-1) of the image. */
export interface CutoutSubject {
  top: number;
  bottom: number;
  left: number;
  right: number;
  headTop: number;
  headBottom: number;
  headX: number;
  coverage?: number;
}

export interface CoverCutout {
  /** The cover asset it was made from; a mismatch means the cover changed (stale). */
  cutoutOf?: string | null;
  subject?: CutoutSubject | null;
  asset?: {
    _id: string;
    url: string;
    metadata?: { dimensions?: { width: number; height: number; aspectRatio: number } };
  } | null;
}

export interface Story {
  _id: string;
  title: string;
  slug: string;
  dek?: string | null;
  date?: string | null;
  location?: string | null;
  /** The decade, book or film the shoot started from ("How this was made"). */
  startedFrom?: string | null;
  featured?: boolean | null;
  cover?: PortfolioPhoto | null;
  /** The person in the cover on a transparent ground (scripts/make-cutouts.mjs). */
  coverCutout?: CoverCutout | null;
  photos?: PortfolioPhoto[] | null;
  credits?: StoryCredit[] | null;
  publication?: StoryPublication | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: unknown;
  hideFromSearch?: boolean | null;
  /** True on the built-in placeholder stories only. */
  isPlaceholder?: boolean;
}

/** One photo in the archive, with the story it belongs to. */
export interface ArchivePhoto extends PortfolioPhoto {
  storyTitle: string;
  storySlug: string;
}

// A credit's role falls back to the person's usual role (derived, never retyped).
const STORY_PROJECTION = `{
  _id, title, "slug": slug.current, dek, date, location, startedFrom, featured,
  cover${PHOTO_PROJECTION},
  "coverCutout": coverCutout{
    cutoutOf, subject,
    asset->{ _id, url, metadata{ dimensions{ width, height, aspectRatio } } }
  },
  photos[]${PHOTO_PROJECTION},
  "credits": credits[defined(collaborator)]{
    _key,
    "role": coalesce(role, collaborator->defaultRole),
    "name": collaborator->name,
    "url": collaborator->url,
    "instagram": collaborator->instagram
  },
  // scaffold: press
  "publication": publication->{ magazine, issue, date, url },
  // scaffold:end
  seoTitle, seoDescription, seoImage, hideFromSearch
}`;

// The Studio's drag order first (orderable-document-list), then newest.
const STORY_ORDER = `order(orderRank asc, date desc)`;

// ---------------------------------------------------------------------------
// Placeholders (no Sanity data). Names read as placeholders on purpose.
// ---------------------------------------------------------------------------

const PLACEHOLDER_CREDITS: StoryCredit[] = [
  { _key: 'pc1', role: 'Model', name: 'Model name' },
  { _key: 'pc2', role: 'Makeup', name: 'Makeup artist name' },
  { _key: 'pc3', role: 'Hair', name: 'Hair stylist name' },
  { _key: 'pc4', role: 'Styling', name: 'Stylist name' },
  { _key: 'pc5', role: 'Assistant', name: 'Assistant name' },
  { _key: 'pc6', role: 'Retouching', name: 'Retoucher name' },
];

const ORDINALS = ['one', 'two', 'three', 'four'];

export const PLACEHOLDER_STORIES: Story[] = ORDINALS.map((word, i) => ({
  _id: `placeholder-story-${word}`,
  title: `Placeholder story ${word}`,
  slug: `placeholder-story-${word}`,
  dek: 'A short line about this story. Replace it in the Studio.',
  date: `2026-0${i + 2}-15`,
  location: 'Location name',
  featured: true,
  cover: placeholderPhoto(i * 5, `Placeholder cover for story ${word}`),
  photos: [1, 2, 3, 4].map((n) =>
    placeholderPhoto(i * 5 + n, `Placeholder photo ${n} of story ${word}`),
  ),
  credits: PLACEHOLDER_CREDITS.slice(0, 3 + (i % 4)),
  // scaffold: press
  publication:
    i === 0 ? { magazine: 'Magazine name', issue: 'Issue 00', date: '2026-03-01' } : null,
  // scaffold:end
  isPlaceholder: true,
}));

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Every story in the Studio's order, or the placeholders when there are none. */
export async function getStories(): Promise<Story[]> {
  const rows = await sanityFetch<Story>(
    `*[_type == "story" && defined(slug.current)] | ${STORY_ORDER} ${STORY_PROJECTION}`,
    {},
    [],
  );
  const real = withoutSeedPlaceholders(rows);
  return real.length ? real : PLACEHOLDER_STORIES;
}

/** The stories ticked Featured (all of them when none is), up to `limit`. */
export async function getFeaturedStories(limit = 6): Promise<Story[]> {
  const stories = await getStories();
  const featured = stories.filter((s) => s.featured);
  return (featured.length ? featured : stories).slice(0, Math.max(1, limit));
}

/**
 * Every photo kept in the archive (inArchive is true or unset), covers
 * included, each once, in story order. Derived from the stories, so the archive
 * can never list a photo its story no longer holds.
 */
export async function getArchivePhotos(): Promise<ArchivePhoto[]> {
  const stories = await getStories();
  const seen = new Set<string>();
  const out: ArchivePhoto[] = [];
  for (const s of stories) {
    for (const p of [s.cover, ...(s.photos ?? [])]) {
      if (!p || p.inArchive === false) continue;
      const id = p.asset?._id ?? `${s._id}:${p._key}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ ...p, storyTitle: s.title, storySlug: s.slug });
    }
  }
  return out;
}
