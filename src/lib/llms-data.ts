// Safe to edit by hand
// The reads behind /llms.txt and /llms-full.txt (src/lib/llms.ts formats them).
// Build time only, through the same queries the pages use, so a story published
// in the Studio is in both files after the next rebuild (rule 6).
import { site } from '@/data/site';
import { getAboutPage, getPage, getSiteSettings } from '@/lib/queries';
import { getStories } from '@/lib/storyQueries'; // scaffold: stories
import { getPublications } from '@/lib/pressQueries'; // scaffold: press
import { resolveSocialLink } from '@/lib/social-links';
import { realText } from '@/lib/page-meta';
import { PHOTOGRAPHER } from '@/lib/site-graph';
import type { LlmsData, LlmsPress, LlmsStory } from '@/lib/llms';

/** The site's absolute origin: SITE_URL when the build sets it, else src/data/site.ts. */
export function siteOrigin(): string {
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<
    string,
    string | undefined
  >;
  return (env.PUBLIC_SITE_URL || env.SITE_URL || site.url).replace(/\/+$/, '');
}

export async function getLlmsData(): Promise<LlmsData> {
  const [settings, about, sessions] = await Promise.all([
    getSiteSettings().catch(() => null),
    getAboutPage().catch(() => null),
    getPage('sessions').catch(() => null),
  ]);
  // Filled on their own lines so `npm run scaffold` can remove a capability cleanly.
  const stories: LlmsStory[] = [];
  const press: LlmsPress[] = [];
  stories.push(...(await getStories())); // scaffold: stories
  press.push(...(await getPublications())); // scaffold: press

  const s = (settings ?? {}) as Record<string, any>;
  const social = Array.from(
    new Set(
      [
        s.socialInstagram,
        s.socialFacebook,
        ...((s.socialLinks ?? []) as any[]).map((l) => resolveSocialLink(l)?.url),
      ].filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u)),
    ),
  );
  const areas = ((s.serviceAreas ?? []) as string[]).filter(
    (a) => realText(a) && a !== 'Your City',
  );

  return {
    base: siteOrigin(),
    siteName: realText(s.title) ?? site.name,
    photographer: PHOTOGRAPHER.name,
    areas: areas.length ? areas : ['Cincinnati', 'West Chester'],
    region: 'Ohio',
    description: site.description,
    stories,
    press,
    social,
    aboutSections: (about as any)?.pageBuilder ?? null,
    sessionsSections: (sessions as any)?.pageBuilder ?? null,
    today: new Date().toISOString().slice(0, 10),
  };
}
