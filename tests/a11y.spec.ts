// PORTABLE: canonical copy - ncs-astro-sanity-starter is the library of record for this file
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';

// At rest (2026-11-20): colour is judged on the page as it sits once motion has finished, which is
// the reduced-motion state. With motion on, the jewel bands scrub their colour and fade their
// content in as they rise (src/scripts/jewel-motion.ts) and the footer rises from under the page
// (Footer.astro), so a page loaded at the top holds every band below the fold half-made and the
// footer covered: axe reads that unfinished state as 1:1 text and covered targets. The resting
// look is what reduced motion, JavaScript off and print show, and what every band reaches once
// scrolled to. tests/reduced-motion.spec.ts covers the motion-on states themselves.
test.use({ reducedMotion: 'reduce' });

// Accessibility (axe-core), light mode, every route. Zero violations.
//
// Tagged WCAG 2.0 A/AA, 2.1 A/AA and 2.2 AA plus best-practice, so the 2.2 rules (target-size,
// 2.5.8) run by name instead of depending on axe's default set (a WCAG 2.2 sweep on
// 2026-11-08 found failures the old untagged run never reported). A rule added by an axe upgrade under one of these
// tags is enforced the day it lands. Exclude a rule only with a comment saying which false
// positive it is.

for (const route of routes) {
  test(`a11y (light): ${route} has no axe violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await settle(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();

    if (results.violations.length > 0) {
      const report = results.violations
        .map((v) => {
          const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
          return `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    route: ${route}\n    selectors: ${targets}`;
        })
        .join('\n');
      expect(results.violations, `axe violations on ${route}:\n${report}`).toEqual([]);
    }
  });
}
