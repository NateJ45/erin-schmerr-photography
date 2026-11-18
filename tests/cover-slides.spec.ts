// Site-specific: the home page's cover slides (CoverHero.astro, picked 2026-11-18).
//   - the first slide is the h1's home, its image is the LCP (eager, high priority) and it is never
//     animated, so nothing in the first viewport starts soft or hidden;
//   - every slide is sticky and a screen tall, so the next slides up over the last, and the first
//     slide's caption is on screen at load;
//   - later slides rack into focus on a scroll-driven animation, and reduced motion turns it off;
//   - nothing scrolls sideways at 320px.
// CI builds from the committed snapshot, whose featured stories are placeholders without an image,
// so the image checks only run when a slide holds a real photo.
import { test, expect, type Page } from '@playwright/test';

async function home(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
    } catch {
      /* storage blocked: the loader skips itself anyway */
    }
  });
  await page.goto('/', { waitUntil: 'load' });
}

test('the first slide holds the h1 and starts sharp', async ({ page }) => {
  await home(page);
  const slides = page.locator('.cover-hero .cover-slide');
  test.skip((await slides.count()) === 0, 'no featured stories in this dataset');
  const first = slides.first();
  await expect(first.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  const img = first.locator('img').first();
  if (await img.count()) {
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
    const look = await img.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { filter: cs.filter, opacity: cs.opacity, animation: cs.animationName };
    });
    expect(look).toEqual({ filter: 'none', opacity: '1', animation: 'none' });
  }
});

test('every slide is sticky and a screen tall; the first caption is in view at load', async ({
  page,
}) => {
  await home(page);
  const slides = page.locator('.cover-hero .cover-slide');
  test.skip((await slides.count()) < 2, 'fewer than two featured stories');
  const m = await slides.evaluateAll((els) =>
    els.map((el) => ({
      position: getComputedStyle(el).position,
      height: Math.round(el.getBoundingClientRect().height),
    })),
  );
  const vh = await page.evaluate(() => window.innerHeight);
  for (const s of m) {
    expect(s.position).toBe('sticky');
    expect(Math.abs(s.height - vh)).toBeLessThanOrEqual(2);
  }
  // The first slide starts under the header; its caption is lifted so it is on screen at load.
  const cap = await slides.first().locator('.cover-slide__caption').boundingBox();
  expect(cap).not.toBeNull();
  expect(cap!.y + cap!.height).toBeLessThanOrEqual(vh);
});

test.describe('motion', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('later slides rack into focus where scroll-driven animations exist', async ({ page }) => {
    await home(page);
    const second = page.locator('.cover-hero .cover-slide').nth(1).locator('img').first();
    test.skip((await second.count()) === 0, 'no second slide image');
    const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    test.skip(!supported, 'this browser has no view() timelines; the slides stand still');
    await expect(second).toHaveCSS('animation-name', 'cover-rack');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no slide animates', async ({ page }) => {
    await home(page);
    const names = await page
      .locator('.cover-hero .cover-slide img')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
    for (const n of names) expect(n).toBe('none');
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
