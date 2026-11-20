// Safe to edit by hand
// =============================================================================
// The chrome's data: the phone menu's photo frame and the story credits
// (DESIGN.md "Components"). The folder keeps the darkroom name from 2026-11-18.
// =============================================================================
// Everything here is DERIVED from content the site already shows (rule 15):
//   - covers: the featured story covers, for the phone menu's photo frame. A page
//     whose picture is already used (a press tear sheet for /press/, a story cover
//     for /stories/) gets that picture.
//   - credits: the old end-credits footer's lists (the footer stopped drawing them
//     on 2026-11-20; kept for reuse). "Starring" is every person credited on
//     a story, "On location at" the stories' places and the venues credited on
//     them, "As published in" the press magazines.
//
// The header and footer render on EVERY page, so the reads are memoised for the
// whole build (one fetch, not one per page) and every image URL is built with
// urlFor() rather than <SanityImage>, which would pull its module into the
// always-loaded chunk.
//
// Stories and press are removable capabilities, so their reads are marked: a
// `npm run scaffold -- --remove stories` leaves the arrays empty and the chrome
// draws tonal placeholder frames and leaves those credit lines out.
// =============================================================================

import { urlFor } from '@/lib/sanity';
import { collaboratorHref, type PortfolioPhoto } from '@/lib/portfolio';
import { getStories } from '@/lib/storyQueries'; // scaffold: stories
import { getPublications, magazineNames } from '@/lib/pressQueries'; // scaffold: press

/** One picture for the chrome: a ready URL pair, or a tone for a placeholder. */
export interface ChromePrint {
  src?: string;
  srcset?: string;
  tone: 'paper' | 'dusk' | 'ink' | 'sand';
}

/** One credit in the footer: a name, linked when the data has a page for it. */
export interface ChromeCredit {
  name: string;
  href?: string | null;
  external?: boolean;
}

export interface DarkroomData {
  /** Featured story covers, in the Studio's order (tone frames when there are none). */
  covers: ChromePrint[];
  /** A picture for a page path, when the site already shows one for it. */
  pagePrints: Record<string, ChromePrint>;
  starring: ChromeCredit[];
  locations: ChromeCredit[];
  publishedIn: ChromeCredit[];
  /** Every story's cover by slug, then the featured ones in order (for nameLetterPrints). */
  coversBySlug: Map<string, PortfolioPhoto>;
  featuredCovers: PortfolioPhoto[];
}

// Local shapes, so this file still type-checks once a capability is removed.
interface StoryLike {
  slug: string;
  featured?: boolean | null;
  location?: string | null;
  cover?: PortfolioPhoto | null;
  photos?: PortfolioPhoto[] | null;
  credits?:
    | {
        role?: string | null;
        name?: string | null;
        url?: string | null;
        instagram?: string | null;
      }[]
    | null;
}
interface PublicationLike {
  magazine: string;
  url?: string | null;
  tearSheet?: PortfolioPhoto | null;
}

const TONES: ChromePrint['tone'][] = ['dusk', 'sand', 'ink', 'paper'];
/** Credited roles that are a place rather than a person. */
const PLACE_ROLES = /^(location|set|venue)$/i;
/** The longest a credit line runs before it stops reading as a line. */
const MAX_CREDITS = 12;

/** A small print cropped on the photo's hotspot, 1x and 2x. */
function print(photo: PortfolioPhoto | null | undefined, w: number, h: number, i = 0): ChromePrint {
  const tone = photo?.placeholder?.tone ?? TONES[i % TONES.length];
  if (!photo?.asset?._id && !photo?.asset?.url) return { tone };
  const at = (scale: number) =>
    urlFor(photo as never)
      .width(w * scale)
      .height(h * scale)
      .fit('crop')
      .quality(70)
      .auto('format')
      .url();
  return { src: at(1), srcset: `${at(1)} 1x, ${at(2)} 2x`, tone };
}

