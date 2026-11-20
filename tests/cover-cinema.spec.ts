// Site-specific: the home page's "Cinema" (CoverHero.astro, 2026-11-20; kaatdm.com's one story per
// screen, with the Vault Reveal Hero opening and a knockout start).
//   - one h1, always shown; the first cover is the LCP (eager, high priority);
//   - every featured story has one full-screen frame linked to its story (the first one through
//     the opening frame's credit), in the alternating layouts (cover, overlap, knockout);
//   - the knockout and clipped copies are aria-hidden duplicates;
//   - the opening plays once per tab and leaves everything at rest, the header included;
//   - reduced motion and JavaScript off show everything at rest;
//   - nothing scrolls sideways at 320px.
// CI builds from the committed snapshot, whose covers may be placeholders, so the image checks
// only run when a frame holds a real photo.
import { test, expect, type Page } from '@playwright/test';

async function home(page: Page, { seen = true, motion = false } = {}) {
  await page.addInitScript(
    ({ seenIntro, frameMotion }) => {
      try {
        localStorage.setItem('es-first-visit-seen', '1');
        if (seenIntro) sessionStorage.setItem('tate-intro', '1');
        // Automated browsers skip the opening unless asked (CoverHero.astro).
        else sessionStorage.setItem('tate-intro-test', '1');
        // ...and see the story frames at rest unless asked (cover-hero.ts).
        if (frameMotion) sessionStorage.setItem('tate-motion-test', '1');
      } catch {
        /* storage blocked: the opening and the loader skip themselves */
      }
    },
    { seenIntro: seen, frameMotion: motion },
  );
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

  // The layouts take turns by position (CoverHero.astro CYCLE): every other frame a magazine
  // cover, between them overlap (photo left), knockout, overlap (photo right). The full bleed
  // frame left the rotation on 2026-11-20.
  const layouts = await frames.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-layout')),
  );
  const cycle = ['cover', 'overlap', 'cover', 'knock', 'cover', 'overlap'];
  layouts.forEach((l, i) => expect(l).toBe(cycle[i % cycle.length]));

  // One real title per frame; the copies are hidden from assistive tech.
  await expect(page.locator('[data-cinema-frame] h2')).toHaveCount(hrefs.length - 1);
  for (const copy of await page
    .locator(
      '[data-cinema] .cinema-knock, [data-cinema] .cine__type--over, [data-cinema] .cover__mast, [data-hero-knock]',
    )
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

  // The 2026-11-20 live bug: a frame stopped at its snap point after a real wheel
  // scroll stayed soft and its title half-risen. The motion is time-based, so
  // wherever the visitor stops the frame ends exactly at rest.
  test('a frame reached with the wheel ends sharp, its title fully in', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await home(page, { motion: true });
    const frame = page.locator('[data-cinema-frame][data-layout="overlap"]').first();
    test.skip((await frame.count()) === 0, 'no overlap frame in this dataset');
    // Before it arrives it waits below its mask: the motion really is on.
    await expect(frame.locator('.line').first()).toBeAttached();

    await page.mouse.move(640, 400);
    for (let i = 0; i < 40; i++) {
      const top = await frame.evaluate((el) => el.getBoundingClientRect().top);
      if (top <= 120) break;
      await page.mouse.wheel(0, Math.min(240, top - 60));
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(2000);

    const rest = await frame.evaluate((el) => {
      const img = el.querySelector('img');
      const titles = [...el.querySelectorAll<HTMLElement>('[data-frame-slide]')];
      return {
        top: Math.round(el.getBoundingClientRect().top),
        filter: img ? getComputedStyle(img).filter : 'none',
        imgTransform: img ? getComputedStyle(img).transform : 'none',
        titleTransforms: titles.map((t) => getComputedStyle(t).transform),
        lines: el.querySelectorAll('.line').length,
      };
    });
    expect(rest.top).toBeLessThan(200);
    expect(['none', 'blur(0px)']).toContain(rest.filter);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(rest.imgTransform);
    for (const t of rest.titleTransforms) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(t);
    expect(rest.lines).toBe(0);
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
