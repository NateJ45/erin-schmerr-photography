// Site-specific: the home page's "Cinema" (CoverHero.astro, 2026-11-20; kaatdm.com's one story per
// screen, with the Vault Reveal Hero opening and a knockout start).
//   - one h1, always shown; the first cover is the LCP (eager, high priority);
//   - every featured story has one full-screen frame linked to its story (the first one through
//     the opening frame's credit), in the three alternating layouts;
//   - the knockout and clipped copies are aria-hidden duplicates;
//   - the opening plays once per tab and leaves everything at rest, the header included;
//   - reduced motion and JavaScript off show everything at rest;
//   - nothing scrolls sideways at 320px.
// CI builds from the committed snapshot, whose covers may be placeholders, so the image checks
// only run when a frame holds a real photo.
import { test, expect, type Page } from '@playwright/test';

async function home(page: Page, { seen = true } = {}) {
  await page.addInitScript((seenIntro) => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
      if (seenIntro) sessionStorage.setItem('tate-intro', '1');
      // Automated browsers skip the opening unless asked (CoverHero.astro).
      else sessionStorage.setItem('tate-intro-test', '1');
    } catch {
      /* storage blocked: the opening and the loader skip themselves */
    }
  }, seen);
  await page.goto('/', { waitUntil: 'load' });
}

/** Every link into a story from the cinema, in order. */
const storyLinks = (page: Page) =>
  page
    .locator('[data-cinema] [data-frame-link]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href')));

test('one h1, shown, and the first cover is the eager, high-priority image', async ({ page }) => {
  await home(page);
  await expect(page.locator('h1')).toHaveCount(1);
  const h1 = page.locator('.cinema-open h1');
  await expect(h1).toBeVisible();
  await expect(h1).toHaveCSS('opacity', '1');
  const img = page.locator('.cinema-open img').first();
  if (await img.count()) {
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
  }
});

test('every featured story is one full-screen frame, linked to its story', async ({ page }) => {
  await home(page);
  const hrefs = await storyLinks(page);
  test.skip(hrefs.length === 0, 'no featured stories in this dataset');
  for (const h of hrefs) expect(h).toMatch(/^\/stories\/.+\/$/);
  expect(new Set(hrefs).size).toBe(hrefs.length);

  const frames = page.locator('[data-cinema-frame]');
  // The opening carries the first story; each other one has its own frame.
  await expect(frames).toHaveCount(hrefs.length - 1);
  const vh = page.viewportSize()!.height;
  for (const box of await frames.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height),
  ))
    expect(Math.abs(box - vh)).toBeLessThanOrEqual(2);

  // The layouts take turns by position: full bleed, overlap, knockout, overlap.
  const layouts = await frames.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-layout')),
  );
  const cycle = ['bleed', 'overlap', 'knock', 'overlap'];
  layouts.forEach((l, i) => expect(l).toBe(cycle[i % cycle.length]));

  // One real title per frame; the copies are hidden from assistive tech.
  await expect(page.locator('[data-cinema-frame] h2')).toHaveCount(hrefs.length - 1);
  for (const copy of await page
    .locator('[data-cinema] .cinema-knock, [data-cinema] .cine__type--over, [data-hero-knock]')
    .all())
    await expect(
      copy.locator('xpath=ancestor-or-self::*[@aria-hidden="true"]').first(),
    ).toHaveCount(1);
});

test('at rest the header shows and the knockout duplicate is out of sight', async ({ page }) => {
  await home(page);
  await expect(page.locator('.site-header')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-hero-knock]')).toHaveCSS('visibility', 'hidden');
});

test.describe('motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the opening plays once and ends at rest', async ({ page }) => {
    await home(page, { seen: false });
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('tate-intro')), { timeout: 8000 })
      .toBe('1');
    // The timeline is about 4 s; afterwards nothing is clipped, hidden or held.
    await expect(page.locator('html')).not.toHaveClass(/showcase-(intro|running)/, {
      timeout: 10000,
    });
    await expect(page.locator('.site-header')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-hero-media]')).toHaveCSS('clip-path', 'none');
    await expect(page.locator('[data-hero-knock]')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('.first-visit-loader')).toHaveCount(0);

    // A second load in the same tab shows the page at rest straight away.
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('html')).not.toHaveClass(/showcase-intro/);
  });

  test('a frame arrives in focus and its title settles', async ({ page }) => {
    await home(page);
    const frame = page.locator('[data-cinema-frame]').first();
    test.skip((await frame.count()) === 0, 'no second featured story');
    await frame.scrollIntoViewIfNeeded();
    const title = frame.locator('h2');
    await expect(title).toBeVisible();
    // Once played, the line masks are gone and the photo is sharp.
    await expect(frame.locator('.line')).toHaveCount(0, { timeout: 5000 });
    const img = frame.locator('img').first();
    if (await img.count()) await expect(img).toHaveCSS('filter', 'none');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no opening, nothing hidden, no snapping', async ({ page }) => {
    await home(page, { seen: false });
    await expect(page.locator('html')).not.toHaveClass(/showcase-intro/);
    await expect(page.locator('.site-header')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-cinema] .line')).toHaveCount(0);
    await expect(page.locator('html')).toHaveCSS('scroll-snap-type', 'none');
    for (const t of await page.locator('[data-cinema-frame] h2').all())
      await expect(t).toHaveCSS('opacity', '1');
  });
});

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false });
  test('every frame shows at rest, every story is a link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    const hrefs = await storyLinks(page);
    for (const h of hrefs) expect(h).toMatch(/^\/stories\/.+\/$/);
    for (const t of await page.locator('[data-cinema-frame] h2').all()) {
      await t.scrollIntoViewIfNeeded();
      await expect(t).toBeVisible();
    }
  });
});

test.describe('320px', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  test('nothing scrolls sideways', async ({ page }) => {
    await home(page);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(over).toBeLessThanOrEqual(0);
  });
});
