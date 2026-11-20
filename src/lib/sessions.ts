// scaffold-file: sessions
// Safe to edit by hand
// Pure helpers for the Sessions page's blocks (src/components/sessions/,
// schema in src/sanity/schemaTypes/sessionSections.ts). Unit-tested in
// sessions.test.ts. Every string is stega-cleaned before it is compared, so the
// draft preview takes the same branch as the live page.
import { stegaClean } from '@sanity/client/stega';

const clean = (v: unknown): string => (typeof v === 'string' ? stegaClean(v).trim() : '');

/**
 * The opening line split around its italic turn: [before, turn, after], or
 * null when there is no turn or the words are not in the line (the line then
 * reads as plain roman).
 */
export function splitTurn(
  line: string | null | undefined,
  turn: string | null | undefined,
): [string, string, string] | null {
  const text = typeof line === 'string' ? stegaClean(line) : '';
  const words = clean(turn);
  if (!text || !words) return null;
  const at = text.indexOf(words);
  if (at < 0) return null;
  return [text.slice(0, at), words, text.slice(at + words.length)];
}

export interface SittingRow {
  label?: string | null;
  inFirst?: boolean | null;
  inSecond?: boolean | null;
  inThird?: boolean | null;
}

/**
 * Whether sitting `index` (0-based, counted from the left) includes a row. An
 * unset tick counts as included: the Studio's initial value is ticked, and a
 * row typed before the ticks existed should not grey out by surprise.
 */
export function rowIncludes(row: SittingRow, index: number): boolean {
  const tick = [row.inFirst, row.inSecond, row.inThird][index];
  return tick !== false;
}

/** The rows with a label, in order. */
export function sittingRows<T extends SittingRow>(rows: T[] | null | undefined): T[] {
  return (rows ?? []).filter((r) => clean(r?.label));
}

/**
 * The "Investment from" row shows only when at least one sitting has a figure
 * typed in. An empty or whitespace field is empty.
 */
export function showInvestment(
  sittings: { investmentFrom?: string | null }[] | null | undefined,
): boolean {
  return (sittings ?? []).some((s) => clean(s?.investmentFrom) !== '');
}

/** Roman numerals for the sitting numbers ("No. I", "No. II"), up to ten. */
export function roman(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] ?? String(n);
}
