// Safe to edit by hand
// The booking funnel's motion (DESIGN.md "Booking funnel"), GSAP 3.15 with ScrollTrigger:
//
//   1. The overlap headline (OverlapCover.astro): both copies, the ink heading and its clipped
//      paper twin, rise 28px into place together (1.3s, expo.out), never hidden on the way.
//   2. The cover photo settles from a slow 1.08 zoom over 2.4s.
//   3. Anything marked [data-funnel-rise] (the steps' huge numerals, the guide's contents
//      rows) comes up 3rem and into full opacity as it scrolls in, once.
//
// Runs only under html.motion (BaseLayout: JavaScript on, reduced motion off), and
// gsap.matchMedia reverts it all if reduced motion is switched on while the page is open.
// Scrolling stays native (rule 5). Set up on astro:page-load, torn down on astro:before-swap.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | null = null;

function setup(): void {
  if (!document.documentElement.classList.contains('motion')) return;
  const covers = document.querySelectorAll<HTMLElement>('[data-funnel-cover]');
  const risers = document.querySelectorAll<HTMLElement>('[data-funnel-rise]');
  if (!covers.length && !risers.length) return;

  mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    covers.forEach((cover) => {
      // The headline rises a short way into place, both copies together (their shared grid
      // cell, so the ink and its paper twin never part), and is never hidden on the way
      // (2026-11-20): it is the page's first-screen h1, which must not start masked or faded
      // and wait on JavaScript (tests/first-viewport.spec.ts; the Stories and Press titles
      // made the same change). It used to rise line by line out of SplitText masks.
      const titles = cover.querySelector<HTMLElement>('.fc__titles');
      if (titles) gsap.from(titles, { y: 28, duration: 1.3, delay: 0.1, ease: 'expo.out' });
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
