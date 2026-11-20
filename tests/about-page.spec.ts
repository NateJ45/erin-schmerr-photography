// Site-specific: the boutique About page (2026-11-20; DESIGN.md "About page"): the opening, the
// portrait and story, the approach, behind the scenes, "As seen in" and the signed close.
//   - it reads with JavaScript off: the headline is whole text, every paragraph is full ink, every
//     photo still, and the "As seen in" names and caption list are there;
//   - under reduced motion nothing is split, faded or moved;
//   - with motion the headline splits into line masks and the story paragraphs start soft;
//   - "As seen in": focusing a name with the keyboard dims the others and shows its card (fine
//     pointer, wide screen); on touch every name stays solid and the caption list shows;
//   - nothing scrolls sideways at 320px.
// CI builds from the committed snapshot (the About layout from scripts/set-about-sections.mjs, the
// photos and publications as placeholders); every check here holds for those too.
import { test, expect, type Page } from './fixtures';

async function open(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
    } catch {
      /* storage blocked: the loader skips itself anyway */
    }
  });
  await page.goto('/about/', { waitUntil: 'load' });
}

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false });

  test('the page reads finished', async ({ page }) => {
    await open(page);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1.locator('.about-line-mask')).toHaveCount(0);
    await expect(h1).toBeVisible();
    // Every story paragraph at full ink.
    const colors = await page
      .locator('[data-about-lighten] p')
      .evaluateAll((ps) => ps.map((p) => getComputedStyle(p).color));
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) expect(c).toBe('rgb(31, 27, 24)');
    // The five figures, the contents line and the booking link.
    await expect(page.locator('.about-process__fig')).toHaveCount(5);
    expect(await page.locator('.press-contents__name').count()).toBeGreaterThan(0);
    await expect(page.locator('.signed-close a')).toHaveAttribute('href', /\/$/);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing is split, faded or moved', async ({ page }) => {
    await open(page);
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    await expect(page.locator('h1 .about-line-mask')).toHaveCount(0);
    const last = page.locator('[data-about-lighten] p').last();
    await expect(last).toHaveCSS('color', 'rgb(31, 27, 24)');
    const transform = await page
      .locator('[data-about-parallax] > *')
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });
});

test.describe('with motion', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } });

  test('the headline rises in line masks and the story starts soft', async ({ page }) => {
    await open(page);
    await expect(page.locator('h1 .about-line-mask').first()).toBeAttached();
    // The words are all still there, in order, inside the masks.
    const text = (await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim();
    expect(text.length).toBeGreaterThan(10);
    // A paragraph below the fold is still the soft (muted, AA) colour; scrolled to the middle of
    // the screen it is full ink.
    const last = page.locator('[data-about-lighten] p').last();
    const ink = 'rgb(31, 27, 24)';
    expect(await last.evaluate((p) => getComputedStyle(p).color)).not.toBe(ink);
    await last.evaluate((p) => {
      const r = p.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.3);
    });
    await expect(last).toHaveCSS('color', ink);
  });
});

test.describe('"As seen in", fine pointer, wide screen', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('focusing a name dims the others and shows its card', async ({ page }) => {
    await open(page);
    const names = page.locator('.press-contents__name');
    const n = await names.count();
    test.skip(n < 2, 'needs two magazines to compare');
    await names.first().focus();
    await expect(names.first()).toBeFocused();
    await expect(names.nth(1)).toHaveCSS('opacity', '0.22');
    await expect(names.first()).toHaveCSS('opacity', '1');
    const card = page.locator('.press-contents__card').first();
    await expect(card).toBeVisible();
    // The cards are aria-hidden copies; the caption list carries the words for screen readers.
    await expect(card).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.press-contents__captions li')).toHaveCount(n);
  });
});

test.describe('"As seen in", touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('every name stays solid and the caption list shows', async ({ page }) => {
    await open(page);
    const names = page.locator('.press-contents__name');
    await names.first().focus();
    const n = await names.count();
    for (let i = 0; i < n; i++) await expect(names.nth(i)).toHaveCSS('opacity', '1');
    await expect(page.locator('.press-contents__card').first()).toBeHidden();
    await expect(page.locator('.press-contents__captions')).toBeVisible();
  });
});

async function sideways(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test.describe('320px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('nothing scrolls sideways', async ({ page }) => {
    await open(page);
    expect(await sideways(page)).toBeLessThanOrEqual(0);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await sideways(page)).toBeLessThanOrEqual(0);
  });
});
