// Safe to edit by hand
// =============================================================================
// make-cutouts.mjs - the subject cut-outs for the home "Cinema" covers
// =============================================================================
// The cover frames on the home page (CoverHero.astro, DESIGN.md "Cover frame")
// set the story title huge BEHIND the person in the photo. That needs the person
// on their own layer: a transparent copy of the cover holding only the subject,
// laid exactly over the photo. This script makes it.
//
// For each featured story (the ones the Cinema shows, same rule as
// getFeaturedStories: the Featured ones, or every story when none is ticked,
// up to 8; --all for every story) it:
//   1. fetches the cover's ORIGINAL file from the Sanity CDN;
//   2. runs a portrait-matting model LOCALLY (MODNet, Apache-2.0, through
//      @huggingface/transformers, Apache-2.0): nothing leaves this machine but
//      the finished cut-out;
//   3. keeps the photo's own pixels with the matte as the alpha channel, at the
//      cover's full size, so the cut-out registers with the photo exactly (the
//      site applies the cover's crop and hotspot to both);
//   4. measures the subject from the matte (bounding box, where the head is)
//      so the page can put the title behind the head without guessing;
//   5. with --apply, uploads the cut-out as an image asset and sets the story's
//      `coverCutout` field (image + `cutoutOf`, the cover asset it was made from,
//      + `subject`, the measurements). Rule 15: derived by this script, never
//      typed, and read-only in the Studio.
//
// A cut-out whose `cutoutOf` no longer matches the cover (the cover changed) is
// STALE: the site ignores it and draws the cover without one, and the next run
// remakes it. Up-to-date cut-outs are skipped unless --force.
//
// Modes:
//   node scripts/make-cutouts.mjs                        # dry run: prints the plan, runs no model
//   node scripts/make-cutouts.mjs --out <dir>            # makes the cut-outs into <dir> (outside
//                                                        # the repo), writes nothing to Sanity
//   node scripts/make-cutouts.mjs --out <dir> --compare <dir>   # also side-by-side check images
//   NCS_PRODUCTION_WRITE=yes node scripts/make-cutouts.mjs --apply   # upload and set coverCutout
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/make-cutouts.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
// Options: --only <slug>, --all, --force.
//
// The --out folder is what the dev server reads with CINEMA_CUTOUTS_DIR=<dir>
// (astro.config.mjs, dev only), to see the effect before anything is written.
// Never point it inside the repo: her photographs never go in git.
//
// The model library is NOT a dependency of the site (it carries the ONNX
// runtime, about 200 MB, which CI would install on every run for nothing).
// Install it once into a folder outside the repo and point at it:
//   npm install --prefix <tools dir> @huggingface/transformers@4.3.2
//   CUTOUT_TOOLS_DIR=<tools dir> node scripts/make-cutouts.mjs --out <dir>
// The model weights (Xenova/modnet, about 25 MB) download on first use into
// the library's own cache.
//
// Production writes follow the write protocol (.claude/rules/data-scripts.md):
// back up (sanity dataset export production <file outside the repo> --raw),
// dry run, --apply with NCS_PRODUCTION_WRITE=yes, then verify. The schema field
// must be deployed (the PR merged and the site rebuilt) before the first
// --apply, or the Studio offers to "Remove field" (rule 1).
// =============================================================================

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { client, dataset, APPLY, apply, done, ROOT } from './lib/sanity-lib.mjs';

const MODEL = 'Xenova/modnet';
const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : undefined;
};
const OUT = arg('--out') ? resolve(arg('--out')) : null;
const COMPARE = arg('--compare') ? resolve(arg('--compare')) : null;
const ONLY = arg('--only');
const ALL = argv.includes('--all');
const FORCE = argv.includes('--force');

