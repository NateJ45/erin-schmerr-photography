// Site-specific: /stories/ as a film reel (StoryReel.astro, src/scripts/story-reel.ts, picked
// 2026-11-18).
//   - one flat track: the h1 card, an h2 card per decade, each story one link to /stories/<slug>/
//     holding an h3;
//   - with motion, a mouse and a wide screen the stage pins under the header and the page's vertical
//     scroll slides the track; the run's height comes from CSS alone and matches the track, so the
//     last frame ends inside the screen when the reel ends;
//   - a frame reached with the keyboard is brought into view (the stage clips sideways);
//   - reduced motion and narrow screens get a native sideways strip with snap; nothing on the page
//     scrolls sideways at 320px.
// CI builds from the committed snapshot (placeholder stories without images); every check here
// holds for those too.
import { test, expect, type Page } from './fixtures';

async function open(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
    } catch {
      /* storage blocked: the loader skips itself anyway */
    }
  });
  await page.goto('/stories/', { waitUntil: 'load' });
}

const frames = (page: Page) => page.locator('.reel__frame');

test('one track: the h1, a decade h2 per chapter, each story one link with an h3', async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.reel__track > .reel__card--title h1')).toHaveCount(1);
  const h2s = await page.locator('.reel__track > .reel__card--chapter h2').allTextContents();
  expect(h2s.length).toBeGreaterThan(0);
  for (const h of h2s) expect(h.trim()).toMatch(/^(The \d{4}s|Undated)$/);
  const n = await frames(page).count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const frame = frames(page).nth(i);
    await expect(frame).toHaveAttribute('href', /^\/stories\/[^/]+\/$/);
    await expect(frame.locator('h3')).toHaveCount(1);
  }
  // Every item is a direct child of the track, so the reel is one flat run.
  const loose = await page.locator('.reel__track > *:not(.reel__card):not(.reel__frame)').count();
  expect(loose).toBe(0);
});

test.describe('pinned, with motion and a mouse', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } });

  test('the stage pins and the run is exactly as tall as the track needs', async ({ page }) => {
    await open(page);
    const m = await page.evaluate(() => {
      const run = document.querySelector<HTMLElement>('[data-reel-run]')!;
      const stage = document.querySelector<HTMLElement>('[data-reel-stage]')!;
      const track = document.querySelector<HTMLElement>('[data-reel-track]')!;
      return {
        position: getComputedStyle(stage).position,
        run: run.offsetHeight,
        stage: stage.offsetHeight,
        travel: track.offsetWidth - stage.clientWidth,
      };
    });
    expect(m.position).toBe('sticky');
    expect(Math.abs(m.run - (m.stage + Math.max(0, m.travel)))).toBeLessThanOrEqual(2);
  });

  test('scrolling to the end of the run brings the last frame on screen', async ({ page }) => {
    await open(page);
    const before = await frames(page).last().boundingBox();
    expect(before!.x).toBeGreaterThan(1280);
    await page.evaluate(() => {
      const run = document.querySelector<HTMLElement>('[data-reel-run]')!;
      const top = run.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + run.offsetHeight - window.innerHeight, behavior: 'instant' });
    });
    await expect(async () => {
      const box = await frames(page).last().boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1280);
    }).toPass();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('a frame reached with the keyboard is scrolled into view', async ({ page }) => {
    await open(page);
    const n = await frames(page).count();
    for (const i of [n - 1, Math.floor(n / 2), 0]) {
      await frames(page).nth(i).focus();
      await expect(async () => {
        const box = await frames(page).nth(i).boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(1280);
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(800);
      }).toPass();
    }
  });
});

test.describe('strip, reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });

  test('the reel is a native sideways strip with snap', async ({ page }) => {
    await open(page);
    const s = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>('[data-reel-stage]')!;
      const cs = getComputedStyle(stage);
      return {
        position: cs.position,
        overflowX: cs.overflowX,
        snap: cs.scrollSnapType,
        scrolls: stage.scrollWidth > stage.clientWidth,
      };
    });
    expect(s.position).not.toBe('sticky');
    expect(s.overflowX).toBe('auto');
    expect(s.snap).toContain('x');
    expect(s.scrolls).toBe(true);
  });
});

test.describe('320px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('nothing on the page scrolls sideways; the strip does', async ({ page }) => {
    await open(page);
    const r = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>('[data-reel-stage]')!;
      return {
        page: document.documentElement.scrollWidth - window.innerWidth,
        position: getComputedStyle(stage).position,
        strip: stage.scrollWidth > stage.clientWidth,
      };
    });
    expect(r.page).toBeLessThanOrEqual(0);
    expect(r.position).not.toBe('sticky');
    expect(r.strip).toBe(true);
  });
});
