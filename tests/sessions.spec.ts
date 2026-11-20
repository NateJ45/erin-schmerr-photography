// scaffold-file: sessions
// Site-specific: the phase 2 Sessions page's blocks (src/components/sessions/, 2026-11-20),
// driven on /styleguide/sessions/, which renders them through the real SectionRenderer in
// fixed placeholder data (src/lib/sessions-fixture.ts, the order scripts/set-sessions.mjs
// writes):
//   - one h1 (the opening line), its italic turn ("a story") in an <em>;
//   - the offers: three chapters, each with its own heading; the creative offer's tiers are
//     each a labelled group with the SAME rows, one tier is "Most chosen", and no money
//     figure is drawn while every "from", range and fee is empty;
//   - with motion and a wide screen the experience photo pins, the step in the middle is lit
//     (aria-current="step"), and the signature step dims the frame to its screening room;
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
  await expect(page.locator('h1 em')).toHaveText('a story');
  await expect(page.locator('h1')).toHaveText('Every sitting begins with a story.');
});

test('the offers: three chapters, tiers on the same rows, one most chosen', async ({ page }) => {
  await open(page);
  const offers = page.locator('article.sx-offer');
  await expect(offers).toHaveCount(3);
  // Each chapter is named by its own heading.
  for (const offer of await offers.all()) {
    const id = await offer.getAttribute('aria-labelledby');
    await expect(offer.locator(`h3#${id}`)).toHaveCount(1);
  }
  // The creative offer's tiers: labelled groups, every one with the same five rows, each row
  // carrying its label for a phone reading one tier at a time.
  const tiers = page.locator('.sx-tier[role="group"]');
  await expect(tiers).toHaveCount(3);
  for (const tier of await tiers.all()) {
    await expect(tier).toHaveAccessibleName(/.+/);
    await expect(tier.locator('.sx-tier__row')).toHaveCount(5);
    await expect(tier.locator('.sx-tier__row dt')).toHaveText([
      'Looks',
      'Time',
      'Retouched images',
      'Turnaround',
      'Usage',
    ]);
  }
  const featured = page.locator('.sx-tier--featured');
  await expect(featured).toHaveCount(1);
  await expect(featured).toContainText('Most chosen');
  await expect(featured).toContainText('Editorial');
  // Each ask names its offer for a screen reader.
  await expect(
    page.getByRole('link', { name: /^Ask about this session\s*:\s*Creative$/ }),
  ).toHaveAttribute('href', '/contact/');
});

test('no money figure is drawn while every figure is empty', async ({ page }) => {
  await open(page);
  await expect(page.locator('.sx-offer__from')).toHaveCount(0);
  await expect(page.locator('.sx-tier__from .font-display')).toHaveCount(0);
  await expect(page.locator('.sx-ledger__row--range')).toHaveCount(0);
  await expect(page.locator('.sx-ledger__fee')).toHaveCount(0);
  // The fee's words stay (what it covers), only the figure goes.
  await expect(page.locator('.sx-ledger__note')).toHaveCount(1);
  expect(await page.locator('main').innerText()).not.toMatch(/\$\s?\d/);
});

test.describe('the experience, with motion on a wide screen', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } });

  test('the photo pins, the step in the middle is lit, the reveal dims the frame', async ({
    page,
  }) => {
    await open(page);
    const block = page.locator('[data-sx-experience]');
    await expect(block).toHaveAttribute('data-scrolly', '');
    const media = block.locator('.sx-exp__media');
    expect(await media.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    const steps = block.locator('[data-sx-step]');
    await expect(steps).toHaveCount(6);

    await steps
      .nth(2)
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step');
    await expect(block.locator('[data-sx-step][data-lit]')).toHaveCount(1);
    await expect(block.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(block.locator('[data-sx-frame][data-on]')).toHaveAttribute('data-sx-frame', '2');
    await expect(block.locator('[data-sx-count]')).toHaveText('03');
    await expect(block).not.toHaveAttribute('data-screening', '');

    // The signature step (the reveal, fifth) turns the frame into the screening room.
    const sig = block.locator('.sx-step--sig');
    await expect(sig).toHaveAttribute('data-sx-step', '4');
    await sig.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(sig).toHaveAttribute('aria-current', 'step');
    await expect(block).toHaveAttribute('data-screening', '');
  });
});

test.describe('the experience, reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });

  test('a plain ordered list: nothing pinned, nothing lit', async ({ page }) => {
    await open(page);
    const block = page.locator('[data-sx-experience]');
    await expect(block).not.toHaveAttribute('data-scrolly', '');
    // Not pinned: the frame is in the flow (relative, for its overlaid count), never sticky.
    expect(
      await block.locator('.sx-exp__media').evaluate((el) => getComputedStyle(el).position),
    ).not.toBe('sticky');
    await expect(block.locator('ol > li[data-sx-step]')).toHaveCount(6);
    await expect(block.locator('[data-lit]')).toHaveCount(0);
    await expect(block.locator('[aria-current]')).toHaveCount(0);
    await expect(block).not.toHaveAttribute('data-screening', '');
  });
});

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });

  test('the steps are a plain list and the questions still open', async ({ page }) => {
    await page.goto(PATH, { waitUntil: 'load' });
    const block = page.locator('[data-sx-experience]');
    await expect(block).not.toHaveAttribute('data-scrolly', '');
    await expect(block.locator('[data-lit]')).toHaveCount(0);
    await expect(block.locator('ol > li[data-sx-step]')).toHaveCount(6);
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
