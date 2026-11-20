// scaffold-file: stories
// Safe to edit by hand
// The magazine pages' derived words and layouts (DESIGN.md "Stories contents",
// "Story page", "Press page"; 2026-11-20). Everything here is worked out from
// the story and publication documents at build time (rule 15): nothing is
// typed twice.
//
//   contentsLead()   the words before the colon on a /stories/ row: the
//                    magazine it ran in, else the decade its look comes from.
//   storyMasthead()  the name set as the masthead over a story's cover: the
//                    magazine, else the house name ("Tate").
//   mastheadSize()   a font size that keeps a masthead on one line at any
//                    width, from its letter count.
//   editorialRuns()  a story's photos laid out like a magazine feature: one
//                    full bleed, then a pair, then a single on paper, repeating.
//   gridSlot()       the /stories/ grid's five-step mixed-size pattern.
import { storyDecade, type PortfolioPhoto } from './portfolio.ts';

/** The words before the colon on a contents row. */
export function contentsLead(story: {
  publication?: { magazine?: string | null } | null;
  startedFrom?: string | null;
  title?: string | null;
  dek?: string | null;
  date?: string | null;
}): string {
  const magazine = story.publication?.magazine?.trim();
  if (magazine) return magazine;
  const decade = storyDecade(story);
  return decade === null ? 'Portrait' : `The ${decade}s`;
}

/** The masthead over a story's cover: the magazine it ran in, else the house name. */
export function storyMasthead(
  story: { publication?: { magazine?: string | null } | null },
  house: string,
): string {
  return story.publication?.magazine?.trim() || house;
}

/**
 * A CSS font size that keeps a masthead on one line: Bodoni Moda's capitals and
 * lower case average about 0.62em, so the width it needs is roughly letters x
 * 0.62em. Short names cap at `max`; long ones shrink with the viewport.
 */
export function mastheadSize(text: string, max = '13rem'): string {
  const letters = Math.max(4, [...text.trim()].length);
  const vw = Math.round((92 / (letters * 0.62)) * 100) / 100;
  return `min(${max}, ${vw}vw)`;
}

/** One run of a story's feature: a full-bleed plate, a pair, or a single on paper. */
export interface EditorialRun<T> {
  kind: 'bleed' | 'pair' | 'single';
  /** Each photo with its plate number (the cover is plate 1). */
  plates: { photo: T; no: number }[];
  /** Singles alternate sides so the page has a rhythm. */
  side?: 'start' | 'end';
}

/**
 * Lays out the photos after the cover as a feature: a pair, a single on paper,
 * a full bleed, repeating (the cover itself is the opening bleed, so the run
 * starts on the pair). A last pair with one photo becomes a single. Plates are
 * numbered from `firstNo` (2 when the cover is plate 1).
 */
export function editorialRuns<T extends PortfolioPhoto>(
  photos: T[],
  firstNo = 2,
): EditorialRun<T>[] {
  const order: EditorialRun<T>['kind'][] = ['pair', 'single', 'bleed'];
  const runs: EditorialRun<T>[] = [];
  let i = 0;
  let step = 0;
  let singles = 0;
  while (i < photos.length) {
    let kind = order[step % order.length];
    if (kind === 'pair' && i + 1 >= photos.length) kind = 'single';
    const take = kind === 'pair' ? 2 : 1;
    const plates = photos.slice(i, i + take).map((photo, k) => ({ photo, no: firstNo + i + k }));
    const run: EditorialRun<T> = { kind, plates };
    if (kind === 'single') {
      run.side = singles % 2 === 0 ? 'end' : 'start';
      singles++;
    }
    runs.push(run);
    i += take;
    step++;
  }
  return runs;
}

/** The /stories/ grid's slot for the item at `index` (0-based): five sizes, repeating. */
export function gridSlot(index: number): number {
  return ((index % 5) + 5) % 5;
}

/** A plate number as a magazine prints it: "02". */
export function plateNo(n: number): string {
  return String(n).padStart(2, '0');
}
