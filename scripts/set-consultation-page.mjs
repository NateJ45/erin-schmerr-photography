// Safe to edit by hand
// =============================================================================
// set-consultation-page.mjs - the consultation page's words (2026-11-20, phase 2)
// =============================================================================
// One-off content write for the Contact page singleton (`contactPage`), so the
// consult-first page (DESIGN.md "Booking funnel") reads from the Studio, where
// Erin can change it, instead of from the code's fallbacks:
//
//   heroEyebrow, heroHeadline, heroSubhead   the cover's words
//   seoTitle, seoDescription                 replace the starter's seeded lines
//   postInquiryRoadmap                       "How it unfolds", the four steps
//
// The words are the same drafts the code falls back to (src/pages/contact.astro,
// src/data/funnel.ts), in Erin's voice, for her to approve or rewrite. No prices
// and no personal data (the dataset is public). Only these six fields are set;
// nothing is unset or deleted, so the starter's other seeded fields stay as they
// are (the page ignores them).
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify. It sets no new
// field types, so it can run before or after the PR deploys.
//
//   node scripts/set-consultation-page.mjs              # dry run: prints the plan
//   NCS_PRODUCTION_WRITE=yes node scripts/set-consultation-page.mjs --apply
// =============================================================================

import { pathToFileURL } from 'node:url';

export const CONSULTATION_FIELDS = {
  heroEyebrow: 'Cincinnati and West Chester, Ohio',
  heroHeadline: 'Reserve a complimentary _consultation_',
  heroSubhead:
    'Every portrait I make begins with a conversation. Tell me who it is for, and we will plan it together, with no obligation at all.',
  seoTitle: 'Reserve a complimentary consultation',
  seoDescription:
    'Reserve a complimentary, no-obligation consultation with Erin Schmerr for family, portrait or model and creative sittings in Cincinnati and West Chester, Ohio.',
  postInquiryRoadmap: [
    {
      _key: 'consult-talk',
      _type: 'roadmapStep',
      title: 'We talk',
      body: 'A relaxed conversation, free and with no obligation. You tell me who the portrait is for and what you picture, and I listen.',
    },
    {
      _key: 'consult-plan',
      _type: 'roadmapStep',
      title: 'We plan',
      body: 'The clothes, the place, the light and the story behind it. You get the sitting guide, and we choose everything together.',
    },
    {
      _key: 'consult-sitting',
      _type: 'roadmapStep',
      title: 'The sitting',
      body: 'Unhurried and guided the whole way, in the studio or out on location, so all you have to do is be yourself.',
    },
    {
      _key: 'consult-portraits',
      _type: 'roadmapStep',
      title: 'Your portraits',
      body: 'We choose the portraits you love and decide how they will live with you: on a wall, in an album, or both.',
    },
  ],
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { client, dataset, apply, done } = await import('./lib/sanity-lib.mjs');
  const keys = Object.keys(CONSULTATION_FIELDS);
  const current = await client.fetch(`*[_id == "contactPage"][0]{ _rev, ${keys.join(', ')} }`);
  if (!current) throw new Error(`No contactPage document in ${dataset}.`);
  console.log(`contactPage in ${dataset}, revision ${current._rev}`);

  const changes = {};
  for (const k of keys) {
    const now = JSON.stringify(current[k] ?? null);
    const next = JSON.stringify(CONSULTATION_FIELDS[k]);
    if (now === next) continue;
    changes[k] = CONSULTATION_FIELDS[k];
    const show = (v) => (v && v.length > 110 ? `${v.slice(0, 107)}...` : v);
    console.log(`  ${k}:`);
    console.log(`    now:   ${show(now)}`);
    console.log(`    after: ${show(next)}`);
  }

  if (!Object.keys(changes).length) {
    console.log('Already in place; nothing to write.');
    done(0);
  } else {
    // ifRevisionId: refuse if someone edited the page since the read above.
    await apply(`contactPage: set ${Object.keys(changes).join(', ')}`, () =>
      client.patch('contactPage').ifRevisionId(current._rev).set(changes).commit(),
    );
    done(1);
  }
}
