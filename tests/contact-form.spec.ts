// Safe to edit by hand
import { test, expect, type Page } from './fixtures';
import { settle } from './helpers';

// =============================================================================
// The booking request on /contact/ (2026-11-20, src/components/booking/BookingForm.astro)
// =============================================================================
// One real <form> in four <fieldset> chapters. With JavaScript and motion: one chapter at a
// time, Continue checks the chapter, focus lands on each chapter's heading. Reduced motion:
// all four stacked. No JavaScript: all four stacked, a plain POST to /api/booking/ that comes
// back to #booking-sent. The suite runs against the static build, so every send is answered
// by page.route: nothing leaves the test and no email is sent.
// =============================================================================

const FORM = 'form[data-bk-form]';

async function ready(page: Page) {
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  // The script marks the section once it has wired the form.
  await expect(page.locator('[data-booking][data-bk-ready]')).toHaveCount(1, { timeout: 10_000 });
  return page.locator(FORM);
}

const visibleChapters = (page: Page) => page.locator(`${FORM} [data-bk-chapter]:visible`);

test.describe('Booking request without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows every chapter and posts the answers, never in the address', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    const form = page.locator(FORM);
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('action', '/api/booking/');
    await expect(visibleChapters(page)).toHaveCount(4);

    // The static build has no Worker, so answer as /api/booking/ does: a 303 to #booking-sent.
    await page.route(/\/api\/booking\/?$/, (route) =>
      route.fulfill({ status: 303, headers: { location: '/contact/#booking-sent' } }),
    );

    await form.locator('.bk-card').first().click();
    await form.locator('.bk-chip').nth(2).click();
    await form.locator('#bk-story').fill('A portrait for my grandmother.');
    await form.locator('#bk-name').fill('Probe Person');
    await form.locator('#bk-email').fill('probe@example.com');

    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/booking')),
      form.locator('button[type="submit"]').click(),
    ]);
    expect(req.method()).toBe('POST');
    expect(req.url()).not.toContain('?');
    const body = req.postData() ?? '';
    expect(body).toContain('story=');
    expect(body).toContain('sitting=');

    await page.waitForURL(/#booking-sent$/);
    expect(page.url()).not.toContain('Probe');
    await expect(page.locator('#booking-sent')).toBeVisible();
    await expect(form).toBeHidden();
    await expect(page.locator('.bk-next__step')).toHaveCount(3);
  });

  test('the browser holds a submit with a required answer missing', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    let posted = false;
    await page.route(/\/api\/booking/, (route) => {
      posted = true;
      return route.abort();
    });
    await page.locator(`${FORM} button[type="submit"]`).click();
    await page.waitForTimeout(300);
    expect(posted).toBe(false);
  });
});

