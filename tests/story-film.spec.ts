// Site-specific: the story page as a slideshow film (src/pages/stories/[slug].astro,
// src/scripts/story-film.ts, picked 2026-11-18).
//   - the first frame is on screen at load with the h1, and its image is the LCP (eager, high);
//   - Previous, Next, Pause/Play and the arrow keys work, and the Pause button is there from the start
//     (WCAG 2.2.2);
//   - reduced motion: no autoplay, no Play button, no push-in;
//   - without JavaScript the page is a vertical run of frames, the first one first;
//   - nothing scrolls sideways at 320px.
// CI builds from the committed snapshot, whose stories are placeholders without images, so the image
// checks only run when a frame holds a real photo. The WebGL burn needs CORS from the photo CDN and is
// not asserted here (the player falls back to a crossfade without it).
import { test, expect, cacheSanityImages, type Page } from './fixtures';

async function firstStory(page: Page): Promise<string> {
  await page.goto('/stories/', { waitUntil: 'domcontentloaded' });
  const hrefs = await page
    .locator('main a[href^="/stories/"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
  const slug = hrefs.find((h) => /^\/stories\/[^/]+\/$/.test(h));
  expect(slug, 'a story link on /stories/').toBeTruthy();
  return slug!;
}

async function open(page: Page) {
  const url = await firstStory(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
    } catch {
      /* storage blocked: the loader skips itself anyway */
    }
  });
  await page.goto(url, { waitUntil: 'load' });
  return url;
}

const film = (page: Page) => page.locator('[data-film]');
const frames = (page: Page) => page.locator('[data-film] [data-film-frame]');

test.describe('with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the first frame is shown at load, with the h1 and a visible Pause', async ({ page }) => {
    await open(page);
    await expect(film(page)).toHaveAttribute('data-mode', 'film');
    await expect(frames(page).first()).toHaveClass(/is-on/);
    await expect(frames(page).first()).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('[data-film] h1')).toBeInViewport();
    const pause = page.locator('[data-film-play]');
    await expect(pause).toBeVisible();
    await expect(pause).toHaveText('Pause');
    await expect(pause).toBeInViewport();
    const img = frames(page).first().locator('img').first();
    if (await img.count()) {
      await expect(img).toHaveAttribute('loading', 'eager');
      await expect(img).toHaveAttribute('fetchpriority', 'high');
      // The LCP frame is never blurred or faded in.
      const look = await img.evaluate((el) => ({
        filter: getComputedStyle(el).filter,
        opacity: getComputedStyle(el).opacity,
      }));
      expect(look).toEqual({ filter: 'none', opacity: '1' });
    }
  });

  test('Pause stops the film and Play starts it again', async ({ page }) => {
    await open(page);
    const play = page.locator('[data-film-play]');
    await play.click();
    await expect(play).toHaveText('Play');
    await expect(film(page)).toHaveAttribute('data-paused', '');
    await page.waitForTimeout(5500);
    await expect(frames(page).first()).toHaveClass(/is-on/);
    await play.click();
    await expect(play).toHaveText('Pause');
    await expect(film(page)).not.toHaveAttribute('data-paused', '');
  });

  test('Next, Previous and the arrow keys move between frames', async ({ page }) => {
    await open(page);
    await page.locator('[data-film-play]').click();
    const next = page.getByRole('button', { name: 'Next frame' });
    const prev = page.getByRole('button', { name: 'Previous frame' });
    await expect(prev).toHaveAttribute('aria-disabled', 'true');
    await next.click();
    await expect(frames(page).nth(1)).toHaveClass(/is-on/, { timeout: 5000 });
    await expect(frames(page).first()).not.toHaveClass(/is-on/);
    await prev.click();
    await expect(frames(page).first()).toHaveClass(/is-on/, { timeout: 5000 });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('ArrowRight');
    await expect(frames(page).nth(1)).toHaveClass(/is-on/, { timeout: 5000 });
    await page.keyboard.press('ArrowLeft');
    await expect(frames(page).first()).toHaveClass(/is-on/, { timeout: 5000 });
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no autoplay, no Play button, no push-in; Next cuts to the next frame', async ({ page }) => {
    await open(page);
    await expect(film(page)).toHaveAttribute('data-mode', 'film');
    await expect(page.locator('[data-film-play]')).toBeHidden();
    await page.waitForTimeout(5500);
    await expect(frames(page).first()).toHaveClass(/is-on/);
    const img = frames(page).first().locator('img').first();
    if (await img.count()) await expect(img).toHaveCSS('animation-name', 'none');
    await page.getByRole('button', { name: 'Next frame' }).click();
    await expect(frames(page).nth(1)).toHaveClass(/is-on/);
    await expect(page.locator('[data-film-live]')).toContainText('Frame 2 of');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the film is a vertical run of frames, first frame first', async ({ page }) => {
    await open(page);
    await expect(film(page)).not.toHaveAttribute('data-mode', 'film');
    await expect(page.locator('[data-film-controls]')).toBeHidden();
    await expect(frames(page).first()).toBeInViewport();
    const boxes = await frames(page).evaluateAll((els) =>
      els.slice(0, 3).map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, opacity: getComputedStyle(el).opacity };
      }),
    );
    expect(boxes.length).toBeGreaterThan(1);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1);
    }
    for (const b of boxes) expect(b.opacity).toBe('1');
  });
});

test.describe('320px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  for (const js of [true, false]) {
    test(`no sideways scroll ${js ? 'as a film' : 'without JavaScript'}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: 320, height: 720 },
        javaScriptEnabled: js,
      });
      await cacheSanityImages(ctx);
      const page = await ctx.newPage();
      await open(page);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(over).toBeLessThanOrEqual(0);
      await ctx.close();
    });
  }
});
