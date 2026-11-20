// scaffold-file: testimonials
// Safe to edit by hand
// =============================================================================
// kind-words - the pure half of the Kind words block (KindWords.astro)
// =============================================================================
// Which testimonials the block shows and in what order, and whether a quote is
// still a stand-in. Kept out of the component so node --test can pin it
// (kind-words.test.ts).
// =============================================================================
import type { PortfolioPhoto } from './portfolio';

/** One Testimonial document as the block reads it. */
export interface KindWordsDoc {
  _id: string;
  quote?: string | null;
  attribution?: string | null;
  sessionType?: string | null;
  confirmed?: boolean | null;
  featured?: boolean | null;
  date?: string | null;
  photo?: PortfolioPhoto | null;
}

/** The most rows the block draws (the schema allows eight picks). */
export const KIND_WORDS_MAX = 8;

/** The marker shown over a quote that is not a client's confirmed words. */
export const KIND_WORDS_PLACEHOLDER = "Placeholder: replace with a real client's words";

/**
 * The quotes to show. With picks, those documents in the editor's order (a pick
 * that no longer exists is skipped); with none, every testimonial, featured
 * first, then newest. Documents without words are dropped either way.
 */
export function kindWordsEntries(
  docs: KindWordsDoc[],
  picks: { _ref?: string | null }[] | null | undefined,
): KindWordsDoc[] {
  const withWords = docs.filter((d) => (d.quote ?? '').trim().length > 0);
  const ids = (picks ?? []).map((p) => p?._ref).filter((id): id is string => !!id);
  if (ids.length) {
    const byId = new Map(withWords.map((d) => [d._id, d]));
    return ids
      .map((id) => byId.get(id))
      .filter((d): d is KindWordsDoc => !!d)
      .slice(0, KIND_WORDS_MAX);
  }
  return [...withWords]
    .sort(
      (a, b) =>
        Number(!!b.featured) - Number(!!a.featured) ||
        (b.date ?? '').localeCompare(a.date ?? '') ||
        a._id.localeCompare(b._id),
    )
    .slice(0, KIND_WORDS_MAX);
}

/**
 * A quote is a placeholder until someone ticks Confirmed, and always while it
 * still reads like the starter's seeded stand-in ("Replace this with a real
 * quote ..."), so a ticked box can never put template words in a client's mouth.
 */
export function isPlaceholderQuote(doc: Pick<KindWordsDoc, 'quote' | 'confirmed'>): boolean {
  if (doc.confirmed !== true) return true;
  return /^\s*(replace this|placeholder)/i.test(doc.quote ?? '');
}
