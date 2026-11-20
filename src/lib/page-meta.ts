// Safe to edit by hand
// =============================================================================
// page-meta.ts - real titles and descriptions on every page (2026-11-18)
// =============================================================================
// The starter seeded each page singleton with SEO text an editor was meant to
// replace ("About Studio Starter - replace this title", "Your tagline goes
// here."), and the pages used `??`, so a seeded placeholder beat the page's own
// default and went to Google. Every page now picks its title and description
// with firstReal(): the first candidate that is a real sentence, skipping empty
// values and anything that reads as a starter or seed placeholder. BaseLayout
// runs the same check once more and falls back to site.description, so even a
// page that forgets is safe.
// =============================================================================

import { site } from '../data/site.ts';

/** Words only the starter's or the seed's stand-in text uses. */
export const PLACEHOLDER_TEXT =
  /studio starter|studio journal|replace (this|it|me)\b|\(replace me\)|goes here|example\.(com|org)|lorem ipsum|^placeholder\b|placeholder (post|story|text)/i;

/** The value as a trimmed string when it is real text, else null. */
export function realText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v || PLACEHOLDER_TEXT.test(v)) return null;
  return v;
}

/** The first candidate that is real text, or null. */
export function firstReal(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    const v = realText(c);
    if (v) return v;
  }
  return null;
}

/** A description for a page: the first real candidate, else the site's own description. */
export function pageDescription(...candidates: unknown[]): string {
  return firstReal(...candidates) ?? site.description;
}

/** A title for a page: the first real candidate, else the site's name. */
export function pageTitle(...candidates: unknown[]): string {
  return firstReal(...candidates) ?? site.name;
}

// ---------------------------------------------------------------------------
// Questions and answers: real ones only (FAQPage, llms-full.txt)
// ---------------------------------------------------------------------------

export interface QA {
  question?: string | null;
  answer?: unknown;
}

/** Portable Text (or a plain string) as plain text. */
export function plainText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!Array.isArray(value)) return '';
  return value
    .filter((b) => b && b._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c: { text?: string }) => c?.text ?? '').join(''))
    .join('\n\n')
    .trim();
}

/**
 * Only questions with a real answer: a seeded "Replace this with ..." or a
 * "Placeholder: ..." answer is never offered to Google as her answer.
 */
export function realFaqs<T extends QA>(items: T[] | null | undefined): T[] {
  return (items ?? []).filter((f) => realText(f.question) && realText(plainText(f.answer)));
}

/**
 * Blocks whose `items` are `{ question, answer }`: the builder kit's fold-outs and the Sessions
 * page's questions (sessionSections.ts). A type missing from the dataset simply matches nothing.
 */
const FAQ_SECTION_TYPES = new Set(['accordionSection', 'sessionQuestions']);

/** The questions in a page builder's fold-out sections, real answers only. */
export function sectionFaqs(sections: unknown): QA[] {
  if (!Array.isArray(sections)) return [];
  const items = sections
    .filter((s) => s && FAQ_SECTION_TYPES.has((s as { _type?: string })._type ?? ''))
    .flatMap((s) => ((s as { items?: QA[] }).items ?? []) as QA[]);
  return realFaqs(items);
}
