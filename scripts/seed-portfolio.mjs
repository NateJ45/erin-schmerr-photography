// Safe to edit by hand
// =============================================================================
// seed-portfolio: placeholder stories, collaborators and publications
// =============================================================================
// Fills an empty dataset with obvious PLACEHOLDER portfolio content so the
// Studio and the site can be worked on before the real photographs arrive:
//
//   16 images   made here with sharp: warm paper and dusk tonal gradients with
//               soft grain, a mix of 4:5 portrait and 3:2 landscape, each with
//               a small visible "Placeholder" label. No photograph of anyone is
//               used, and none of the photographer's own work.
//   6 collaborators   "Model name", "Makeup artist name" and so on
//   2 publications    "Magazine name, Issue 00" and a second one
//   4 stories         "Placeholder story one" to "four", with credits
//
// DRY BY DEFAULT (rule 16, .claude/rules/data-scripts.md). A bare run makes the
// images (into scripts/.portfolio-placeholders/, gitignored, so you can look
// at them), works out every document and prints the plan. It needs no
// credentials for that. Writing needs --apply, and on the production dataset
// also NCS_PRODUCTION_WRITE=yes in the same command, under the write protocol
// (backup, dry run, apply, verify):
//
//   node scripts/seed-portfolio.mjs                                   # plan only
//   NCS_PRODUCTION_WRITE=yes node scripts/seed-portfolio.mjs --apply  # write
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/seed-portfolio.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
//
// IDEMPOTENT. Every document has a fixed _id and is written with
// createOrReplace, and the images are drawn from fixed numbers, so the same
// bytes come out every run; Sanity names an image asset after the hash of its
// bytes, so a re-run uploads nothing new. Every array member carries _type and
// _key (PORTS.md card 95); run `npm run audit:data` after a write.
//
// It never deletes anything. Retiring the placeholders later is a
// backup-then-delete script, run dry first (rule 16); every id here starts
// with "placeholder-" so that script can find them.
// =============================================================================

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { loadEnv } from './lib/loadEnv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const OUT_DIR = resolve(__dirname, '.portfolio-placeholders');
const APPLY = process.argv.includes('--apply');

// ── 1. The images ────────────────────────────────────────────────────────────
// Tonal pairs taken from DESIGN.md's palette: paper, sand, dusk and ink.
const TONES = [
  { name: 'paper', stops: ['#F3EEE7', '#E3D6C6', '#C9B49D'] },
  { name: 'dusk', stops: ['#D6A898', '#9C6555', '#5A3830'] },
  { name: 'sand', stops: ['#EAE3D9', '#D8C3A8', '#A88A6C'] },
  { name: 'ink', stops: ['#5F514A', '#2F2824', '#12100E'] },
];
const PORTRAIT = { width: 1600, height: 2000 }; // 4:5
const LANDSCAPE = { width: 2100, height: 1400 }; // 3:2
const IMAGE_COUNT = 16;

/** Image n: its tone, its shape and the angle of its light. Fixed, so re-runs match. */
function imageSpec(n) {
  const tone = TONES[n % TONES.length];
  const shape = n % 3 === 1 ? LANDSCAPE : PORTRAIT;
  const angle = 20 + ((n * 37) % 140); // degrees, spread across the set
  return { n, tone, ...shape, angle, label: `Placeholder ${String(n + 1).padStart(2, '0')}` };
}

