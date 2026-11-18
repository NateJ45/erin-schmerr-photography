// Safe to edit by hand
// =============================================================================
// site-graph.ts - who the site is about, for search engines and assistants
// =============================================================================
// Two entities, linked by @id so a search engine reads one photographer and one
// business, not two strangers:
//
//   #business      Tate Fine Art Photography (ProfessionalService, from Site
//                  settings via the starter's localBusinessSchema), with
//                  founder -> #photographer, knowsAbout and areaServed.
//   #photographer  Erin Schmerr (Person), worksFor -> #business, with the press
//                  features that have a web address as subjectOf.
//
// The business goes on every page (BaseLayout). The full Person goes on Home,
// About and Press, where her press list is read. Story pages credit her by the
// same @id (src/lib/portfolio-schemas.ts). Not a scaffold file: the business and
// the photographer stay whatever capabilities a fork removes.
// =============================================================================

import { site } from '@/data/site';
import { localBusinessSchema } from '@/lib/schemas';
import { plainText, realText, type QA } from '@/lib/page-meta';

/** The photographer. Her name stays the same whatever the business is called. */
export const PHOTOGRAPHER = {
  name: 'Erin Schmerr',
  /** The name some magazine credits use. */
  alternateName: 'Erin Tate Schmerr',
  jobTitle: 'Fine-art portrait photographer',
  homeLocation: 'West Chester, Ohio',
};

export const PERSON_ID = `${site.url}/#photographer`;
export const BUSINESS_ID = `${site.url}/#business`;

/** What the studio makes, in the words a search engine matches. */
export const KNOWS_ABOUT = [
  'Fine-art portraiture',
  'Vintage portrait sessions',
  'Themed portrait sessions',
  'Editorial portrait photography',
];

/** Where she shoots, when Site settings names no service area. */
const DEFAULT_AREAS = ['Cincinnati', 'West Chester'];

const OHIO = { '@type': 'State', name: 'Ohio' };

type SiteSettingsInput = Parameters<typeof localBusinessSchema>[0];

/**
 * The starter's LocalBusiness for this site, with the photographer linked in. Everything
 * the starter derives (address, sameAs from Social links, hours) is kept as it is.
 */
export function siteBusinessSchema(settings: SiteSettingsInput, now: Date = new Date()): string {
  const base = JSON.parse(localBusinessSchema(settings, now)) as Record<string, unknown>;
  const areas = (settings?.serviceAreas ?? []).filter((a) => realText(a) && a !== 'Your City');
  return JSON.stringify({
    ...base,
    description:
      'Fine-art and vintage portrait photography by Erin Schmerr in Cincinnati and West Chester, Ohio.',
    founder: { '@type': 'Person', '@id': PERSON_ID, name: PHOTOGRAPHER.name },
    knowsAbout: KNOWS_ABOUT,
    areaServed: (areas.length ? areas : DEFAULT_AREAS).map((name) => ({
      '@type': 'City',
      name,
      containedInPlace: OHIO,
    })),
  });
}

/** A press feature, as the press queries return it (only what the graph needs). */
export interface PressFeature {
  _id?: string;
  magazine?: string | null;
  issue?: string | null;
  date?: string | null;
  url?: string | null;
  excerpt?: string | null;
  isPlaceholder?: boolean;
}

/** Press features with a real web address, as CreativeWorks about her. */
export function pressSubjectOf(features: PressFeature[] | null | undefined) {
  return (features ?? [])
    .filter(
      (f) =>
        !f.isPlaceholder &&
        !/^placeholder-/.test(f._id ?? '') &&
        realText(f.magazine) &&
        /^https?:\/\//.test(f.url ?? ''),
    )
    .map((f) => ({
      '@type': 'CreativeWork',
      name: f.issue ? `${f.magazine}: ${f.issue}` : f.magazine,
      url: f.url,
      ...(f.date ? { datePublished: f.date } : {}),
      ...(realText(f.excerpt) ? { description: realText(f.excerpt) } : {}),
      publisher: { '@type': 'Organization', name: f.magazine },
      about: { '@id': PERSON_ID },
    }));
}

/** The photographer, linked to the business, with her press features. */
export function personSchema(press: PressFeature[] | null | undefined = []): string {
  const subjectOf = pressSubjectOf(press);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PHOTOGRAPHER.name,
    alternateName: PHOTOGRAPHER.alternateName,
    jobTitle: PHOTOGRAPHER.jobTitle,
    homeLocation: { '@type': 'Place', name: PHOTOGRAPHER.homeLocation },
    knowsAbout: KNOWS_ABOUT,
    url: `${site.url}/about/`,
    worksFor: { '@type': 'ProfessionalService', '@id': BUSINESS_ID, name: site.name },
    ...(subjectOf.length ? { subjectOf } : {}),
  });
}

// ---------------------------------------------------------------------------
// Questions and answers (FAQPage)
// ---------------------------------------------------------------------------

/** An FAQPage for questions with real answers (not tied to the faq capability). */
export function questionsSchema(items: QA[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: plainText(f.answer) },
    })),
  });
}
