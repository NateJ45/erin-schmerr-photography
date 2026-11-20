// Safe to edit by hand
// =============================================================================
// llms.ts - the two files the site offers AI assistants, written from real data
// =============================================================================
// /llms.txt is the short map (llmstxt.org): who she is, what a session is,
// where she shoots, the key pages, every story, the press, how to book.
// /llms-full.txt is the same with the words inlined (About, Sessions, the
// questions, each story's credits), so an assistant can answer from one file.
//
// Both are built on every `npm run build` by src/pages/llms.txt.ts and
// src/pages/llms-full.txt.ts from the same reads the pages use, so they can
// never fall behind a published story. The starter's committed public/ copies
// (and scripts/generate-llms-full.mjs, PORTABLE, now unused here) described the
// template; they are gone. Placeholder stories, seeded "Replace this" text and
// "Placeholder:" answers are left out (src/lib/page-meta.ts).
//
// Pure functions: the endpoints gather the data, these only format it, so the
// unit test (llms.test.ts) can pin the shape without Sanity.
// =============================================================================

import { plainText, realFaqs, realText } from './page-meta.ts';

export interface LlmsStory {
  _id?: string | null;
  title?: string | null;
  slug?: string | null;
  dek?: string | null;
  date?: string | null;
  location?: string | null;
  credits?: Array<{ role?: string | null; name?: string | null }> | null;
  isPlaceholder?: boolean;
}

export interface LlmsPress {
  _id?: string | null;
  magazine?: string | null;
  issue?: string | null;
  date?: string | null;
  url?: string | null;
  excerpt?: string | null;
  isPlaceholder?: boolean;
}

export interface LlmsData {
  /** Absolute origin, no trailing slash. */
  base: string;
  siteName: string;
  photographer: string;
  /** Where she shoots, e.g. ['Cincinnati', 'West Chester']. */
  areas: string[];
  region: string;
  /** Her own description (src/data/site.ts). */
  description: string;
  stories: LlmsStory[];
  press: LlmsPress[];
  /** Public profile links (Site settings' Social links). */
  social: string[];
  /** Page builder sections, for the full text. */
  aboutSections?: unknown[] | null;
  sessionsSections?: unknown[] | null;
  /** The build date, YYYY-MM-DD (the Studio's Checkup reads it). */
  today: string;
}

/** The section text an assistant should read: headings, lines and body copy. */
export function sectionText(section: unknown): string[] {
  if (!section || typeof section !== 'object') return [];
  const s = section as Record<string, unknown>;
  const out: string[] = [];
  for (const key of ['headline', 'heading', 'subhead', 'intro']) {
    const v = realText(s[key]);
    if (v) out.push(v);
  }
  const body = realText(plainText(s.body));
  if (body) out.push(body);
  const quote = realText(s.quote);
  if (quote) out.push(`"${quote}"${realText(s.attribution) ? ` (${s.attribution})` : ''}`);
  return out;
}

/** A seeded stand-in: flagged, or seeded with a placeholder- id (scripts/seed-portfolio.mjs). */
const isSeed = (d: { _id?: string | null; isPlaceholder?: boolean }) =>
  Boolean(d.isPlaceholder) || /^(drafts\.)?placeholder-/.test(d._id ?? '');

const realStories = (stories: LlmsStory[]) =>
  stories.filter((s) => !isSeed(s) && realText(s.title) && realText(s.slug));

const realPress = (press: LlmsPress[]) => press.filter((p) => !isSeed(p) && realText(p.magazine));

const yearOf = (d?: string | null) => (d && /^\d{4}/.test(d) ? d.slice(0, 4) : '');

const pressName = (p: LlmsPress) =>
  `${p.magazine}${realText(p.issue) ? `, ${p.issue}` : ''}${yearOf(p.date) ? ` (${yearOf(p.date)})` : ''}`;

const socialName = (url: string) =>
  /instagram\.com/i.test(url) ? 'Instagram' : /facebook\.com/i.test(url) ? 'Facebook' : url;

function intro(d: LlmsData): string[] {
  const where = d.areas.join(' and ');
  return [
    `# ${d.siteName}`,
    '',
    `> ${d.siteName} is the portrait studio of ${d.photographer}, a fine-art portrait photographer in ${where}, ${d.region}. She makes vintage and themed portraits, usually built around a decade, a book or a film, and edits every photograph by hand.`,
    '',
    `In her words: ${d.description}`,
    '',
    '## At a glance',
    '',
    `- Photographer: ${d.photographer}`,
    `- Business: ${d.siteName}`,
    `- Where she shoots: ${where}, ${d.region}, on location or on a set`,
    '- What she makes: fine-art portraits, vintage and themed portrait sessions, editorial stories',
    `- What a session is: a portrait session planned around an idea (an era, a character, a story). She and the client plan the wardrobe, styling, location and light together, take their time on the day, and she edits every photo by hand. Details: ${d.base}/sessions/`,
    `- How to book: send a message through the form at ${d.base}/contact/`,
    '',
  ];
}

