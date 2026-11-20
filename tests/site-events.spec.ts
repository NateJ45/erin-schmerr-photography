import { test, expect, type Page } from './fixtures';
import { settle } from './helpers';

// =============================================================================
// Visitor actions sent to GA4 (PORTS.md card 217)
// =============================================================================
// src/components/analytics/SiteEvents.astro reads a clicked link's address and
// sends a named event, using the built-in rules plus this site's map
// (src/config/events.ts; its rules are pinned at the bottom). The real tag never loads under Playwright
// (navigator.webdriver), so each test stubs window.gtag before the page runs and
// reads the calls back. Links are clicked with navigation cancelled, so nothing
// leaves the site. A fork that fills its map pins its own rules here.
// =============================================================================

type Call = [string, string, Record<string, unknown>];

async function stub(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { gtag: (...a: unknown[]) => void; __calls: unknown[][] };
    w.__calls = [];
    w.gtag = (...a: unknown[]) => void w.__calls.push(a);
  });
}

async function events(page: Page): Promise<Call[]> {
  return page.evaluate(() =>
    (window as unknown as { __calls: Call[] }).__calls.filter((c) => c[0] === 'event'),
  );
}

/** Put a link on the page, click it with navigation cancelled, return the events. */
async function clickLink(page: Page, href: string, where = 'main') {
  await page.evaluate(
    ({ href, where }) => {
      document.addEventListener('click', (e) => e.preventDefault());
      const a = document.createElement('a');
      a.href = href;
      a.textContent = 'test link';
      a.id = 'probe';
      a.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;padding:12px;background:#fff';
      (document.querySelector(where) ?? document.body).append(a);
    },
    { href, where },
  );
  await page.locator('#probe').evaluate((a) => (a as HTMLElement).click());
  return events(page);
}

test.describe('site events', () => {
  test.beforeEach(async ({ page }) => {
    await stub(page);
    await page.goto('/');
    await settle(page);
  });

  const cases: [string, string, string, Record<string, unknown>][] = [
    ['email', 'mailto:someone@example.org', 'contact_click', { method: 'email' }],
    ['phone', 'tel:+15555550100', 'contact_click', { method: 'phone' }],
    ['map', 'https://www.google.com/maps/search/?api=1&query=x', 'directions_click', {}],
    ['video', 'https://www.youtube.com/watch?v=abc', 'watch_click', { destination: 'video' }],
    ['file', '/files/guide.pdf', 'download_click', { file_extension: 'pdf' }],
    ['other site', 'https://example.com/a', 'outbound_click', { destination: 'example.com' }],
  ];

  for (const [name, href, event, params] of cases) {
    test(`${name} sends ${event}`, async ({ page }) => {
      const calls = await clickLink(page, href);
      const hit = calls.find((c) => c[1] === event);
      expect(hit, JSON.stringify(calls)).toBeTruthy();
      expect(hit![2]).toMatchObject(params);
    });
  }

  test('an ordinary internal link sends nothing', async ({ page }) => {
    expect(await clickLink(page, '/about/')).toEqual([]);
  });

  test('the address of an email link is never sent', async ({ page }) => {
    const calls = await clickLink(page, 'mailto:someone@example.org');
    expect(JSON.stringify(calls)).not.toContain('someone');
  });

  test('a link in the footer says so', async ({ page }) => {
    const calls = await clickLink(page, 'tel:+15555550100', 'footer');
    expect(calls[0][2]).toMatchObject({ method: 'phone', location: 'footer' });
  });
});

test('a missing page sends page_not_found with the path', async ({ page }) => {
  await stub(page);
  await page.goto('/no-such-page-xyz/');
  await settle(page);
  const calls = await events(page);
  const hit = calls.find((c) => c[1] === 'page_not_found');
  expect(hit, JSON.stringify(calls)).toBeTruthy();
  expect(hit![2]).toMatchObject({ missing_path: '/no-such-page-xyz/' });
});

