// Safe to edit by hand
// =============================================================================
// set-social-links.mjs - put her public Instagram and Facebook pages into Site
// settings' Social links (2026-11-18)
// =============================================================================
// The site's structured data reads `sameAs` from Site settings' socialLinks
// (src/lib/schemas.ts), and the footer draws the same rows. The dataset had none,
// so search engines saw a business with no profiles. This adds the two public
// pages, keeping any row already there, and never touches anything else.
//
// Dry by default. On production the write needs --apply AND NCS_PRODUCTION_WRITE=yes
// in the same command, under the write protocol (.claude/rules/data-scripts.md):
// back up, dry run, apply, verify.
//
//   node scripts/set-social-links.mjs
//   NCS_PRODUCTION_WRITE=yes node scripts/set-social-links.mjs --apply
// =============================================================================

import { APPLY, apply, client, done } from './lib/sanity-lib.mjs';

/** Her public pages. The Facebook page is the one her share link resolves to. */
const LINKS = [
  { key: 'social-instagram', url: 'https://www.instagram.com/tatefineartphotography/' },
  { key: 'social-facebook', url: 'https://www.facebook.com/StellinaFineArtPhotography/' },
];

const norm = (u) =>
  String(u ?? '')
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/+$/, '');

const settings = await client.fetch(`*[_id == "siteSettings"][0]{ _id, socialLinks }`);
if (!settings) {
  console.error('No siteSettings document. Nothing to do.');
  process.exit(1);
}

const have = new Set((settings.socialLinks ?? []).map((l) => norm(l?.url)));
const add = LINKS.filter((l) => !have.has(norm(l.url))).map((l) => ({
  _key: l.key,
  _type: 'socialLink',
  url: l.url,
}));

console.log(`siteSettings.socialLinks now: ${settings.socialLinks?.length ?? 0} row(s)`);
for (const row of add) console.log(`  + ${row.url}`);

let changes = 0;
if (add.length) {
  changes = add.length;
  await apply(`append ${add.length} social link(s) to siteSettings`, async () => {
    await client
      .patch('siteSettings')
      .setIfMissing({ socialLinks: [] })
      .append('socialLinks', add)
      .commit({ autoGenerateArrayKeys: false });
  });
} else {
  console.log('Both links are already there.');
}

if (APPLY && changes) {
  const after = await client.fetch(`*[_id == "siteSettings"][0].socialLinks[].url`);
  console.log('After:', after);
}
done(changes);
