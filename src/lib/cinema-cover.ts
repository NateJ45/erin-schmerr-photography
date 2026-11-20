// scaffold-file: stories
// Safe to edit by hand
// The home Cinema's COVER frames (CoverHero.astro, DESIGN.md "Cover frame"):
// pure helpers, no I/O.
//
// - which cut-out a story has (Sanity's `coverCutout`, or a local one in
//   `astro dev`), and whether it is still current for the cover;
// - the masthead's lines and the number its size is worked out from;
// - the CSS custom properties that let the stylesheet place the masthead
//   behind the head with no JavaScript (cover-math on the photo's own ratio and
//   crop point, so it lands right at every screen size and never moves after
//   first paint).
import { cinemaPlain, photoRatio, type PortfolioPhoto } from './portfolio';
import type { CoverCutout, CutoutSubject, Story } from './storyQueries';

/** A cut-out ready to draw: a Sanity image source, or a plain URL (dev only). */
export interface UsableCutout {
  /** For SanityImage: the cut-out asset with the COVER's crop and hotspot, so both register. */
  source?: { asset: NonNullable<CoverCutout['asset']>; crop?: unknown; hotspot?: unknown };
  /** A local file served by `astro dev` (src/lib/local-cutouts.ts). */
  url?: string;
  subject: CutoutSubject;
}

interface LocalCutout {
  url: string;
  cutoutOf: string;
  subject: CutoutSubject;
}

const isSubject = (s: unknown): s is CutoutSubject =>
  !!s &&
  typeof s === 'object' &&
  ['headTop', 'headBottom', 'headX'].every(
    (k) => typeof (s as Record<string, unknown>)[k] === 'number',
  );

/**
 * The story's cut-out when it is usable: it exists, it carries measurements,
 * and it was made from the cover the story has NOW (a stale one is ignored, so
 * a changed cover never shows someone else's silhouette over it).
 */
export function usableCutout(
  story: Pick<Story, '_id' | 'cover' | 'coverCutout'>,
  local?: Record<string, LocalCutout> | null,
): UsableCutout | null {
  const coverId = story.cover?.asset?._id;
  if (!coverId) return null;
  const c = story.coverCutout;
  if (c?.asset && c.cutoutOf === coverId && isSubject(c.subject)) {
    const cover = story.cover as PortfolioPhoto & { crop?: unknown; hotspot?: unknown };
    return {
      source: { asset: c.asset, crop: cover.crop, hotspot: cover.hotspot },
      subject: c.subject,
    };
  }
  const l = local?.[story._id];
  if (l && l.cutoutOf === coverId && isSubject(l.subject))
    return { url: l.url, subject: l.subject };
  return null;
}

/**
 * The masthead's lines: the title as typed, on one line when it is short
 * (10 characters or fewer) and otherwise split at the word break that makes
 * the two lines most even. `chars` is the longest line's length, which the
 * stylesheet turns into a size that fits the screen's width.
 */
export function mastheadLines(title: string | null | undefined): {
  lines: string[];
  chars: number;
} {
  const plain = cinemaPlain(title).replace(/\s+/g, ' ').trim();
  const words = plain.split(' ').filter(Boolean);
  if (plain.length <= 10 || words.length < 2) return { lines: [plain], chars: plain.length || 1 };
  let best = [plain];
  let bestLong = plain.length;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const long = Math.max(a.length, b.length);
    if (long < bestLong) {
      best = [a, b];
      bestLong = long;
    }
  }
  return { lines: best, chars: bestLong };
}

/**
 * A masthead line as runs: on the LAST line the last word is set in italic
 * (the cinema's one italic word, like every other title on the home page).
 */
export function mastheadRuns(line: string, last: boolean): { text: string; italic: boolean }[] {
  if (!last) return [{ text: line, italic: false }];
  const at = line.lastIndexOf(' ');
  if (at < 0) return [{ text: line, italic: true }];
  return [
    { text: line.slice(0, at + 1), italic: false },
    { text: line.slice(at + 1), italic: true },
  ];
}

/** "x% y%" fractions of the cover's hotspot (the photo's object-position), default centre. */
function hotspotOf(photo: Story['cover']): { x: number; y: number } {
  const hs = (photo as { hotspot?: { x?: number; y?: number } } | null | undefined)?.hotspot;
  return {
    x: typeof hs?.x === 'number' ? hs.x : 0.5,
    y: typeof hs?.y === 'number' ? hs.y : 0.5,
  };
}

const n = (v: number) => Number(v.toFixed(4));

/**
 * The cover frame's custom properties: the photo's ratio and crop point, and,
 * with a cut-out, where the head is (fractions of the image). The stylesheet
 * (src/styles/cinema-cover.css) works out the head's place on screen from
 * these with the same arithmetic as object-fit, at any size.
 */
export function coverVars(
  story: Pick<Story, 'cover'>,
  cutout: UsableCutout | null,
  masthead: { chars: number; lines: string[] },
): string {
  const { x, y } = hotspotOf(story.cover);
  const vars: [string, string | number][] = [
    ['--ar', n(photoRatio(story.cover))],
    ['--px', n(x)],
    ['--py', n(y)],
    ['--mast-chars', masthead.chars],
    ['--mast-lines', masthead.lines.length],
  ];
  if (cutout) {
    const s = cutout.subject;
    vars.push(
      ['--head-top', n(s.headTop)],
      ['--head-bottom', n(s.headBottom)],
      ['--head-x', n(s.headX)],
    );
  }
  return vars.map(([k, v]) => `${k}: ${v}`).join('; ');
}

/** The cover lines' "Starring": the first two credited names. */
export function starring(story: Pick<Story, 'credits'>): string[] {
  return (story.credits ?? [])
    .map((c) => c.name?.trim())
    .filter((s): s is string => !!s)
    .slice(0, 2);
}