// Her photographs never go in the repo: refuse an --out or --compare inside it.
const repoTop = ROOT.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0];
for (const dir of [OUT, COMPARE].filter(Boolean)) {
  const inside = (top) => dir === top || dir.startsWith(top + sep) || dir.startsWith(top + '/');
  if (inside(repoTop) || inside(ROOT)) {
    console.error(`Refusing to write photographs inside the repo: ${dir}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for a look in a REPL; no I/O)
// ---------------------------------------------------------------------------

/**
 * The subject's measurements from an alpha matte (Uint8 0-255, width*height),
 * as FRACTIONS of the image (0-1), or null when the matte holds no clear person
 * (under 4% or over 90% of the frame). The head is the top of the silhouette:
 * its top is the first row wider than 1.5% of the image (stray hair ignored),
 * its centre the alpha-weighted mean x of the rows just under that, and its
 * height about 1.35 times its width, capped at a quarter of the subject.
 */
export function measureSubject(alpha, width, height, threshold = 128) {
  const rowCount = new Uint32Array(height);
  let total = 0;
  let left = width;
  let right = -1;
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    let c = 0;
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] >= threshold) {
        c++;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    rowCount[y] = c;
    total += c;
    if (c > 0) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  const coverage = total / (width * height);
  // Under 4% is a stray scrap (a group scene where the model found nobody
  // whole); over 90% is the model taking the whole frame.
  if (top < 0 || coverage < 0.04 || coverage > 0.9) return null;

  const minRow = Math.max(2, Math.round(width * 0.015));
  let headTop = top;
  while (headTop < bottom && rowCount[headTop] < minRow) headTop++;
  const subjectH = bottom - top + 1;

  // Head width: the median row width a little under the crown.
  const a = Math.min(bottom, headTop + Math.round(subjectH * 0.03));
  const b = Math.min(bottom, headTop + Math.round(subjectH * 0.08));
  const widths = [];
  for (let y = a; y <= b; y++) widths.push(rowCount[y]);
  widths.sort((p, q) => p - q);
  const headW = widths.length ? widths[Math.floor(widths.length / 2)] : rowCount[headTop];
  const headH = Math.min(Math.round(headW * 1.35), Math.round(subjectH * 0.25));
  const headBottom = Math.min(bottom, headTop + Math.max(headH, 1));

  let sx = 0;
  let sw = 0;
  for (let y = headTop; y <= headBottom; y++) {
    for (let x = 0; x < width; x++) {
      const v = alpha[y * width + x];
      if (v >= threshold) {
        sx += x * v;
        sw += v;
      }
    }
  }
  const headX = sw ? sx / sw : (left + right) / 2;
  const f = (n, d) => Math.round((n / d) * 10000) / 10000;
  return {
    top: f(top, height),
    bottom: f(bottom + 1, height),
    left: f(left, width),
    right: f(right + 1, width),
    headTop: f(headTop, height),
    headBottom: f(headBottom, height),
    headX: f(headX, width),
    coverage: f(total, width * height),
  };
}

/**
 * Tighten a soft matte a little: values under `lo` go clear, over `hi` solid,
 * linear between. MODNet leaves a faint haze round the figure that would show
 * as a ghost over the masthead; hair keeps its soft ramp.
 */
export function tightenMatte(alpha, lo = 20, hi = 235) {
  const out = new Uint8Array(alpha.length);
  const span = hi - lo;
  for (let i = 0; i < alpha.length; i++) {
    const v = alpha[i];
    out[i] = v <= lo ? 0 : v >= hi ? 255 : Math.round(((v - lo) / span) * 255);
  }
  return out;
}

/**
 * Keep only the largest connected figure in the matte (on a grid a quarter of
 * the size, grown by one cell so soft hair edges survive). MODNet sometimes
 * also lifts a prop that is not touching the person (a hat on the floor, a wig
 * on a stand, a window blind); those would float in front of the masthead.
 * Things the person holds or leans on stay, since they touch.
 */
export function keepLargestFigure(alpha, width, height, threshold = 128, cell = 4) {
  const gw = Math.ceil(width / cell);
  const gh = Math.ceil(height / cell);
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (alpha[y * width + x] >= threshold) grid[((y / cell) | 0) * gw + ((x / cell) | 0)] = 1;
  const label = new Int32Array(gw * gh);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  const stack = [];
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i] || label[i]) continue;
    next++;
    let size = 0;
    stack.push(i);
    label[i] = next;
    while (stack.length) {
      const j = stack.pop();
      size++;
      const x = j % gw;
      const y = (j / gw) | 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const k = ny * gw + nx;
        if (grid[k] && !label[k]) {
          label[k] = next;
          stack.push(k);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = next;
    }
  }
  if (!best) return alpha;
  // The figure's cells grown by one, so the soft edge just outside it stays.
  const keep = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      if (label[y * gw + x] !== best) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < gw && ny < gh) keep[ny * gw + nx] = 1;
        }
    }
  const out = new Uint8Array(alpha.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (keep[((y / cell) | 0) * gw + ((x / cell) | 0)]) out[i] = alpha[i];
    }
  return out;
}

/** What to do for one story: 'new', 'stale' (cover changed), 'current', or 'no-cover'. */
export function statusOf(story) {
  if (!story.coverAsset) return 'no-cover';
  if (!story.cutoutOf) return 'new';
  return story.cutoutOf === story.coverAsset ? 'current' : 'stale';
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

async function loadTransformers() {
  try {
    return await import('@huggingface/transformers');
  } catch {
    const dir = process.env.CUTOUT_TOOLS_DIR;
    if (!dir) {
      console.error(
        'The matting library is not installed. Install it OUTSIDE the repo, then point at it:\n' +
          '  npm install --prefix <tools dir> @huggingface/transformers@4.3.2\n' +
          '  CUTOUT_TOOLS_DIR=<tools dir> node scripts/make-cutouts.mjs ...',
      );
      process.exit(1);
    }
    const req = createRequire(resolve(dir, 'package.json'));
    return import(pathToFileURL(req.resolve('@huggingface/transformers')).href);
  }
}

let matter = null;
async function getMatter() {
  if (matter) return matter;
  const t = await loadTransformers();
  const model = await t.AutoModel.from_pretrained(MODEL, { dtype: 'fp32' });
  const processor = await t.AutoProcessor.from_pretrained(MODEL);
  matter = { t, model, processor };
  return matter;
}

/** The photo (RGB, full size) and its cut-out (RGBA WebP) and measurements. */
async function cutOut(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status} for ${url}`);
  const input = Buffer.from(await res.arrayBuffer());
  // Bake the EXIF orientation in, so the pixels match what the CDN serves.
  const { data: rgb, info } = await sharp(input)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const { t, model, processor } = await getMatter();
  const image = new t.RawImage(new Uint8ClampedArray(rgb), width, height, 3);
  const { pixel_values } = await processor(image);
  const { output } = await model({ input: pixel_values });
  const small = await t.RawImage.fromTensor(output[0].mul(255).to('uint8'));
  // Upscale the matte to the photo's own size with a smooth filter. sharp can
  // hand a one-band raw image back with extra bands, so take band 0 and check.
  const { data: matte, info: mi } = await sharp(Buffer.from(small.data), {
    raw: { width: small.width, height: small.height, channels: 1 },
  })
    .resize(width, height, { kernel: 'lanczos3', fit: 'fill' })
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (mi.channels !== 1 || matte.length !== width * height)
    throw new Error(`matte came back ${mi.width}x${mi.height}x${mi.channels}`);
  const alpha = keepLargestFigure(tightenMatte(matte), width, height);
  const subject = measureSubject(alpha, width, height);

  const webp = await sharp(rgb, { raw: { width, height, channels: 3 } })
    .joinChannel(Buffer.from(alpha), { raw: { width, height, channels: 1 } })
    .webp({ quality: 88, alphaQuality: 100, effort: 5 })
    .toBuffer();
  return { input, webp, subject, width, height };
}

/** A side-by-side check image: the photo, the cut-out on her dusk, the cut-out on paper. */
async function compareImage({ input, webp, width, height }) {
  const w = Math.min(width, 900);
  const h = Math.round((height * w) / width);
  const photo = await sharp(input).rotate().resize(w, h).jpeg().toBuffer();
  const cut = await sharp(webp).resize(w, h).png().toBuffer();
  const on = async (hex) =>
    sharp({ create: { width: w, height: h, channels: 3, background: hex } })
      .composite([{ input: cut }])
      .jpeg()
      .toBuffer();
  return sharp({ create: { width: w * 3 + 20, height: h, channels: 3, background: '#ffffff' } })
    .composite([
      { input: photo, left: 0, top: 0 },
      { input: await on('#7a4a40'), left: w + 10, top: 0 },
      { input: await on('#f3eee7'), left: w * 2 + 20, top: 0 },
    ])
    .jpeg({ quality: 85 })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const rows = await client.fetch(
  `*[_type == "story" && defined(slug.current) && !(_id in path("drafts.**"))
     && !(_id match "placeholder-*")] | order(orderRank asc, date desc){
    _id, _rev, title, "slug": slug.current, featured,
    "coverAsset": cover.asset._ref,
    "coverUrl": cover.asset->url,
    "cutoutOf": coverCutout.cutoutOf
  }`,
);
const featured = rows.filter((r) => r.featured);
let stories = ALL ? rows : (featured.length ? featured : rows).slice(0, 8);
if (ONLY) stories = rows.filter((r) => r.slug === ONLY);

console.log(
  `Cut-outs for ${stories.length} ${ALL ? '' : 'featured '}stor${stories.length === 1 ? 'y' : 'ies'} in ${dataset}` +
    (OUT ? `, into ${OUT}` : '') +
    (APPLY ? ', uploading to Sanity' : ''),
);
const plan = stories.map((s) => ({ s, status: statusOf(s) }));
for (const { s, status } of plan) {
  const act =
    status === 'no-cover'
      ? 'skip (no cover)'
      : status === 'current' && !FORCE
        ? 'skip (up to date)'
        : `${status === 'stale' ? 'remake (cover changed)' : status === 'current' ? 'remake (--force)' : 'make'}`;
  console.log(`  ${s.slug.padEnd(34)} ${act}`);
}

const todo = plan.filter(
  ({ status }) => status === 'new' || status === 'stale' || (status === 'current' && FORCE),
);
if (!OUT && !APPLY) {
  console.log(
    `\nDRY RUN: ${todo.length} cut-out(s) to make. No model run, nothing written.\n` +
      'Add --out <dir> to make them locally, or --apply (with NCS_PRODUCTION_WRITE=yes) to upload.',
  );
} else {
  await run();
}

async function run() {
  if (OUT) mkdirSync(OUT, { recursive: true });
  if (COMPARE) mkdirSync(COMPARE, { recursive: true });
  let changes = 0;
  for (const { s } of todo) {
    process.stdout.write(`  ${s.slug}: matting... `);
    const made = await cutOut(s.coverUrl);
    if (!made.subject) {
      console.log('no clear subject found; left without a cut-out.');
      continue;
    }
    const { subject } = made;
    console.log(
      `${made.width}x${made.height}, subject ${(subject.coverage * 100).toFixed(0)}% of the frame, head top ${(subject.headTop * 100).toFixed(0)}%`,
    );
    if (OUT) {
      writeFileSync(resolve(OUT, `${s._id}.webp`), made.webp);
      writeFileSync(
        resolve(OUT, `${s._id}.json`),
        JSON.stringify({ slug: s.slug, cutoutOf: s.coverAsset, subject }, null, 2) + '\n',
      );
    }
    if (COMPARE) writeFileSync(resolve(COMPARE, `cutout-${s.slug}.jpg`), await compareImage(made));
    if (APPLY) {
      await apply(`${s.slug}: upload the cut-out and set coverCutout`, async () => {
        const asset = await client.assets.upload('image', made.webp, {
          filename: `${s.slug}-cutout.webp`,
        });
        // ifRevisionId: refuse if someone edited the story since the read above.
        await client
          .patch(s._id)
          .ifRevisionId(s._rev)
          .set({
            coverCutout: {
              _type: 'image',
              asset: { _type: 'reference', _ref: asset._id },
              cutoutOf: s.coverAsset,
              subject: { _type: 'cutoutSubject', ...subject },
            },
          })
          .commit();
      });
      changes++;
    }
  }
  if (APPLY) done(changes);
  else console.log(`\nLOCAL: cut-outs made into ${OUT}. Nothing written to Sanity.`);
}
