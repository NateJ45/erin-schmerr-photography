// scaffold-file: sessions
// Site-specific: the Sessions page's blocks (src/components/sessions/), driven on
// /styleguide/sessions/, which renders them through the real SectionRenderer in fixed
// placeholder data (src/lib/sessions-fixture.ts):
//   - one h1 (the opening line), its italic turn in an <em>;
//   - the sittings share the same rows, an excluded row is greyed (not removed) and says so to
//     screen readers, and the "Investment from" row is not drawn while every figure is empty;
//   - with motion and a wide screen the experience photo pins and the middle step is lit;
//     reduced motion and JavaScript off get a plain ordered list, nothing pinned or dimmed;
//   - the questions are native <details> that open without JavaScript;
//   - nothing scrolls sideways at 320px.
import { test, expect, type Page } from './fixtures';

const PATH = '/styleguide/sessions/';

async function open(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('es-first-visit-seen', '1');
    } catch {
      /* storage blocked: the loader skips itself anyway */
    }
  });
  await page.goto(PATH, { waitUntil: 'load' });
}

test('one h1, with the italic turn', async ({ page }) => {
  await open(page);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1 em')).toHaveText('made slowly');
});

test('the sittings: same rows, an excluded row greyed, no empty price row', async ({ page }) => {
  await open(page);
  const sittings = page.locator('.sx-sitting');
  await expect(sittings).toHaveCount(2);
  const first = await sittings.nth(0).locator('.sx-row').count();
  const second = await sittings.nth(1).locator('.sx-row').count();
  expect(first).toBe(second);
  const out = sittings.nth(1).locator('.sx-row--out');
  await expect(out).toHaveCount(1);
  await expect(out).toContainText('not part of this sitting');
  // The fixture leaves every "Investment from" empty, so the row is not drawn at all.
  await expect(page.locator('[data-investment]')).toHaveCount(0);
  await expect(page.getByText('Investment from')).toHaveCount(0);
});

test.describe('the experience, with motion on a wide screen', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } });

  test('the photo pins and the step in the middle is lit', async ({ page }) => {
    await open(page);
    const block = page.locator('[data-sx-experience]');
    await expect(block).toHaveAttribute('data-scrolly', '');
    const media = block.locator('.sx-exp__media');
    expect(await media.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    const steps = block.locator('[data-sx-step]');
    await steps
      .nth(2)
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step');
    await expect(block.locator('[data-sx-step][data-lit]')).toHaveCount(1);
  });
});

test.describe('the experience, reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });

  test('a plain ordered list: nothing pinned, nothing lit', async ({ page }) => {
    await open(page);
    const block = page.locator('[data-sx-experience]');
    await expect(block).not.toHaveAttribute('data-scrolly', '');
    expect(
      await block.locator('.sx-exp__media').evaluate((el) => getComputedStyle(el).position),
    ).toBe('static');
    await expect(block.locator('ol > li[data-sx-step]')).toHaveCount(5);
    await expect(block.locator('[data-lit]')).toHaveCount(0);
  });
});

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });

  test('the steps are a plain list and the questions still open', async ({ page }) => {
    await page.goto(PATH, { waitUntil: 'load' });
    const block = page.locator('[data-sx-experience]');
    await expect(block).not.toHaveAttribute('data-scrolly', '');
    await expect(block.locator('[data-lit]')).toHaveCount(0);
    const first = page.locator('details.sx-q').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('.sx-q__answer')).toBeVisible();
  });
});

test.describe('narrow screens', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('nothing scrolls sideways at 320px', async ({ page }) => {
    await open(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