function uniqueBy<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const k = key(row).toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function load(): Promise<DarkroomData> {
  let stories: StoryLike[] = [];
  let publications: PublicationLike[] = [];
  let magazines: string[] = [];
  // scaffold: stories
  stories = ((await getStories().catch(() => [])) ?? []) as StoryLike[];
  // scaffold:end
  // scaffold: press
  publications = ((await getPublications().catch(() => [])) ?? []) as PublicationLike[];
  magazines = magazineNames(publications as never);
  // scaffold:end

  const featured = stories.filter((s) => s.featured);
  const shown = (featured.length ? featured : stories).slice(0, 8);
  const covers: ChromePrint[] = shown.length
    ? shown.map((s, i) => print(s.cover, 320, 400, i))
    : TONES.map((tone) => ({ tone }));

  // A page's own picture where the site already shows one; the rest cycle the covers.
  const pagePrints: Record<string, ChromePrint> = {};
  if (shown[0]) pagePrints['/stories/'] = covers[0];
  const archivePhoto = shown[1]?.photos?.[0] ?? shown[1]?.cover;
  if (archivePhoto) pagePrints['/archive/'] = print(archivePhoto, 320, 400, 1);
  const sheet = publications.find((p) => p.tearSheet?.asset)?.tearSheet;
  if (sheet) pagePrints['/press/'] = print(sheet, 320, 400, 2);

  // End credits. People first, most credited first, ties in story order.
  const credits = stories.flatMap((s) => s.credits ?? []);
  const people = credits.filter((c) => c.name && !PLACE_ROLES.test(c.role ?? ''));
  const counts = new Map<string, number>();
  for (const c of people) counts.set(c.name!, (counts.get(c.name!) ?? 0) + 1);
  const starring = uniqueBy(people, (c) => c.name ?? '')
    .map((c, order) => ({ c, order, n: counts.get(c.name!) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.order - b.order)
    .slice(0, MAX_CREDITS)
    .map(({ c }) => {
      const href = collaboratorHref(c);
      return { name: c.name!, href, external: !!href };
    });

  const storyPlaces: ChromeCredit[] = stories
    .filter((s) => s.location?.trim())
    .map((s) => ({ name: s.location!.trim(), href: `/stories/${s.slug}/` }));
  const venues: ChromeCredit[] = credits
    .filter((c) => c.name && PLACE_ROLES.test(c.role ?? ''))
    .filter((c) => !storyPlaces.some((p) => p.name.toLowerCase().includes(c.name!.toLowerCase())))
    .map((c) => {
      const href = collaboratorHref(c);
      return { name: c.name!, href, external: !!href };
    });
  const locations = uniqueBy([...storyPlaces, ...venues], (c) => c.name).slice(0, MAX_CREDITS);

  const publishedIn: ChromeCredit[] = magazines.slice(0, MAX_CREDITS).map((name) => {
    const url = publications.find((p) => p.magazine?.trim() === name && p.url)?.url;
    return { name, href: url ?? null, external: !!url };
  });

  const coversBySlug = new Map<string, PortfolioPhoto>();
  for (const s of stories) if (s.cover?.asset) coversBySlug.set(s.slug, s.cover);
  const featuredCovers = shown.flatMap((s) => (s.cover?.asset ? [s.cover] : []));

  return {
    covers,
    pagePrints,
    starring,
    locations,
    publishedIn,
    coversBySlug,
    featuredCovers,
  };
}

// ---- The footer name's letters ------------------------------------------------------------
// Each letter of the footer's giant "Tate" holds ONE photograph, cropped to the rich, dark,
// detailed part of it (a face, a costume, neon, lanterns), never to sky or a pale wall: a
// letter filled with a pale patch reads as a washed-out blob on the wine field, and one filled
// with the same wine (a magenta wall) disappears. Picked by eye on 2026-11-20 from the
// Instagram stand-ins (`ig-*`); re-pick when her originals replace them.
//
// `rect` is the crop in fractions of the source photo: left, top and width. The height comes
// from the letter's own shape (Footer.astro's NAME_TILES), so the crop's top-left and width are
// the only things picked here. A slug that is not in the dataset (CI's placeholder snapshot,
// a fork) falls back to the featured covers in order, centred.
interface LetterPick {
  slug: string;
  rect: { left: number; top: number; width: number };
}
const NAME_LETTER_PICKS: LetterPick[] = [
  // T: the glowing lanterns across the bar, the stack of jack-o'-lanterns down the stem.
  { slug: 'pink-halloween', rect: { left: 0.17, top: 0.03, width: 0.6 } },
  // a: Ken's face, eyes to chin.
  { slug: 'just-ken', rect: { left: 0.19, top: 0.16, width: 0.62 } },
  // t: the patterned outfit against the painted maze, head to boots.
  { slug: 'graffiti-alley', rect: { left: 0.34, top: 0.14, width: 0.5 } },
  // e: blue neon, the marquee bulbs and her profile in red light.
  { slug: 'american-sign-museum', rect: { left: 0.25, top: 0.04, width: 0.7 } },
];

/** One letter's tile: its width as a fraction of the name, and its width / height. */
export interface NameTile {
  width: number;
  aspect: number;
}

/**
 * One cropped print per letter of the footer name, sized to that letter's tile. `drift` is
 * how much taller than the tile the picture is drawn (the scrubbed drift moves it up through
 * the letter), so the crop is that much taller too. Empty when there are no real photos.
 */
export async function nameLetterPrints(
  tiles: NameTile[],
  drift: number,
  nameWidth = 1240,
): Promise<ChromePrint[]> {
  const { coversBySlug, featuredCovers } = await getDarkroomData();
  if (featuredCovers.length === 0 && coversBySlug.size === 0) return [];
  const fallback = featuredCovers.length > 0 ? featuredCovers : [...coversBySlug.values()];
  return tiles.map((tile, i) => {
    const pick = NAME_LETTER_PICKS[i];
    const named = pick ? coversBySlug.get(pick.slug) : undefined;
    const photo = named ?? fallback[i % fallback.length];
    const aspect = tile.aspect / drift;
    const w = Math.round(nameWidth * tile.width);
    const h = Math.round(w / aspect);
    const dims = photo?.asset?.metadata?.dimensions;
    const at = (scale: number) => {
      let img = urlFor(photo as never);
      if (named && pick && dims?.width && dims?.height) {
        // The picked crop in source pixels, its height from the tile's shape, kept inside.
        const left = Math.round(pick.rect.left * dims.width);
        const width = Math.round(Math.min(pick.rect.width, 1 - pick.rect.left) * dims.width);
        const height = Math.min(Math.round(width / aspect), dims.height);
        const top = Math.min(Math.round(pick.rect.top * dims.height), dims.height - height);
        img = img.rect(left, Math.max(0, top), width, height);
      }
      return img
        .width(w * scale)
        .height(h * scale)
        .fit('crop')
        .quality(70)
        .auto('format')
        .url();
    };
    return { src: at(1), srcset: `${at(1)} 1x, ${at(2)} 2x`, tone: TONES[i % TONES.length] };
  });
}

let cached: Promise<DarkroomData> | undefined;

/** The chrome's data, read once per build. */
export function getDarkroomData(): Promise<DarkroomData> {
  cached ??= load();
  return cached;
}