// =============================================================================
// This site's own rules (src/config/events.ts, 2026-11-18)
// =============================================================================
// Booking links, her Instagram and Facebook, links out to press features, and the
// contact form's generate_lead. A collaborator's Instagram is not hers, so it stays
// an ordinary outbound_click.
// =============================================================================

test.describe('site events: this site’s rules', () => {
  test.beforeEach(async ({ page }) => {
    await stub(page);
    await page.goto('/');
    await settle(page);
  });

  const cases: [string, string, string, Record<string, unknown>][] = [
    ['the booking page', '/contact/', 'book_click', { destination: 'contact_page' }],
    ['a booking link with a topic', '/contact/?about=Sessions', 'book_click', {}],
    [
      'her Instagram',
      'https://www.instagram.com/tatefineartphotography/',
      'social_click',
      { platform: 'instagram' },
    ],
    [
      'her Facebook page',
      'https://www.facebook.com/StellinaFineArtPhotography/',
      'social_click',
      { platform: 'facebook' },
    ],
    [
      'a press feature',
      'https://www.bleachfilm.com/erin-schmerr-we-all-look-good-in-pink',
      'press_click',
      { destination: 'bleachfilm.com' },
    ],
    [
      'an interview',
      'https://canvasrebel.com/meet-erin-schmerr/',
      'press_click',
      { destination: 'canvasrebel.com' },
    ],
    [
      'a collaborator’s Instagram',
      'https://www.instagram.com/some.model/',
      'outbound_click',
      { destination: 'instagram.com' },
    ],
  ];

  for (const [name, href, event, params] of cases) {
    test(`${name} sends ${event}`, async ({ page }) => {
      const calls = await clickLink(page, href);
      expect(calls.length, JSON.stringify(calls)).toBe(1);
      expect(calls[0][1], JSON.stringify(calls)).toBe(event);
      expect(calls[0][2]).toMatchObject(params);
    });
  }

  test('a "Book a session" link in the footer says so', async ({ page }) => {
    const calls = await clickLink(page, '/contact/', 'footer');
    expect(calls[0]).toEqual([
      'event',
      'book_click',
      expect.objectContaining({ location: 'footer' }),
    ]);
  });
});

// The privacy wording for these rules (it shows only in a build with the GA4 id) is pinned
// in src/lib/site-events-config.test.ts.

test('a sent contact form sends generate_lead', async ({ page }) => {
  await stub(page);
  // The form's own endpoint answers yes, so nothing leaves the test.
  await page.route(/\/api\/contact\/?(\?.*)?$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  // Reduced motion keeps the booking request's four chapters stacked, so every required
  // answer is on screen at once (src/scripts/booking-form.ts).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  const form = page.locator('form[data-bk-form]');
  // Wait for the script to wire the form; a submit before that is the browser's own post.
  await expect(page.locator('[data-booking][data-bk-ready]')).toHaveCount(1, { timeout: 10_000 });

  // Fill every visible required field with something valid (one radio per group is enough).
  const groups = new Set<string>();
  for (const field of await form.locator('[required]:visible').all()) {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase());
    const type = (await field.getAttribute('type')) ?? '';
    if (tag === 'select') {
      const values = await field
        .locator('option')
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      await field.selectOption(values[0]);
    } else if (type === 'checkbox' || type === 'radio') {
      const group = (await field.getAttribute('name')) ?? '';
      if (type === 'radio' && groups.has(group)) continue;
      groups.add(group);
      // A sitting card's radio is visually hidden inside its label: check it directly.
      await field.check({ force: true });
    } else if (type === 'email') {
      await field.fill('probe@example.com');
    } else {
      await field.fill('A probe message from the test suite.');
    }
  }
  await form.locator('button[type="submit"]').click();

  await expect
    .poll(async () => (await events(page)).find((c) => c[1] === 'generate_lead')?.[2] ?? null)
    .toMatchObject({ form_name: 'contact' });
});
