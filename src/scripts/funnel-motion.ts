// Safe to edit by hand
// The booking funnel's motion (DESIGN.md "Booking funnel"), GSAP 3.15 with SplitText and
// ScrollTrigger, the same machinery as src/scripts/about-motion.ts:
//
//   1. The overlap headline (OverlapCover.astro): BOTH copies, the ink heading and its clipped
//      paper twin, are split into their real lines and rise out of line masks together
//      (1.3s a line, 0.09s apart, expo.out), so the twin never parts from the heading.
//   2. The cover photo settles from a slow 1.08 zoom over 2.4s.
//   3. Anything marked [data-funnel-rise] (the steps' huge numerals, the guide's contents
//      rows) comes up 3rem and into full opacity as it scrolls in, once.
//
// Runs only under html.motion (BaseLayout: JavaScript on, reduced motion off), and
// gsap.matchMedia reverts it all if reduced motion is switched on while the page is open.
// Scrolling stays native (rule 5). Set up on astro:page-load, torn down on astro:before-swap.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

let mm: gsap.MatchMedia | null = null;

function setup(): void {
  if (!document.documentElement.classList.contains('motion')) return;
  const covers = document.querySelectorAll<HTMLElement>('[data-funnel-cover]');
  const risers = document.querySelectorAll<HTMLElement>('[data-funnel-rise]');
  if (!covers.length && !risers.length) return;

  mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    covers.forEach((cover) => {
      cover.querySelectorAll<HTMLElement>('[data-funnel-split]').forEach((title) => {
        SplitText.create(title, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            self.masks.forEach((m) => (m as HTMLElement).classList.add('fc-line-mask'));
            return gsap.from(self.lines, {
              yPercent: 112,
              duration: 1.3,
              stagger: 0.09,
              delay: 0.15,
              ease: 'expo.out',
            });
          },
        });
      });
      const img = cover.querySelector<HTMLElement>('.fc__img');
      if (img) gsap.from(img, { scale: 1.08, duration: 2.4, ease: 'power3.out' });
    });

    risers.forEach((el) => {
      gsap.from(el, {
        y: 48,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  });
}

function teardown(): void {
  mm?.revert();
  mm = null;
}

setup();
document.addEventListener('astro:page-load', () => {
  teardown();
  setup();
});
document.addEventListener('astro:before-swap', teardown);
