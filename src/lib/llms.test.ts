// Safe to edit by hand
// Pins the files for AI assistants (src/lib/llms.ts) and the real-words check
// behind every page's title and description (src/lib/page-meta.ts): no
// starter or seed placeholder ever reaches either, links are absolute and end
// in a slash, and the Checkup's "Last updated:" line is there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLlmsFull, buildLlmsTxt, type LlmsData } from './llms.ts';
import { pageDescription, pageTitle, realFaqs, realText, sectionFaqs } from './page-meta.ts';
import { site } from '../data/site.ts';

const block = (text: string) => [{ _type: 'block', children: [{ _type: 'span', text }] }];

const data: LlmsData = {
  base: 'https://tate.test',
  siteName: 'Tate Fine Art Photography',
  photographer: 'Erin Schmerr',
  areas: ['Cincinnati', 'West Chester'],
  region: 'Ohio',
  description: 'I make portraits that look like they were found in an old album.',
  stories: [
    {
      title: 'Halloween, 1950s',
      slug: 'halloween-1950s',
      dek: 'A party as dad’s old camera saw it.',
    },
    {
      title: 'Placeholder story one',
      slug: 'placeholder-story-one',
      dek: 'Replace it in the Studio.',
    },
    { title: 'Seed', slug: 'seed', isPlaceholder: true },
  ],
  press: [
    {
      magazine: 'BleachFilm Magazine',
      issue: 'We All Look Good in Pink',
      date: '2025-07-19',
      url: 'https://www.bleachfilm.com/x',
    },
    { magazine: 'Hollyway Magazine', date: '2024-10-01' },
    { magazine: 'Magazine name', isPlaceholder: true },
  ],
  social: ['https://www.instagram.com/tatefineartphotography/'],
  aboutSections: [
    {
      _type: 'richTextSection',
      heading: 'How it started',
      body: block('My dad was a picture nerd.'),
    },
  ],
  sessionsSections: [
    {
      _type: 'stepsRailSection',
      heading: 'How a session works',
      steps: [{ title: 'We talk', body: 'Tell me what you love.' }],
    },
    {
      _type: 'accordionSection',
      items: [
        { question: 'What should I wear?', answer: block('Something that fits the story.') },
        { question: 'How do I book?', answer: block('Placeholder: send a message.') },
      ],
    },
  ],
  today: '2026-11-18',
};

test('llms.txt: real stories and press only, absolute links with a slash', () => {
  const txt = buildLlmsTxt(data);
  assert.match(txt, /^# Tate Fine Art Photography\n/);
  assert.ok(
    txt.includes('[Halloween, 1950s](https://tate.test/stories/halloween-1950s/): A party'),
  );
  assert.ok(
    txt.includes(
      '[BleachFilm Magazine, We All Look Good in Pink (2025)](https://www.bleachfilm.com/x)',
    ),
  );
  assert.ok(txt.includes('- Hollyway Magazine (2024) (https://tate.test/press/)'));
  assert.ok(txt.includes('https://tate.test/sessions/'));
  assert.ok(txt.includes('Instagram: https://www.instagram.com/tatefineartphotography/'));
  assert.doesNotMatch(txt, /placeholder|replace it|Magazine name|example\.com|Studio Starter/i);
  assert.doesNotMatch(txt, /—/, 'no em-dashes');
});

test('llms-full.txt: the words inlined, placeholder answers left out', () => {
  const full = buildLlmsFull(data);
  assert.match(full, /^Last updated: 2026-11-18$/m);
  assert.ok(full.includes('My dad was a picture nerd.'));
  assert.ok(full.includes('- We talk: Tell me what you love.'));
  assert.ok(full.includes('### What should I wear?\nSomething that fits the story.'));
  assert.ok(!full.includes('How do I book?'));
  assert.doesNotMatch(full, /placeholder|Studio Starter|example\.com/i);
});

test('realText skips the starter and seed stand-ins', () => {
  for (const v of [
    'About Studio Starter - replace this title',
    'Your tagline goes here.',
    'Replace this with one sentence about getting in touch, for search results.',
    'Placeholder: how many days or weeks.',
    'Second placeholder post (replace me)',
    '   ',
    null,
  ]) {
    assert.equal(realText(v), null, String(v));
  }
  assert.equal(realText(' Sessions '), 'Sessions');
});

test('pageTitle and pageDescription fall back to real words, never a placeholder', () => {
  assert.equal(pageTitle('FAQ - Studio Starter', 'Questions'), 'Questions');
  assert.equal(pageTitle(null), site.name);
  assert.equal(pageDescription('Your tagline goes here.'), site.description);
  assert.equal(pageDescription('', 'A real line.'), 'A real line.');
  assert.doesNotMatch(site.description, /—/);
});

test('FAQ helpers keep only real answers', () => {
  const items = data.sessionsSections![1] as { items: { question: string }[] };
  assert.deepEqual(
    realFaqs(items.items).map((f) => f.question),
    ['What should I wear?'],
  );
  assert.equal(sectionFaqs(data.sessionsSections).length, 1);
});