function keyPages(d: LlmsData): string[] {
  return [
    '## Key pages',
    '',
    `- [Stories](${d.base}/stories/): every portrait story, each told as a sequence of photographs`,
    `- [Archive](${d.base}/archive/): every photograph from every story in one place`,
    `- [Press](${d.base}/press/): where her work has been published, with the tear sheets`,
    `- [Sessions](${d.base}/sessions/): how a portrait session works`,
    `- [About](${d.base}/about/): who she is and how she started`,
    `- [Reserve a consultation](${d.base}/contact/): a complimentary, no-obligation consultation request`,
    `- [The sitting guide](${d.base}/guide/): a free guide to what to wear, how to prepare and what to expect`,
    '',
  ];
}

function storyList(d: LlmsData): string[] {
  const stories = realStories(d.stories);
  if (!stories.length) return [];
  return [
    '## Stories',
    '',
    ...stories.map(
      (s) =>
        `- [${s.title}](${d.base}/stories/${s.slug}/)${realText(s.dek) ? `: ${realText(s.dek)}` : ''}`,
    ),
    '',
  ];
}

function pressList(d: LlmsData): string[] {
  const press = realPress(d.press);
  if (!press.length) return [];
  return [
    '## Press',
    '',
    ...press.map((p) =>
      realText(p.url) ? `- [${pressName(p)}](${p.url})` : `- ${pressName(p)} (${d.base}/press/)`,
    ),
    '',
  ];
}

function booking(d: LlmsData): string[] {
  return [
    '## How to book',
    '',
    `- Send a message through the contact form: ${d.base}/contact/`,
    ...d.social.map((u) => `- ${socialName(u)}: ${u}`),
    '',
  ];
}

/** /llms.txt: the short map. */
export function buildLlmsTxt(d: LlmsData): string {
  const lines = [
    ...intro(d),
    ...keyPages(d),
    ...storyList(d),
    ...pressList(d),
    ...booking(d),
    '## Optional',
    '',
    `- [Full text for assistants](${d.base}/llms-full.txt): the site's words in one file`,
    `- [Privacy policy](${d.base}/privacy/): what the site collects and measures`,
    '',
  ];
  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  );
}

/** /llms-full.txt: the same, with the words inlined. */
export function buildLlmsFull(d: LlmsData): string {
  const about = (d.aboutSections ?? []).flatMap(sectionText);
  const sessions = (d.sessionsSections ?? []) as Array<Record<string, unknown>>;
  // The fold-out questions, and the steps, of either the builder kit's blocks or the Sessions
  // page's own (sessionSections.ts); a type missing from the dataset matches nothing.
  const QA_TYPES = new Set(['accordionSection', 'sessionQuestions']);
  const STEP_TYPES = new Set(['stepsRailSection', 'sessionExperience']);
  const sessionText = sessions
    .filter((s) => !QA_TYPES.has(String(s?._type)))
    .flatMap((s) =>
      s?._type === 'sessionsOpening' && realText(s.line)
        ? [String(realText(s.line)), ...sectionText(s)]
        : sectionText(s),
    );
  const steps = sessions
    .filter((s) => STEP_TYPES.has(String(s?._type)))
    .flatMap((s) => (s.steps as Array<{ title?: string; body?: unknown }>) ?? [])
    .filter((st) => realText(st?.title))
    .map((st) => `- ${st.title}: ${plainText(st.body)}`);
  const faqs = realFaqs(
    sessions
      .filter((s) => QA_TYPES.has(String(s?._type)))
      .flatMap((s) => (s.items as Array<{ question?: string; answer?: unknown }>) ?? []),
  );

  const lines = [
    `# ${d.siteName}: full site content`,
    '',
    // The Studio's Checkup reads this line (PORTS.md card 123). Keep the wording.
    `Last updated: ${d.today}`,
    '',
    `> The expanded companion to ${d.base}/llms.txt: the site's own words in one file, so an assistant can answer questions about ${d.photographer} and ${d.siteName} without reading every page.`,
    '',
    ...intro(d).slice(2),
  ];

  if (about.length)
    lines.push('## About', '', `From ${d.base}/about/:`, '', ...about.flatMap((t) => [t, '']));
  if (sessionText.length || steps.length) {
    lines.push('## Sessions', '', `From ${d.base}/sessions/:`, '');
    lines.push(...sessionText.flatMap((t) => [t, '']));
    if (steps.length) lines.push(...steps, '');
  }
  if (faqs.length) {
    lines.push('## Questions', '');
    for (const f of faqs) lines.push(`### ${f.question}`, plainText(f.answer), '');
  }

  const stories = realStories(d.stories);
  if (stories.length) {
    lines.push('## Stories', '');
    for (const s of stories) {
      lines.push(`### ${s.title}`, `${d.base}/stories/${s.slug}/`);
      const meta = [realText(s.location), yearOf(s.date)].filter(Boolean).join(', ');
      if (meta) lines.push(meta);
      if (realText(s.dek)) lines.push(realText(s.dek) as string);
      const credits = (s.credits ?? []).filter((c) => realText(c?.name));
      if (credits.length)
        lines.push(
          `Credits: ${credits.map((c) => (c.role ? `${c.role}: ${c.name}` : c.name)).join('; ')}`,
        );
      lines.push('');
    }
  }

  const press = realPress(d.press);
  if (press.length) {
    lines.push('## Press', '');
    for (const p of press) {
      lines.push(`### ${pressName(p)}`);
      if (realText(p.url)) lines.push(p.url as string);
      if (realText(p.excerpt)) lines.push(realText(p.excerpt) as string);
      lines.push('');
    }
  }

  lines.push(...booking(d));
  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  );
}
