// Site-specific: the home page's story showcase (CoverHero.astro, 2026-11-20; Martin Briceno's
// layout from Details with the Vault Reveal Hero opening).
//   - one h1; the first cover is the LCP (eager, high priority);
//   - at rest (opening already seen, or reduced motion) the first story's words show and the
//     header is visible;
//   - pointing at or focusing a thumbnail brings that story up;
//   - the opening plays once per tab and leaves everything at rest, the header included;
//   - with JavaScript off every thumbnail is a plain link and the first story shows;
//   - nothing scrolls sideways at 320px.
// CI builds from the committed snapshot, whose featured stories are placeholders without an image,
// so the image checks only run when a slide holds a real photo.
import { test, expect, type Page } from '@playwright/test';

async function home(page: Page, { seen = true } = {}) {
  await page.addInitScript((seenIntro) => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
      if (seenIntro) sessionStorage.setItem('tate-intro', '1');
    } catch {
      /* storage blocked: the opening and the loader skip themselves */
    }
  }, seen);
  await page.goto('/', { waitUntil: 'load' });
}

test('one h1, and the first cover is the eager, high-priority image', async ({ page }) => {
  await home(page);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.cover-hero h1')).toHaveCount(1);
  const img = page.locator('.cover-hero__slide').first().locator('img').first();
  if (await img.count()) {
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
  }
});

test('at rest the first story shows and the header is visible', async ({ page }) => {
  await home(page);
  const titles = page.locator('.cover-hero__story');
  test.skip((await titles.count()) === 0, 'no featured stories in this dataset');
  await expect(titles.first()).toBeVisible();
  await expect(page.locator('.site-header')).toHaveCSS('opacity', '1');
});

test.describe('motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a thumbnail brings its story up', async ({ page }) => {
    await home(page);
    const thumbs = page.locator('[data-thumb]');
    test.skip((await thumbs.count()) < 2, 'fewer than two featured stories');
    await thumbs.nth(1).focus();
    await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.cover-hero__story').nth(1)).toHaveClass(/is-active/);
    await expect(page.locator('.cover-hero__story').nth(1)).toBeVisible();
  });

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
    await expect(page.locator('.first-visit-loader')).toHaveCount(0);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no opening, nothing hidden', async ({ page }) => {
    await home(page, { seen: false });
    await expect(page.locator('html')).not.toHaveClass(/showcase-intro/);
    await expect(page.locator('.site-header')).toHaveCSS('opacity', '1');
    await expect(page.locator('.cover-hero .line')).toHaveCount(0);
  });
});

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false });
  test('the first story shows and every thumbnail is a link', async ({ page }) => {
    await page.goto('/');
    const titles = page.locator('.cover-hero__story');
    test.skip((await titles.count()) === 0, 'no featured stories in this dataset');
    await expect(titles.first()).toBeVisible();
    const hrefs = await page
      .locator('[data-thumb]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    for (const h of hrefs) expect(h).toMatch(/^\/stories\/.+\/$/);
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
