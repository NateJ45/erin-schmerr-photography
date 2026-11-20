// Safe to edit by hand
// =============================================================================
// The jewel cadence (2026-11-20): which bands on a page are colour fields
// =============================================================================
// The site's palette has four jewel tones taken from Erin's photographs (wine,
// magenta, amber, forest; tokens in src/styles/globals.css, measured pairs in
// src/lib/surfaces.ts). This file decides, for one page's rows, which rows are
// drawn on a jewel and which one, so a page reads paper, colour, paper, colour.
//
// THE CONTRACT (CLAUDE.md rule 9 still holds: no colour field on any block)
//   - A row CAN be a jewel when it is one of the site's own blocks listed in
//     JEWEL_BLOCKS (the design says so), or a content block whose `look` is
//     Jewel (the editor asked for colour, src/lib/section-looks.ts).
//   - A row that can be a jewel IS one only when the row before it is not a
//     jewel and not a dark band, and the row after it is not a dark band. Two
//     colour fields never touch, so the page always alternates.
//   - The first row is never a jewel: every page opens on paper, under its
//     title or cover photograph.
//   - The jewels are dealt in JEWEL_ORDER, so a page of four colour fields
//     shows all four, and the order starts from a different jewel on each page
//     (seeded from the page's block types), so two pages read differently.
//
// SectionRenderer wraps a jewel row in `<div class="jewel surface-jewel-*">`,
// which re-points the page tokens for everything inside. Hand-built pages
// (press, guide, stories, booking) put the same classes on their own sections
// and take a jewel from `jewelAt()`. src/scripts/jewel-motion.ts animates the
// hand-offs between bands; nothing here depends on JavaScript.
// =============================================================================

import type { JewelSurface } from './surfaces.ts';

export type Jewel = 'wine' | 'magenta' | 'amber' | 'forest';

/** The deal order: a dark red, a green, a pink, then the light gold. */
export const JEWEL_ORDER: Jewel[] = ['wine', 'forest', 'magenta', 'amber'];

/**
 * The site's own blocks that are drawn as a colour field when the alternation
 * allows. Openers (the about, sessions and story covers, the story index) and
 * photo walls stay on paper, where the photographs are the colour.
 */
export const JEWEL_BLOCKS = new Set<string>([
  'aboutStory',
  'processFigures',
  'pressContents',
  'publishedMarquee',
  'proofStrip',
  'kindWords',
  'craftNotes',
  'crewSection',
  'signedClose',
  'sessionExperience',
  'heirloomsSpec',
  'investmentNote',
  'sessionQuestions',
  'sessionOffers',
  'sessionTeam',
  'sessionsClose',
  'contactCardSection',
]);

/** Rows that paint their own dark band; a jewel never sits against one. */
function isDark(block: { _type: string; [k: string]: unknown } | undefined): boolean {
  if (!block) return false;
  if (block._type === 'ctaBandSection') return true;
  if (block.look === 'feature') return true;
  return block._type === 'heroSection' && !!block.backgroundImage;
}

/** Whether a row asks to be a colour field at all. */
export function wantsJewel(block: { _type: string; look?: unknown }): boolean {
  if (JEWEL_BLOCKS.has(block._type)) return true;
  return typeof block.look === 'string' && block.look.replace(/[^\w-].*$/s, '') === 'jewel';
}

/** The surface name for a jewel (the class pair lives in surfaces.ts). */
export function jewelSurface(j: Jewel): JewelSurface {
  return `jewel-${j}`;
}

/** The class list a jewel band carries: the shared rule plus the jewel's own. */
export function jewelClass(j: Jewel): string {
  return `jewel surface-jewel-${j}`;
}

/** A small stable number from a string, to vary the starting jewel per page. */
function seedOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** The nth jewel of a deal that starts at `start`. */
export function jewelAt(n: number, start = 0): Jewel {
  return JEWEL_ORDER[(start + n) % JEWEL_ORDER.length];
}

/**
 * Assign jewels to one page's rows. Returns one entry per row: the jewel the
 * row is drawn on, or null for paper (or for a row that paints its own band).
 */
export function assignJewels(blocks: { _type: string; [k: string]: unknown }[]): (Jewel | null)[] {
  const start = seedOf(blocks.map((b) => b._type).join('|')) % JEWEL_ORDER.length;
  const out: (Jewel | null)[] = [];
  let dealt = 0;
  blocks.forEach((block, i) => {
    const prevJewel = i > 0 && out[i - 1] !== null;
    const ok =
      i > 0 &&
      wantsJewel(block) &&
      !isDark(block) &&
      !prevJewel &&
      !isDark(blocks[i - 1]) &&
      !isDark(blocks[i + 1]);
    out.push(ok ? jewelAt(dealt++, start) : null);
  });
  return out;
}
