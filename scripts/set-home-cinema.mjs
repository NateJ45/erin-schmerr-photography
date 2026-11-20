// Safe to edit by hand
// =============================================================================
// set-home-cinema.mjs - the home "Cinema" (2026-11-20)
// =============================================================================
// One-off content write for the home page: replaces the homePage document's
// `pageBuilder` with the three blocks of the Cinema home (DESIGN.md "Home
// cinema"):
//
//   cover hero (the opening frame and one frame per featured story)
//   -> her magazines as a contents line (pressContents, the About page's block)
//   -> the signed close that is already on the home page, kept as it is
//
// It removes the starter sections from the HOME PAGE only (the proof strip, the
// intro line, the story grid, "How a session works", "How I get the look", the
// about teaser and the tear sheets). Their block types and the documents they
// read (stories, press, steps) stay untouched, so any of them can be added
// back from the Studio's "+ Add item" menu.
//
// The cover hero keeps its own _key, buttons and portrait (the Cinema does not
// draw them, but nothing is lost) and gets the Cinema's words: her name as the
// headline (the last word set in italic) and her own place line, carried over
// from the block's "small line above the headline", as the small line under it.
// The sentence that was in the subhead goes into the backup with the rest.
//
// Before anything else it writes the current homePage document, verbatim, to a
// JSON file OUTSIDE the repo (default: ../_backups/ beside the repo folder, or
// --backup-dir <dir>), so the old page can be put back with
// scripts/restore-doc.mjs.
//
// Dry by default (rule 16). On `production` the write needs --apply AND
// NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol in
// .claude/rules/data-scripts.md: back up, dry run, apply, verify. Run it only
// after the PR that ships the Cinema has deployed.
//
//   node scripts/set-home-cinema.mjs                  # dry run: prints the plan
//   node scripts/set-home-cinema.mjs --plan-only home.json  # the plan for a saved doc, no token
//   NCS_PRODUCTION_WRITE=yes node scripts/set-home-cinema.mjs --apply
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/set-home-cinema.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
// =============================================================================

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEADLINE = 'Erin Schmerr';
const SUBHEAD_FALLBACK = 'Fine-art portraits, Cincinnati and West Chester';
const PRESS = { _key: 'home-press', _type: 'pressContents', heading: 'As seen in' };

/**
 * Pure: the Cinema page builder for a homePage document, and the plan as
 * printable lines. Throws when the page lacks the cover hero or the signed close.
 */
export function planHome(doc) {
  const blocks = doc.pageBuilder ?? [];
  const hero = blocks.find((b) => b._type === 'coverHero');
  const close = blocks.find((b) => b._type === 'signedClose');
  if (!hero) throw new Error('No coverHero block on the home page to rework.');
  if (!close) throw new Error('No signedClose block on the home page to keep.');
  // "Fine-art portraits, Cincinnati and West Chester." -> no closing full stop:
  // it is set as a small line in capitals, not a sentence.
  const placeLine = (hero.eyebrow ?? SUBHEAD_FALLBACK).replace(/\.\s*$/, '');
  const nextHero = { ...hero, headline: HEADLINE, subhead: placeLine, limit: 8 };
  const press = blocks.find((b) => b._type === 'pressContents') ?? PRESS;
  const next = [nextHero, press, close];
  const show = (b) => `${b._type}:${b._key}`;
  const removed = blocks.filter((b) => !next.some((n) => n._key === b._key));
  const lines = [
    `  now:     ${blocks.map(show).join(', ')}`,
    `  after:   ${next.map(show).join(', ')}`,
    `  removed from the home page: ${removed.map(show).join(', ') || 'none'}`,
    `  coverHero headline: "${hero.headline}" -> "${HEADLINE}"`,
    `  coverHero subhead:  "${hero.subhead ?? ''}" -> "${placeLine}"`,
    `  coverHero limit:    ${hero.limit ?? 'unset'} -> 8`,
    `  signedClose kept as it is: "${close.heading ?? ''}"`,
  ];
  return { next, lines, same: JSON.stringify(blocks) === JSON.stringify(next) };
}

// --plan-only <file.json>: print the plan for a homePage document saved to a
// file (read it any way you like), with no client, no token and no write.
const planFile = (() => {
  const i = process.argv.indexOf('--plan-only');
  return i > -1 ? process.argv[i + 1] : undefined;
})();
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain && planFile) {
  const doc = JSON.parse(readFileSync(planFile, 'utf8'));
  console.log(`homePage from ${planFile}, revision ${doc._rev}`);
  console.log(planHome(doc).lines.join('\n'));
  console.log('\nPLAN ONLY: nothing read from Sanity, nothing written.');
} else if (isMain) {
  await main();
}

async function main() {
  const { client, dataset, apply, done, ROOT } = await import('./lib/sanity-lib.mjs');
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i > -1 ? process.argv[i + 1] : undefined;
  };
  // The repo's own folder, even when this runs from a worktree inside it
  // (<repo>/.claude/worktrees/<name>): a backup in there would be inside the repo.
  const repoTop = ROOT.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0];
  const backupDir = resolve(arg('--backup-dir') ?? resolve(repoTop, '..', '_backups'));
  const inside = (dir, top) =>
    dir === top || dir.startsWith(top + '\\') || dir.startsWith(top + '/');
  if (inside(backupDir, repoTop) || inside(backupDir, ROOT)) {
    console.error(`The backup must live outside the repo, not in ${backupDir}.`);
    process.exit(1);
  }

  const current = await client.fetch('*[_id == "homePage"][0]');
  if (!current) throw new Error(`No homePage document in ${dataset}.`);
  const { next, lines, same } = planHome(current);
  console.log(`homePage in ${dataset}, revision ${current._rev}`);
  console.log(lines.join('\n'));

  if (same) {
    console.log('Already in place; nothing to write.');
    done(0);
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = resolve(backupDir, `homePage-${dataset}-${stamp}.json`);
  // The backup comes first; the page is written only if it succeeded.
  await apply(`backup: write the current homePage to ${file}`, async () => {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
  });
  // ifRevisionId: refuse if someone edited the page since the read above.
  await apply(
    'homePage: set pageBuilder to the Cinema (coverHero, pressContents, signedClose)',
    () => client.patch('homePage').ifRevisionId(current._rev).set({ pageBuilder: next }).commit(),
  );
  done(2);
}
