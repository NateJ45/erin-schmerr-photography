import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// Wayfinding (PORTS.md card 191; src/lib/wayfinding.ts)
// =============================================================================
// Drives /styleguide/wayfinding/ (src/pages/styleguide/wayfinding.astro), the chrome with fixed
// Site settings that switch all four pieces on. Pins: the phone menu's labelled groups (a dialog
// still, each list named by its heading, the page you are on marked, the menu's own button not
// repeated); the where-next rows (three, an unpublished Studio page never drawn); this site's
// footer (one stacked page list, a wordmark that fits a phone); the action bar (phones only, after the heading, gone
// while the footer shows, above the safe area, passes axe, fits 320px); and a page with nothing
// set (every real route of the starter) carrying none of it.
// =============================================================================

const ROUTE = '/styleguide/wayfinding/';
type Page = import('@playwright/test').Page;

const barShown = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector<HTMLElement>('div[data-action-bar]');
    return !!bar && !bar.hidden && getComputedStyle(bar).display !== 'none';
  });

test.describe('wayfinding', () => {
  test('phone menu: labelled groups of big rows in the dialog', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    await page.locator('[data-menu-open]').click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    // Full screen.
    const box = await page.locator('dialog[data-menu]').boundingBox();
    expect(Math.round(box!.width)).toBe(375);

    for (const name of ['New here', 'Our work', 'Get in touch']) {
      await expect(menu.getByRole('heading', { level: 2, name })).toBeVisible();
      await expect(menu.getByRole('list', { name })).toBeVisible();
    }
    await expect(menu.getByRole('list', { name: 'Our work' }).getByRole('link')).toHaveCount(3);
    // The header button goes to Contact, so Contact is not listed again.
    await expect(
      menu.getByRole('list', { name: 'Get in touch' }).getByRole('link', { name: 'Contact' }),
    ).toHaveCount(0);
    await expect(menu.getByRole('link', { name: 'Wayfinding fixture' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Rows are a fingertip or more tall and in the display face.
    const row = menu.getByRole('link', { name: 'About' });
    const rowBox = await row.boundingBox();
    expect(rowBox!.height).toBeGreaterThanOrEqual(44);

    const axe = await new AxeBuilder({ page }).include('dialog[data-menu]').analyze();
    expect(axe.violations).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('where next: three rows, never an unpublished page', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'load' });
    const nav = page.getByRole('navigation', { name: 'Where next' });
    await expect(nav.getByRole('link')).toHaveCount(3);
    await expect(nav.getByRole('link', { name: /Contact/ })).toHaveAttribute('href', '/contact/');
    await expect(nav.getByRole('link', { name: /About/ })).toBeVisible();
    await expect(nav.getByText('Not published')).toHaveCount(0);
  });

  // This site's footer (2026-11-20, Footer.astro) draws the footer columns as ONE stacked
  // list, whatever the footer style, so the starter's "two by two" check is replaced by this.
  test('footer: one stacked page list, and the giant name fits a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    const items = page.locator('#site-footer nav[aria-label="Footer"] li');
    const a = await items.nth(0).boundingBox();
    const b = await items.nth(1).boundingBox();
    expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1);
    expect(Math.abs(a!.x - b!.x)).toBeLessThan(2);
    // The giant name (the jewel close, "Tate" with her photos through its letters) is the
    // footer's link home, named in full for assistive tech, and stays inside a phone's width.
    const name = page.locator('#site-footer [data-bqf-name]');
    await expect(name).toBeVisible();
    await expect(name).toHaveAttribute('href', '/');
    await expect(name).toHaveAccessibleName(/ home$/);
    const box = await name.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });

  test('action bar: shows past the heading on a phone, gives way to the footer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    expect(await barShown(page), 'not at the top of the page').toBe(false);

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => barShown(page)).toBe(true);
    const bar = page.locator('div[data-action-bar]');
    await expect(bar.getByRole('link', { name: 'Book a visit' })).toHaveAttribute(
      'href',
      '/contact/',
    );
    await expect(bar).toContainText('Open today until 5');
    const box = await bar.boundingBox();
    expect(Math.round(box!.y + box!.height)).toBe(812);
    expect(
      await page.evaluate(() => document.documentElement.hasAttribute('data-action-bar-on')),
    ).toBe(true);
    const button = await bar.getByRole('link').boundingBox();
    expect(button!.height).toBeGreaterThanOrEqual(44);

    const axe = await new AxeBuilder({ page }).include('[data-action-bar]').analyze();
    expect(axe.violations).toEqual([]);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => barShown(page), { message: 'hidden over the footer' }).toBe(false);
  });

  test('action bar: never on a desktop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);
    expect(await barShown(page)).toBe(false);
  });

  test('320px: no sideways scroll with the bar showing or the menu open', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(() => barShown(page)).toBe(true);
    const fits = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await fits()).toBe(true);
    const bar = await page.locator('div[data-action-bar]').boundingBox();
    expect(bar!.width).toBeLessThanOrEqual(320);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('[data-menu-open]').click();
    const panel = page.locator('dialog[data-menu] .mobile-menu__panel');
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('a page with nothing set carries none of it', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/', { waitUntil: 'load' });
    await expect(page.locator('.where-next')).toHaveCount(0);
    await expect(page.locator('div[data-action-bar]')).toHaveCount(0);
    await expect(page.locator('.mobile-menu--groups')).toHaveCount(0);
    // This site draws its own footer (Footer.astro) whatever the footer style.
    await expect(page.locator('footer.bqf-footer')).toHaveCount(1);
  });
});
