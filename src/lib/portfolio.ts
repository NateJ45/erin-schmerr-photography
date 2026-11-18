// Safe to edit by hand
// =============================================================================
// portfolio.ts - the pure half of the portfolio (stories, archive, press)
// =============================================================================
// Shared by the stories and press capabilities, so it carries no scaffold
// marker: whichever one a fork removes, the other still needs the photo shape,
// the GROQ projection and the EXIF line. Pure on purpose (no Astro, no Sanity
// client) so portfolio.test.ts can run it under node --test.
//
// PLACEHOLDERS. CI and a fresh clone build with no Sanity data, and every
// portfolio route must still render. `placeholderPhoto()` makes a photo with
// no asset: FocusImage.astro draws it as a warm tonal gradient with a visible
// "Placeholder" label, so it can never pass for a real photograph.
// =============================================================================

/** A photo after PHOTO_PROJECTION, or a placeholder (no asset, a tone instead). */
export interface PortfolioPhoto {
  _key?: string;
  alt?: string;
  caption?: string | null;
  inArchive?: boolean | null;
  hotspot?: { x?: number; y?: number; height?: number; width?: number } | null;
  crop?: { top?: number; bottom?: number; left?: number; right?: number } | null;
  asset?: {
    _id?: string;
    url?: string;
    metadata?: {
      lqip?: string | null;
      dimensions?: { width?: number; height?: number; aspectRatio?: number } | null;
    } | null;
  } | null;
  /** Camera settings, read from the file's EXIF at query time (never typed by an editor). */
  exif?: PhotoExif | null;
  /** Placeholder only: which tonal gradient to draw, and its shape. */
  placeholder?: { tone: PlaceholderTone; ratio: PlaceholderRatio };
}

export interface PhotoExif {
  camera?: string | null;
  lens?: string | null;
  aperture?: number | null;
  shutter?: number | null;
  iso?: number | null;
  focalLength?: number | null;
}

export type PlaceholderTone = 'paper' | 'dusk' | 'ink' | 'sand';
export type PlaceholderRatio = 'portrait' | 'landscape';

/**
 * The GROQ projection for one photo. The camera fields come from the asset's
 * own metadata (rule 15): `exif` holds the exposure, `image` (the TIFF block)
 * the camera body. Both are extracted because photo.ts asks for them.
 */
export const PHOTO_PROJECTION = `{
  _key, alt, caption, inArchive, hotspot, crop,
  asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } },
  "exif": {
    "camera": coalesce(asset->metadata.image.Model, asset->metadata.exif.Model),
    "lens": asset->metadata.exif.LensModel,
    "aperture": asset->metadata.exif.FNumber,
    "shutter": asset->metadata.exif.ExposureTime,
    "iso": coalesce(asset->metadata.exif.ISO, asset->metadata.exif.ISOSpeedRatings),
    "focalLength": asset->metadata.exif.FocalLength
  }
}`;

/** "1/250s" for fast shutters, "2s" or "0.5s" for slow ones. */
export function formatShutter(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || !(seconds > 0)) return '';
  if (seconds >= 0.3) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