function svgFor({ width, height, tone, angle, label, n }) {
  const rad = (angle * Math.PI) / 180;
  const x2 = (0.5 + Math.cos(rad) / 2).toFixed(3);
  const y2 = (0.5 + Math.sin(rad) / 2).toFixed(3);
  const x1 = (1 - Number(x2)).toFixed(3);
  const y1 = (1 - Number(y2)).toFixed(3);
  const fs = Math.round(width * 0.018);
  const padX = Math.round(fs * 0.7);
  const padY = Math.round(fs * 0.45);
  const textW = Math.round(label.length * fs * 0.78);
  const boxX = Math.round(width * 0.03);
  const boxY = height - Math.round(width * 0.03) - (fs + padY * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0" stop-color="${tone.stops[0]}"/>
      <stop offset="0.55" stop-color="${tone.stops[1]}"/>
      <stop offset="1" stop-color="${tone.stops[2]}"/>
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.2"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${n + 1}" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.1"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#v)"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>
  <rect x="${boxX}" y="${boxY}" width="${textW + padX * 2}" height="${fs + padY * 2}" fill="#F3EEE7"/>
  <text x="${boxX + padX}" y="${boxY + padY + fs * 0.82}" font-family="Arial, Helvetica, sans-serif"
    font-size="${fs}" letter-spacing="${(fs * 0.14).toFixed(1)}" fill="#1F1B18">${label.toUpperCase()}</text>
</svg>`;
}

/** The JPEG bytes and the asset id Sanity will give them (image-<sha1>-<w>x<h>-jpg). */
async function makeImage(spec) {
  const buffer = await sharp(Buffer.from(svgFor(spec)))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const sha1 = createHash('sha1').update(buffer).digest('hex');
  return { ...spec, buffer, assetId: `image-${sha1}-${spec.width}x${spec.height}-jpg` };
}

// ── 2. The documents ─────────────────────────────────────────────────────────
const ref = (id) => ({ _type: 'reference', _ref: id });

function photoValue(img, alt, extra = {}) {
  return {
    _type: 'photo',
    asset: ref(img.assetId),
    alt,
    inArchive: true,
    ...extra,
  };
}

const describe = (img) =>
  `Placeholder image ${img.n + 1}: a ${img.tone.name}-toned gradient, ${
    img.width > img.height ? 'landscape' : 'portrait'
  }`;

const COLLABORATORS = [
  ['model', 'Model name', 'Model'],
  ['makeup', 'Makeup artist name', 'Makeup'],
  ['hair', 'Hair stylist name', 'Hair'],
  ['stylist', 'Stylist name', 'Styling'],
  ['assistant', 'Assistant name', 'Assistant'],
  ['retoucher', 'Retoucher name', 'Retouching'],
].map(([slug, name, defaultRole]) => ({
  _id: `placeholder-collaborator-${slug}`,
  _type: 'collaborator',
  name,
  defaultRole,
}));

function buildDocs(images) {
  const pubs = [
    { id: 'one', magazine: 'Magazine name', date: '2026-03-01', img: images[14] },
    { id: 'two', magazine: 'Second magazine name', date: '2025-10-01', img: images[15] },
  ].map(({ id, magazine, date, img }) => ({
    _id: `placeholder-publication-${id}`,
    _type: 'publication',
    magazine,
    issue: 'Issue 00',
    date,
    excerpt: 'A line or two from the piece goes here. Replace it in the Studio.',
    tearSheet: photoValue(img, `Placeholder tear sheet for ${magazine}, Issue 00`),
  }));

  // Story k: its cover and the photos that follow it in the set.
  const layout = [
    { cover: 0, photos: [1, 2, 3] },
    { cover: 4, photos: [5, 6, 7] },
    { cover: 8, photos: [9, 10] },
    { cover: 11, photos: [12, 13] },
  ];
  const words = ['one', 'two', 'three', 'four'];
  const stories = layout.map(({ cover, photos }, k) => {
    const word = words[k];
    return {
      _id: `placeholder-story-${word}`,
      _type: 'story',
      title: `Placeholder story ${word}`,
      slug: { _type: 'slug', current: `placeholder-story-${word}` },
      dek: 'A short line about this story. Replace it in the Studio.',
      date: `2026-0${k + 2}-15`,
      location: 'Location name',
      featured: k < 3,
      // Valid LexoRank strings, so the orderable list keeps this order.
      orderRank: `0|${k + 1}00000:`,
      cover: photoValue(images[cover], describe(images[cover])),
      photos: photos.map((i) =>
        photoValue(images[i], describe(images[i]), {
          _key: `photo-${word}-${i}`,
          caption: 'Placeholder caption',
        }),
      ),
      credits: COLLABORATORS.slice(0, 3 + k).map((c) => ({
        _type: 'credit',
        _key: `credit-${word}-${c._id.replace('placeholder-collaborator-', '')}`,
        collaborator: ref(c._id),
      })),
      ...(k === 0 ? { publication: ref(pubs[0]._id) } : {}),
    };
  });

  return [...COLLABORATORS, ...pubs, ...stories];
}

// ── 3. Run ───────────────────────────────────────────────────────────────────
const images = [];
for (let n = 0; n < IMAGE_COUNT; n++) images.push(await makeImage(imageSpec(n)));

mkdirSync(OUT_DIR, { recursive: true });
for (const img of images) {
  writeFileSync(
    resolve(OUT_DIR, `placeholder-${String(img.n + 1).padStart(2, '0')}.jpg`),
    img.buffer,
  );
}
console.log(`Made ${images.length} placeholder images in scripts/.portfolio-placeholders/:`);
for (const img of images) {
  console.log(`  ${img.label}  ${img.width}x${img.height}  ${img.tone.name}  ${img.assetId}`);
}

const docs = buildDocs(images);

// Every array member carries _type and _key (PORTS.md card 95); stop before a
// write if one does not.
for (const doc of docs) {
  for (const [field, value] of Object.entries(doc)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!item?._type || !item?._key) {
        throw new Error(`${doc._id}.${field} has an item without _type and _key`);
      }
    }
  }
}

const env = loadEnv(root);
const haveCredentials = !!(
  (env.PUBLIC_SANITY_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID) &&
  (env.SANITY_API_WRITE_TOKEN || env.SANITY_AUTH_TOKEN)
);

if (!haveCredentials) {
  if (APPLY) {
    console.error('\n--apply needs PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN in .env.');
    process.exit(1);
  }
  console.log(`\nPlan (no Sanity credentials in .env, so nothing is compared or written):`);
  for (const doc of docs) console.log(`  DRY createOrReplace ${doc._type} ${doc._id}`);
  console.log(`  DRY upload ${images.length} images`);
  console.log(`\nDRY RUN: ${docs.length} documents, ${images.length} images. Nothing written.`);
  process.exit(0);
}

// sanity-lib carries the client, the --apply gate and the production second
// factor: with --apply on production and no NCS_PRODUCTION_WRITE=yes, this
// import exits before any request.
const { client, dataset, apply, done } = await import('./lib/sanity-lib.mjs');
console.log(`\nDataset: ${dataset}`);

let changes = 0;
for (const img of images) {
  await apply(`upload ${img.label} as ${img.assetId}`, async () => {
    const asset = await client.assets.upload('image', img.buffer, {
      filename: `placeholder-${String(img.n + 1).padStart(2, '0')}.jpg`,
    });
    if (asset._id !== img.assetId) {
      throw new Error(`asset id ${asset._id} is not the expected ${img.assetId}; stopping`);
    }
  });
  changes++;
}

await apply(`createOrReplace ${docs.length} documents in one transaction`, async () => {
  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(doc);
  await tx.commit();
});
for (const doc of docs) console.log(`    ${doc._type} ${doc._id}`);
changes += docs.length;

done(changes);
if (APPLY) console.log('Next: npm run audit:data (must exit 0).');
