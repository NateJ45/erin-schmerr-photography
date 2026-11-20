// scaffold-file: about
// Safe to edit by hand
// Small pure helpers for the About page's own blocks (aboutSections.ts). Kept
// out of the components so node --test can check them (about-page.test.ts).

/** One run of headline text: italic when the editor wrapped it in underscores. */
export interface EmphasisRun {
  text: string;
  italic: boolean;
}

/**
 * Splits "I was afraid of _forgetting_ it all." into plain and italic runs. An
 * underscore with no partner is kept as written, so a stray one never swallows
 * the rest of the line. Empty runs are dropped.
 */
export function emphasisRuns(text: string | null | undefined): EmphasisRun[] {
  const source = text ?? '';
  const runs: EmphasisRun[] = [];
  const pattern = /_([^_]+)_/g;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) runs.push({ text: source.slice(last, at), italic: false });
    runs.push({ text: match[1], italic: true });
    last = at + match[0].length;
  }
  if (last < source.length) runs.push({ text: source.slice(last), italic: false });
  return runs.filter((r) => r.text.length > 0);
}

/** The headline as plain words, for the page title and anything read aloud. */
export function plainHeadline(text: string | null | undefined): string {
  return emphasisRuns(text)
    .map((r) => r.text)
    .join('');
}

/**
 * The behind-the-scenes heading set at both ends of the column (the M. Fisher
 * layout): the first word on the left, the rest on the right. A single word
 * stays on the left alone.
 */
export function headingEnds(heading: string | null | undefined): [string, string] {
  const words = (heading ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [words[0] ?? '', ''];
  return [words[0], words.slice(1).join(' ')];
}

/** "Fig 01." for the first figure: two digits, a full stop, like a printed plate. */
export function figureLabel(index: number): string {
  return `Fig ${String(index + 1).padStart(2, '0')}.`;
}
