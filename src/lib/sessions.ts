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

/**
 * A money or other figure typed in the Studio, cleaned, or '' when it is empty
 * (the row it belongs to is then not drawn). Never a figure from code.
 */
export function figure(v: string | null | undefined): string {
  return clean(v);
}

export interface WallSize {
  name?: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * The wall-art sizes drawn to one scale: each size's width and height as a
 * share of the largest side of any size (0 to 1), so the Statement piece fills
 * the drawing's height and a Mini sits small beside it. Sizes without both
 * numbers come back with `drawn: false` and are listed by name only.
 */
export function scaleSizes<T extends WallSize>(
  sizes: T[] | null | undefined,
): (T & { drawn: boolean; w: number; h: number })[] {
  const named = (sizes ?? []).filter((s) => clean(s?.name));
  const ok = (s: WallSize) =>
    typeof s.width === 'number' && typeof s.height === 'number' && s.width > 0 && s.height > 0;
  const max = Math.max(0, ...named.filter(ok).map((s) => Math.max(s.width!, s.height!)));
  return named.map((s) =>
    ok(s) && max > 0
      ? { ...s, drawn: true, w: s.width! / max, h: s.height! / max }
      : { ...s, drawn: false, w: 0, h: 0 },
  );
}

/**
 * The index of the experience step to treat as the signature moment: the
 * first ticked one, or -1 when none is ticked.
 */
export function signatureIndex(steps: { signature?: boolean | null }[] | null | undefined): number {
  return (steps ?? []).findIndex((s) => s?.signature === true);
}

/** Roman numerals for the sitting numbers ("No. I", "No. II"), up to ten. */
export function roman(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] ?? String(n);
}
