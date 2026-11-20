// Safe to edit by hand
import { test, expect, type Page } from './fixtures';
import { settle } from './helpers';

// =============================================================================
// The consultation request on /contact/ (2026-11-20 phase 2, src/components/booking/BookingForm.astro)
// =============================================================================
// One real <form> in four <fieldset> chapters: I. who it is for (four photo cards: family,
// portrait, model or creative, something else), II. that kind's own questions plus a shared
// "rough timing", III. in your words (required only for "Something else"), IV. how to reach
// you. With JavaScript and motion: one chapter at a time, Continue checks the chapter, focus
// lands on each chapter's heading, and only the chosen kind's questions are shown and posted.
// Reduced motion: all four stacked. No JavaScript: all four stacked, :has() shows the chosen
// kind's questions, and a plain POST to /api/booking/ comes back to #booking-sent. The suite
// runs against the static build, so every send is answered by page.route: nothing leaves the
// test and no email is sent.
// =============================================================================

const FORM = 'form[data-bk-form]';

async function ready(page: Page, path = '/contact/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // The script marks the section once it has wired the form.
  await expect(page.locator('[data-booking][data-bk-ready]')).toHaveCount(1, { timeout: 10_000 });
  return page.locator(FORM);
}

const visibleChapters = (page: Page) => page.locator(`${FORM} [data-bk-chapter]:visible`);
const branch = (page: Page, kind: string) => page.locator(`${FORM} [data-bk-branch="${kind}"]`);

test.describe('Consultation request without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows every chapter, the chosen kind only, and posts it, never in the address', async ({
    page,
  }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    const form = page.locator(FORM);
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('action', '/api/booking/');
    await expect(visibleChapters(page)).toHaveCount(4);
    await expect(form.locator('[name="kind"]')).toHaveCount(4);

    // The static build has no Worker, so answer as /api/booking/ does: a 303 to #booking-sent.
    await page.route(/\/api\/booking\/?$/, (route) =>
      route.fulfill({ status: 303, headers: { location: '/contact/#booking-sent' } }),
    );

    // Family: :has() shows only the family questions (and the shared timing).
    await form.locator('.bk-card').first().click();
    await expect(form.locator('[name="kind"][value="family"]')).toBeChecked();
    await expect(branch(page, 'family')).toBeVisible();
    for (const other of ['portrait', 'creative', 'other']) {
      await expect(branch(page, other)).toBeHidden();
    }
    await form.locator('#bk-ages').fill('4 and 7');
    await form.locator('.bk-chip', { hasText: 'Grandparents' }).click();
    await form.locator('#bk-timing').fill('October');
    await form.locator('#bk-story').fill('A portrait for my grandmother.');
    await form.locator('#bk-name').fill('Probe Person');
    await form.locator('#bk-email').fill('probe@example.com');

    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/booking')),
      form.locator('button[type="submit"]').click(),
    ]);
    expect(req.method()).toBe('POST');
    expect(req.url()).not.toContain('?');
    const body = new URLSearchParams(req.postData() ?? '');
    expect(body.get('kind')).toBe('family');
    expect(body.get('childrenAges')).toBe('4 and 7');
    expect(body.getAll('included')).toEqual(['Grandparents']);
    expect(body.get('timing')).toBe('October');
    expect(body.get('story')).toBe('A portrait for my grandmother.');
    expect(body.get('email')).toBe('probe@example.com');
    // The first form's fields are gone.
    expect(body.has('sitting')).toBe(false);
    expect(body.has('season')).toBe(false);

    await page.waitForURL(/#booking-sent$/);
    expect(page.url()).not.toContain('Probe');
    await expect(page.locator('#booking-sent')).toBeVisible();
    await expect(page.locator('[data-bk-sent-heading]')).toHaveText('Thank you.');
    await expect(page.locator('#booking-sent .bk-sent__sign')).toBeVisible();
    await expect(form).toBeHidden();
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
    // Who it is for is the first required answer the browser stops on.
    expect(
      await page
        .locator(`${FORM} [name="kind"]`)
        .first()
        .evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
    ).toBe(true);
  });
});