/** The one-line camera note under a photo, or '' when the file carried no EXIF. */
export function formatExif(exif: PhotoExif | null | undefined): string {
  if (!exif) return '';
  const parts = [
    exif.camera?.trim(),
    exif.lens?.trim(),
    typeof exif.focalLength === 'number' && exif.focalLength > 0
      ? `${Math.round(exif.focalLength)}mm`
      : '',
    typeof exif.aperture === 'number' && exif.aperture > 0
      ? `f/${Number(exif.aperture.toFixed(1))}`
      : '',
    formatShutter(exif.shutter),
    typeof exif.iso === 'number' && exif.iso > 0 ? `ISO ${Math.round(exif.iso)}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

const TONES: PlaceholderTone[] = ['paper', 'dusk', 'sand', 'ink'];

/** A placeholder photo. `n` picks the tone and alternates portrait and landscape. */
export function placeholderPhoto(n: number, alt = 'Placeholder photo'): PortfolioPhoto {
  return {
    _key: `placeholder-${n}`,
    alt,
    caption: null,
    inArchive: true,
    placeholder: {
      tone: TONES[n % TONES.length],
      ratio: n % 3 === 1 ? 'landscape' : 'portrait',
    },
  };
}

/** Width over height for a photo: the asset's own, else the placeholder's shape. */
export function photoRatio(photo: PortfolioPhoto | null | undefined): number {
  const d = photo?.asset?.metadata?.dimensions;
  if (d?.width && d?.height) return d.width / d.height;
  const fromId = photo?.asset?._id?.match(/-(\d+)x(\d+)-[a-z0-9]+$/i);
  if (fromId) return Number(fromId[1]) / Number(fromId[2]);
  return photo?.placeholder?.ratio === 'landscape' ? 3 / 2 : 4 / 5;
}

/** The year of a YYYY-MM-DD date, or null. */
export function yearOf(date: string | null | undefined): number | null {
  const m = typeof date === 'string' ? date.match(/^(\d{4})/) : null;
  return m ? Number(m[1]) : null;
}

/** "March 2026" from a YYYY-MM-DD date, or ''. Read on the calendar day, not UTC midnight. */
export function formatMonthYear(date: string | null | undefined): string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Group items by the year of their date, newest year first; undated last. */
export function groupByYear<T extends { date?: string | null }>(
  items: T[],
): { year: number | null; items: T[] }[] {
  const groups = new Map<number | null, T[]>();
  for (const item of items) {
    const y = yearOf(item.date);
    groups.set(y, [...(groups.get(y) ?? []), item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b - a))
    .map(([year, list]) => ({ year, items: list }));
}

/** A collaborator's link: their website, else their Instagram, else none. */
export function collaboratorHref(c: {
  url?: string | null;
  instagram?: string | null;
}): string | null {
  if (c.url) return c.url;
  const handle = c.instagram?.replace(/^@/, '').trim();
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

/** One row of a story's photo sequence (/stories/<slug>/). */
export type SequenceRow<T> =
  | { kind: 'wide'; photos: [T] }
  | { kind: 'pair'; photos: [T, T] }
  | { kind: 'single'; photos: [T]; align: 'start' | 'end' };

/**
 * Lays a story's photos out as an editorial sequence instead of one column of
 * same-width frames: a landscape photo runs wide, two portraits in a row sit
 * side by side as a spread, and a portrait on its own is set off to one side,
 * alternating, so the page has a rhythm whatever order the photos come in.
 */
export function storySequence<T extends PortfolioPhoto>(photos: T[]): SequenceRow<T>[] {
  const rows: SequenceRow<T>[] = [];
  let singles = 0;
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (photoRatio(photo) >= 1) {
      rows.push({ kind: 'wide', photos: [photo] });
      continue;
    }
    const next = photos[i + 1];
    if (next && photoRatio(next) < 1) {
      rows.push({ kind: 'pair', photos: [photo, next] });
      i++;
      continue;
    }
    rows.push({ kind: 'single', photos: [photo], align: singles % 2 === 0 ? 'start' : 'end' });
    singles++;
  }
  return rows;
}

/**
 * The frames of a story's film (src/pages/stories/[slug].astro): the cover
 * first, then the photos in order. A photo that is the cover again (the same
 * asset) is not shown twice. Placeholder photos have no asset and all stay.
 */
export function storyFrames<T extends PortfolioPhoto>(
  cover: T | null | undefined,
  photos: T[] | null | undefined,
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const photo of [cover, ...(photos ?? [])]) {
    if (!photo) continue;
    const id = photo.asset?._id;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(photo);
  }
  return out;
}

/**
 * The seeded placeholder documents (ids starting "placeholder-", from
 * scripts/seed-portfolio.mjs) step aside as soon as one real document of the
 * same type exists, so real work never shares a list with "Placeholder story
 * one". With only placeholders, they all stay. Nothing is deleted: retiring
 * the seeded documents is a backup-then-delete script (rule 16).
 */
export function withoutSeedPlaceholders<T extends { _id?: string | null }>(rows: T[]): T[] {
  const isSeed = (r: T) => (r._id ?? '').replace(/^drafts./, '').startsWith('placeholder-');
  return rows.some((r) => !isSeed(r)) ? rows.filter((r) => !isSeed(r)) : rows;
}

/**
 * The cover hero's headline split around its inline portrait: the words up to
 * and including word number `after`, and the rest. Spaces stay with the words,
 * so the two halves join back into the headline. Stega markers sit at the end
 * of an encoded string, so they ride along with the second half untouched.
 */
export function splitAfterWord(text: string, after: number): [string, string] {
  const parts = text.split(/(\s+)/);
  // parts alternates word, space, word, ...: word n ends at index 2n - 2.
  const cut = Math.max(1, Math.floor(after)) * 2 - 1;
  if (cut >= parts.length) return [text, ''];
  return [parts.slice(0, cut).join(''), parts.slice(cut + 1).join('')];
}

/**
 * The cast of a story for "How this was made": the credited names, without a
 * venue that is already named as the place (a story set at the American Sign
 * Museum credits the museum too). Derived from the credits (rule 15).
 */
export function storyCast(
  credits: { name?: string | null; role?: string | null }[] | null | undefined,
  location: string | null | undefined,
): string[] {
  const place = (location ?? '').toLowerCase();
  const names = (credits ?? [])
    .map((c) => c?.name?.trim() ?? '')
    .filter((name) => name && !(place && place.includes(name.toLowerCase())));
  return [...new Set(names)];
}

export interface ProofItem {
  kind: 'press' | 'quote';
  text: string;
  credit?: string;
}

/**
 * The proof strip's line: each press feature once (the magazine, and what ran
 * when the issue is named), with the quotes spread evenly between them, so two
 * quotes never sit side by side while there are features to part them.
 */
export function proofItems(
  publications: { magazine?: string | null; issue?: string | null }[],
  quotes: { text?: string | null; credit?: string | null }[],
): ProofItem[] {
  const seen = new Set<string>();
  const press: ProofItem[] = [];
  for (const p of publications) {
    const magazine = p.magazine?.trim();
    if (!magazine) continue;
    const issue = p.issue?.trim();
    const key = `${magazine}|${issue ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    press.push({ kind: 'press', text: magazine, credit: issue || undefined });
  }
  const said: ProofItem[] = quotes
    .filter((q) => q?.text?.trim())
    .map((q) => ({ kind: 'quote', text: q.text!.trim(), credit: q.credit?.trim() || undefined }));
  if (said.length === 0) return press;
  const out: ProofItem[] = [];
  const gap = press.length / said.length;
  let next = 0;
  said.forEach((quote, i) => {
    const upTo = Math.round(gap * (i + 1));
    while (next < upTo && next < press.length) out.push(press[next++]);
    out.push(quote);
  });
  while (next < press.length) out.push(press[next++]);
  return out;
}