test.describe('Booking request, one chapter at a time', () => {
  test('keyboard only: errors per chapter, focus on each heading, Back, then a send', async ({
    page,
  }) => {
    await page.route(/\/api\/contact\/?$/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
    );
    const form = await ready(page);
    await expect(visibleChapters(page)).toHaveCount(1);
    await expect(form.locator('[data-bk-progress-label]')).toHaveText('Chapter I of IV');

    // Continue with nothing chosen: the error is tied to the radios and focus goes to them.
    await form.locator('[data-bk-chapter="0"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');
    const err = form.locator('#bk-sitting-error');
    await expect(err).toBeVisible();
    const radio = form.locator('[name="sitting"]').first();
    await expect(radio).toBeFocused();
    await expect(radio).toHaveAttribute('aria-invalid', 'true');
    expect(await radio.getAttribute('aria-describedby')).toContain('bk-sitting-error');

    // Arrow keys choose within the group; Tab reaches Continue.
    await page.keyboard.press('ArrowRight');
    await expect(err).toBeHidden();
    await form.locator('[data-bk-chapter="0"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');

    // Chapter II: its heading has focus.
    const h2 = form.locator('[data-bk-chapter="1"] [data-bk-chapter-heading]');
    await expect(h2).toBeFocused();
    await expect(form.locator('[data-bk-progress-label]')).toHaveText('Chapter II of IV');

    // Back never checks, and lands on chapter I's heading.
    await form.locator('[data-bk-chapter="1"] [data-bk-back]').focus();
    await page.keyboard.press('Enter');
    await expect(form.locator('[data-bk-chapter="0"] [data-bk-chapter-heading]')).toBeFocused();
    await form.locator('[data-bk-chapter="0"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');

    // Chapter II: a season, then Enter in the month box acts as Continue.
    await form.locator('[name="season"]').first().focus();
    await page.keyboard.press('Space');
    await form.locator('#bk-month').focus();
    await page.keyboard.type('October');
    await page.keyboard.press('Enter');
    await expect(form.locator('[data-bk-chapter="2"] [data-bk-chapter-heading]')).toBeFocused();

    // Chapter III.
    await form.locator('#bk-story').focus();
    await page.keyboard.type('A portrait for my grandmother.');
    await form.locator('[data-bk-chapter="2"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');

    // Chapter IV: a bad email is caught on its own line.
    await form.locator('#bk-name').focus();
    await page.keyboard.type('Probe Person');
    await form.locator('#bk-email').focus();
    await page.keyboard.type('not-an-email');
    await page.keyboard.press('Enter');
    await expect(form.locator('#bk-email-error')).toBeVisible();
    await expect(form.locator('#bk-email')).toBeFocused();
    await expect(form.locator('#bk-email')).toHaveAttribute('aria-invalid', 'true');

    await form.locator('#bk-email').fill('probe@example.com');
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/contact')),
      form.locator('[data-bk-send]').click(),
    ]);
    const payload = JSON.parse(req.postData() ?? '{}') as Record<string, string>;
    expect(payload.email).toBe('probe@example.com');
    expect(payload.message).toContain('Month or date in mind: October');
    expect(payload.message).toContain('A portrait for my grandmother.');

    // The page turns to the thank-you, by first name.
    await expect(page.locator('#booking-sent')).toBeVisible();
    await expect(page.locator('[data-bk-sent-heading]')).toHaveText('Thank you, Probe.');
    await expect(form).toBeHidden();
  });

  test('targets are at least 44px and the cards are real radios', async ({ page }) => {
    const form = await ready(page);
    await expect(form.locator('.bk-card [type="radio"][name="sitting"]')).not.toHaveCount(0);
    for (const sel of ['.bk-card', '[data-bk-chapter="0"] [data-bk-next]']) {
      const box = await form.locator(sel).first().boundingBox();
      expect(box!.height, sel).toBeGreaterThanOrEqual(44);
      expect(box!.width, sel).toBeGreaterThanOrEqual(44);
    }
  });

  test('keeps an unsent draft in sessionStorage across a reload', async ({ page }) => {
    const form = await ready(page);
    await form.locator('.bk-card').nth(1).click();
    await expect
      .poll(() =>
        page.evaluate(() => Object.keys(window.sessionStorage).filter((k) => /draft/.test(k))),
      )
      .toHaveLength(1);
    expect(
      await page.evaluate(() => Object.keys(window.localStorage).filter((k) => /draft/.test(k))),
    ).toHaveLength(0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[name="sitting"]').nth(1)).toBeChecked();
  });

  test('?about= starts the story when the visitor has typed nothing', async ({ page }) => {
    await page.goto('/contact/?about=Open%20house', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#bk-story')).toHaveValue(/^About Open house: /, {
      timeout: 10_000,
    });
  });
});

test.describe('Booking request under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('all four chapters stay stacked and Send checks them all', async ({ page }) => {
    const form = await ready(page);
    await expect(visibleChapters(page)).toHaveCount(4);
    await expect(form.locator('[data-bk-progress]')).toBeHidden();
    await expect(form.locator('[data-bk-next]:visible')).toHaveCount(0);

    await form.locator('[data-bk-send]').click();
    for (const id of ['sitting', 'season', 'story', 'name', 'email']) {
      await expect(form.locator(`#bk-${id}-error`)).toBeVisible();
    }
    await expect(form.locator('[name="sitting"]').first()).toBeFocused();
  });
});

test('320px: no sideways scroll on the booking request', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(inner);
});

test.describe('Focus ring on a dark band', () => {
  test('a link inside the dark panel draws a ring that clears 3:1', async ({ page }) => {
    await page.goto('/styleguide/', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const dark = page.locator('section.bg-accent-dark').first();
    await dark.scrollIntoViewIfNeeded();
    const link = dark.locator('a').first();
    await link.focus();
    const out = await link.evaluate((el) => {
      const toRgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
      // Resolve the ring through a probe, so a var() in the custom property becomes a colour.
      const probe = document.createElement('span');
      probe.style.color = 'var(--ring)';
      el.appendChild(probe);
      const ring = toRgb(getComputedStyle(probe).color);
      probe.remove();
      // The ring is drawn outside the link, so it sits on the BAND, not on the link's own fill.
      let node: Element | null = el.closest('section') ?? el;
      let bg = [0, 0, 0];
      while (node) {
        const c = getComputedStyle(node).backgroundColor;
        if (c && !/rgba\(.*, 0\)|transparent/.test(c)) {
          bg = toRgb(c);
          break;
        }
        node = node.parentElement;
      }
      const [a, b] = [lum(ring), lum(bg)];
      return { ring, bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    });
    expect(out.ratio, `ring ${out.ring} on ${out.bg}`).toBeGreaterThanOrEqual(3);
  });
});