test.describe('Consultation request, one chapter at a time', () => {
  test('keyboard only: errors per chapter, the branch, Back, then a send of that kind only', async ({
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
    const err = form.locator('#bk-kind-error');
    await expect(err).toBeVisible();
    const radio = form.locator('[name="kind"]').first();
    await expect(radio).toBeFocused();
    await expect(radio).toHaveAttribute('aria-invalid', 'true');
    expect(await radio.getAttribute('aria-describedby')).toContain('bk-kind-error');

    // Arrow keys choose within the group (family to portrait); the error clears.
    await page.keyboard.press('ArrowRight');
    await expect(form.locator('[name="kind"][value="portrait"]')).toBeChecked();
    await expect(err).toBeHidden();
    await form.locator('[data-bk-chapter="0"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');

    // Chapter II: its heading has focus, and only the portrait questions are on.
    const h2 = form.locator('[data-bk-chapter="1"] [data-bk-chapter-heading]');
    await expect(h2).toBeFocused();
    await expect(form.locator('[data-bk-progress-label]')).toHaveText('Chapter II of IV');
    await expect(branch(page, 'portrait')).toBeVisible();
    await expect(form.locator('#bk-ages')).toBeHidden();
    await expect(form.locator('#bk-ages')).toBeDisabled();
    await expect(form.locator('#bk-moodboard')).toBeDisabled();
    await form.locator('#bk-occasion').focus();
    await page.keyboard.type('A birthday');

    // Back never checks, and lands on chapter I's heading. Change to model or creative.
    await form.locator('[data-bk-chapter="1"] [data-bk-back]').focus();
    await page.keyboard.press('Enter');
    await expect(form.locator('[data-bk-chapter="0"] [data-bk-chapter-heading]')).toBeFocused();
    await form.locator('[name="kind"][value="portrait"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(form.locator('[name="kind"][value="creative"]')).toBeChecked();
    await form.locator('[data-bk-chapter="0"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');
    await expect(h2).toBeFocused();
    await expect(branch(page, 'creative')).toBeVisible();
    await expect(form.locator('#bk-occasion')).toBeDisabled();

    // A mood board that is not a link is caught on its own line.
    await form.locator('#bk-moodboard').focus();
    await page.keyboard.type('my pinterest board');
    await form.locator('[data-bk-chapter="1"] [data-bk-next]').focus();
    await page.keyboard.press('Enter');
    const board = form.locator('#bk-moodboard');
    await expect(form.locator('#bk-moodboard-error')).toBeVisible();
    await expect(board).toBeFocused();
    await expect(board).toHaveAttribute('aria-invalid', 'true');
    expect(await board.getAttribute('aria-describedby')).toContain('bk-moodboard-error');
    await board.fill('https://example.com/board');
    await expect(form.locator('#bk-moodboard-error')).toBeHidden();

    // The shared timing, then Enter in the box acts as Continue.
    await form.locator('#bk-timing').focus();
    await page.keyboard.type('October');
    await page.keyboard.press('Enter');
    await expect(form.locator('[data-bk-chapter="2"] [data-bk-chapter-heading]')).toBeFocused();
    await expect(form.locator('[data-bk-progress-label]')).toHaveText('Chapter III of IV');

    // Chapter III: optional for this kind.
    await expect(form.locator('[data-bk-story-optional]')).toBeVisible();
    await form.locator('#bk-story').focus();
    await page.keyboard.type('An editorial story for my book.');
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
    expect(payload.subject).toBe('Consultation request: Model or creative (Probe Person)');
    expect(payload.message).toContain('For: Model or creative');
    expect(payload.message).toContain('Mood board: https://example.com/board');
    expect(payload.message).toContain('Rough timing or dates: October');
    expect(payload.message).toContain('An editorial story for my book.');
    // The portrait answer typed before changing kind is never sent.
    expect(payload.message).not.toContain('A birthday');
    expect(payload.message).not.toContain('The occasion');

    // The page turns to the thank-you, by first name.
    await expect(page.locator('#booking-sent')).toBeVisible();
    await expect(page.locator('#booking-sent')).toBeFocused();
    await expect(page.locator('[data-bk-sent-heading]')).toHaveText('Thank you, Probe.');
    await expect(form).toBeHidden();
  });

  test('"Something else" makes the story required', async ({ page }) => {
    const form = await ready(page);
    await form.locator('.bk-card', { has: page.locator('[value="other"]') }).click();
    await form.locator('[data-bk-chapter="0"] [data-bk-next]').click();
    await expect(branch(page, 'other')).toBeVisible();
    await form.locator('[data-bk-chapter="1"] [data-bk-next]').click();
    await expect(form.locator('[data-bk-story-optional]')).toBeHidden();
    await form.locator('[data-bk-chapter="2"] [data-bk-next]').click();
    await expect(form.locator('#bk-story-error')).toBeVisible();
    await expect(form.locator('#bk-story')).toBeFocused();
    await expect(form.locator('#bk-story')).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('[data-bk-progress-label]')).toHaveText('Chapter III of IV');
  });

  test('targets are at least 44px and the cards are real radios', async ({ page }) => {
    const form = await ready(page);
    await expect(form.locator('.bk-card [type="radio"][name="kind"]')).toHaveCount(4);
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
    await expect(page.locator('[name="kind"]').nth(1)).toBeChecked();
  });

  test('?topic= picks who it is for, ?about= starts the story', async ({ page }) => {
    await ready(page, '/contact/?topic=family&about=Open%20house');
    await expect(page.locator('[name="kind"][value="family"]')).toBeChecked();
    await expect(branch(page, 'family')).not.toHaveAttribute('hidden', '');
    await expect(branch(page, 'portrait')).toHaveAttribute('hidden', '');
    await expect(page.locator('#bk-story')).toHaveValue(/^About Open house: /);
  });
});

test.describe('Consultation request under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('all four chapters stay stacked and Send checks them all', async ({ page }) => {
    const form = await ready(page);
    await expect(visibleChapters(page)).toHaveCount(4);
    await expect(form.locator('[data-bk-progress]')).toBeHidden();
    await expect(form.locator('[data-bk-next]:visible')).toHaveCount(0);

    await form.locator('[data-bk-send]').click();
    for (const id of ['kind', 'name', 'email']) {
      await expect(form.locator(`#bk-${id}-error`)).toBeVisible();
    }
    // The story is optional until "Something else" is chosen.
    await expect(form.locator('#bk-story-error')).toBeHidden();
    await expect(form.locator('[name="kind"]').first()).toBeFocused();
  });
});

test('320px: no sideways scroll on the consultation request', async ({ page }) => {
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
