// Safe to edit by hand
// =============================================================================
// import-stories: stories, collaborators and publications from a manifest
// =============================================================================
// Writes real portfolio content from a JSON manifest that lives OUTSIDE the
// repo (the photographs and their words are hers and never go in git). The
// manifest names local image files next to it; this script uploads them as
// Sanity image assets and writes the documents.
//
//   node scripts/import-stories.mjs <manifest.json>              # plan only
//   NCS_PRODUCTION_WRITE=yes node scripts/import-stories.mjs <manifest.json> --apply
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/import-stories.mjs <m> --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
//
// Manifest shape (paths relative to the manifest):
//   {
//     "collaborators": [{ "id": "vampirebby", "name": "...", "defaultRole": "Model", "instagram": "vampirebby" }],
//     "publications":  [{ "id": "bleachfilm-2025", "magazine": "...", "issue": "...", "date": "2025-07-19",
//                         "url": "...", "excerpt": "...", "tearSheet": { "file": "x.jpg", "alt": "..." } }],
//     "stories":       [{ "id": "valentine-1970s", "title": "...", "slug": "...", "dek": "...",
//                         "date": "2026-01-21", "location": "...", "featured": true,
//                         "publication": "bleachfilm-2025",
//                         "cover": { "file": "...", "alt": "..." },
//                         "photos": [{ "file": "...", "alt": "...", "caption": "..." }],
//                         "credits": [{ "collaborator": "vampirebby", "role": "Model" }] }]
//   }
//
// Ids are prefixed (collaborator "ig-collaborator-<id>", publication
// "ig-publication-<id>", story "ig-story-<id>"), written with createOrReplace,
// so a re-run replaces rather than duplicates; Sanity names an image asset
// after the hash of its bytes, so re-uploading the same file is free. Story
// order follows the manifest (orderRank). Every array member carries _type and
// _key (PORTS.md card 95). It never deletes anything (rule 16).
//
// DRY BY DEFAULT (rule 16, .claude/rules/data-scripts.md): the write protocol
// is backup, dry run, apply, verify, then `npm run audit:data`.
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!manifestPath) {
  console.error('Usage: node scripts/import-stories.mjs <manifest.json> [--apply]');
  process.exit(1);
}
const base = dirname(resolve(manifestPath));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const ref = (id) => ({ _type: 'reference', _ref: id });
const key = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);

// ── Images: read each file once, work out the asset id Sanity will give it ──
const files = new Map(); // file -> { buffer, assetId, width, height }
async function image(file) {
  if (files.has(file)) return files.get(file);
  const path = resolve(base, file);
  if (!existsSync(path)) throw new Error(`missing image ${path}`);
  const buffer = readFileSync(path);
  const meta = await sharp(buffer).metadata();
  const sha1 = createHash('sha1').update(buffer).digest('hex');
  const ext = meta.format === 'jpeg' ? 'jpg' : meta.format;
  const info = {
    file,
    buffer,
    width: meta.width,
    height: meta.height,
    assetId: `image-${sha1}-${meta.width}x${meta.height}-${ext}`,
  };
  files.set(file, info);
  return info;
}

async function photo(p, extra = {}) {
  const img = await image(p.file);
  return {
    _type: 'photo',
    asset: ref(img.assetId),
    alt: p.alt,
    ...(p.caption ? { caption: p.caption } : {}),
    inArchive: p.inArchive ?? true,
    ...extra,
  };
}

// ── Documents ───────────────────────────────────────────────────────────────
const docs = [];
const collabIds = new Set();
for (const c of manifest.collaborators ?? []) {
  const _id = `ig-collaborator-${c.id}`;
  collabIds.add(c.id);
  docs.push({
    _id,
    _type: 'collaborator',
    name: c.name,
    ...(c.defaultRole ? { defaultRole: c.defaultRole } : {}),
    ...(c.url ? { url: c.url } : {}),
    ...(c.instagram ? { instagram: c.instagram } : {}),
  });
}
const pubIds = new Set();
for (const p of manifest.publications ?? []) {
  pubIds.add(p.id);
  docs.push({
    _id: `ig-publication-${p.id}`,
    _type: 'publication',
    magazine: p.magazine,
    ...(p.issue ? { issue: p.issue } : {}),
    date: p.date,
    ...(p.url ? { url: p.url } : {}),
    ...(p.excerpt ? { excerpt: p.excerpt } : {}),
    ...(p.tearSheet ? { tearSheet: await photo(p.tearSheet) } : {}),
  });
}
let rank = 0;
for (const s of manifest.stories ?? []) {
  rank++;
  for (const c of s.credits ?? []) {
    if (!collabIds.has(c.collaborator))
      throw new Error(`${s.id}: unknown collaborator ${c.collaborator}`);
  }
  if (s.publication && !pubIds.has(s.publication)) {
    throw new Error(`${s.id}: unknown publication ${s.publication}`);
  }
  docs.push({
    _id: `ig-story-${s.id}`,
    _type: 'story',
    title: s.title,
    slug: { _type: 'slug', current: s.slug ?? s.id },
    ...(s.dek ? { dek: s.dek } : {}),
    date: s.date,
    ...(s.location ? { location: s.location } : {}),
    featured: !!s.featured,
    // Valid LexoRank strings, so the orderable list keeps the manifest order.
    orderRank: `0|${String(rank).padStart(3, '0')}000:`,
    cover: await photo(s.cover),
    photos: await Promise.all(
      (s.photos ?? []).map((p) => photo(p, { _key: key(`${s.id}:${p.file}`) })),
    ),
    credits: (s.credits ?? []).map((c) => ({
      _type: 'credit',
      _key: key(`${s.id}:${c.collaborator}`),
      collaborator: ref(`ig-collaborator-${c.collaborator}`),
      ...(c.role ? { role: c.role } : {}),
    })),
    ...(s.publication ? { publication: ref(`ig-publication-${s.publication}`) } : {}),
  });
}

for (const doc of docs) {
  for (const [field, value] of Object.entries(doc)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!item?._type || !item?._key)
        throw new Error(`${doc._id}.${field} has an item without _type and _key`);
    }
  }
}

console.log(`Manifest: ${resolve(manifestPath)}`);
console.log(`  ${files.size} images, ${docs.length} documents:`);
for (const d of docs)
  console.log(`    ${d._type.padEnd(12)} ${d._id}${d.title ? `  "${d.title}"` : ''}`);

// sanity-lib carries the client, the --apply gate and the production second
// factor: with --apply on production and no NCS_PRODUCTION_WRITE=yes, this
// import exits before any request.
const { client, dataset, apply, done } = await import('./lib/sanity-lib.mjs');
console.log(`\nDataset: ${dataset}`);

let changes = 0;
for (const img of files.values()) {
  await apply(`upload ${img.file} as ${img.assetId}`, async () => {
    const asset = await client.assets.upload('image', img.buffer, {
      filename: img.file.split('/').pop(),
    });
    if (asset._id !== img.assetId)
      throw new Error(`asset id ${asset._id} is not the expected ${img.assetId}`);
  });
  changes++;
}
await apply(`createOrReplace ${docs.length} documents in one transaction`, async () => {
  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(doc);
  await tx.commit();
});
changes += docs.length;
done(changes);
if (process.argv.includes('--apply')) console.log('Next: npm run audit:data (must exit 0).');
