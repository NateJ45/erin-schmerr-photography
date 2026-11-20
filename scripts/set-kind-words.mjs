// Safe to edit by hand
// =============================================================================
// set-kind-words.mjs - put "Kind words" on the home page and About (2026-11-20)
// =============================================================================
// One-off content write for the Kind words block (kindWordsSection.ts,
// KindWords.astro):
//
//   homePage   ... pressContents -> kindWords (one at a time) -> signedClose
//   aboutPage  ... pressContents -> kindWords (ruled rows)    -> signedClose
//
// and gives the three seeded Testimonial documents (testimonial-1 to -3, whose
// quote is still the starter's "Replace this with a real quote ...") stand-in
// words that read at a real quote's length, a "Client name", a kind of sitting
// and Confirmed left OFF, so the site shows "Placeholder: replace with a real
// client's words" over each until Erin sends real ones. A testimonial anyone
// has already written is left alone. No client name or quote is invented.
//
// Idempotent: a page that already has a kindWords block is skipped. Before any
// write it saves each document it will change, verbatim, to a JSON file OUTSIDE
// the repo (default ../_backups/ beside the repo folder, or --backup-dir <dir>),
// so scripts/restore-doc.mjs can put it back.
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify. Run it only
// after the PR that ships the block has deployed.
//
//   node scripts/set-kind-words.mjs                  # dry run: prints the plan
//   NCS_PRODUCTION_WRITE=yes node scripts/set-kind-words.mjs --apply
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/set-kind-words.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
// =============================================================================

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** The block for each page. The home page plays one quote at a time; About shows the rows. */
export const BLOCKS = {
  homePage: {
    _key: 'home-kind-words',
    _type: 'kindWords',
    heading: 'Kind _words_',
    crossfade: true,
  },
  aboutPage: {
    _key: 'about-kind-words',
    _type: 'kindWords',
    heading: 'Kind _words_',
    crossfade: false,
  },
};

/** Stand-in words for the seeded testimonials: plainly placeholders, at real lengths. */
export const STAND_INS = {
  'testimonial-1': {
    quote:
      "Placeholder quote. A client's own words about their sitting go here, two or three sentences long, so this row reads at the length a real letter will.",
    attribution: 'Client name',
    sessionType: 'Portrait and family sitting',
  },
  'testimonial-2': {
    quote:
      'Placeholder quote. Something a client said about seeing the portraits for the first time, in their words and with their punctuation.',
    attribution: 'Client name',
    sessionType: 'Editorial test',
  },
  'testimonial-3': {
    quote:
      'Placeholder quote. A shorter line from a client, the kind that sums up the day in one breath.',
    attribution: 'Client name',
    sessionType: 'Digitals',
  },
};

const SEEDED = /^\s*replace this with a real quote/i;

/**
 * Pure: the page builder with the block inserted just before the signed close (or at the end
 * when the page has none), or null when the page already has one.
 */
export function withKindWords(blocks, block) {
  const list = blocks ?? [];
  if (list.some((b) => b._type === 'kindWords')) return null;
  const at = list.findIndex((b) => b._type === 'signedClose');
  const i = at === -1 ? list.length : at;
  return [...list.slice(0, i), block, ...list.slice(i)];
}

/** Pure: the fields to set on a seeded testimonial, or null when someone has written it. */
export function standInPatch(doc, today) {
  const words = STAND_INS[doc?._id];
  if (!words || !SEEDED.test(doc.quote ?? '')) return null;
  return {
    ...words,
    confirmed: false,
    date: doc.date ?? today,
    source: doc.source ?? 'Direct (email or text)',
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await main();

async function main() {
  const { client, dataset, apply, done, ROOT } = await import('./lib/sanity-lib.mjs');
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i > -1 ? process.argv[i + 1] : undefined;
  };
  const repoTop = ROOT.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0];
  const backupDir = resolve(arg('--backup-dir') ?? resolve(repoTop, '..', '_backups'));
  const inside = (dir, top) =>
    dir === top || dir.startsWith(top + '\\') || dir.startsWith(top + '/');
  if (inside(backupDir, repoTop) || inside(backupDir, ROOT)) {
    console.error(`The backup must live outside the repo, not in ${backupDir}.`);
    process.exit(1);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const today = new Date().toISOString().slice(0, 10);
  const show = (b) => `${b._type}:${b._key}`;
  const backup = (doc) => {
    const file = resolve(backupDir, `${doc._id}-${dataset}-${stamp}.json`);
    return apply(`backup: write the current ${doc._id} to ${file}`, async () => {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
    });
  };
  let writes = 0;

  console.log(`Kind words, dataset ${dataset}\n`);

  // 1. The seeded testimonials get plainly marked stand-in words.
  const ids = Object.keys(STAND_INS);
  const testimonials = await client.fetch('*[_id in $ids]', { ids });
  for (const id of ids) {
    const doc = testimonials.find((t) => t._id === id);
    if (!doc) {
      console.log(`  ${id}: not in the dataset; skipped (the block shows whatever exists).`);
      continue;
    }
    const patch = standInPatch(doc, today);
    if (!patch) {
      console.log(`  ${id}: already has its own words; left alone.`);
      continue;
    }
    console.log(`  ${id}: "${(doc.quote ?? '').slice(0, 48)}..." ->`);
    console.log(`      quote "${patch.quote.slice(0, 60)}..."`);
    console.log(
      `      attribution "${patch.attribution}", sessionType "${patch.sessionType}", confirmed false, date ${patch.date}, source "${patch.source}"`,
    );
    await backup(doc);
    await apply(`${id}: set the stand-in words (Confirmed off)`, () =>
      client.patch(id).ifRevisionId(doc._rev).set(patch).commit(),
    );
    writes += 2;
  }

  // 2. The block on each page, just before the signed close.
  for (const [id, block] of Object.entries(BLOCKS)) {
    const doc = await client.fetch('*[_id == $id][0]', { id });
    if (!doc) {
      console.log(`\n  ${id}: no such document in ${dataset}; skipped.`);
      continue;
    }
    const next = withKindWords(doc.pageBuilder, block);
    console.log(`\n  ${id}, revision ${doc._rev}`);
    console.log(`    now:   ${(doc.pageBuilder ?? []).map(show).join(', ') || '(empty)'}`);
    if (!next) {
      console.log('    already has a Kind words block; nothing to write.');
      continue;
    }
    console.log(`    after: ${next.map(show).join(', ')}`);
    await backup(doc);
    await apply(`${id}: add ${show(block)} before the signed close`, () =>
      client.patch(id).ifRevisionId(doc._rev).set({ pageBuilder: next }).commit(),
    );
    writes += 2;
  }

  console.log('');
  done(writes);
}
