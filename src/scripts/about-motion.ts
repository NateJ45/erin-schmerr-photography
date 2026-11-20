// scaffold-file: about
// Safe to edit by hand
// The About page's motion (DESIGN.md "About page"), GSAP 3.15 with SplitText
// and ScrollTrigger. Three effects, each from a reference:
//
//   1. The opening headline (Vero): split into its real rendered lines, each
//      line in a clipped mask, rising one after another on load: 1.4s a line,
//      0.1s apart, expo.out (the reference's cubic-bezier(.19,1,.22,1)).
//      `autoSplit` re-splits when the fonts land or the width changes, and the
//      animation is rebuilt from the new lines.
//   2. The story paragraphs (House of Honey, ink on paper here): each one comes
//      up from a soft grey to full ink as it scrolls from the bottom of the
//      screen to about its middle, scrubbed to the scroll.
//   3. The opening and approach photos: a slow drift against the scroll inside
//      their clipped frames (yPercent -5 to 5; the CSS scales the picture so
//      no edge shows).
//
// Runs only under html.motion (BaseLayout: JavaScript on, reduced motion off),
// and gsap.matchMedia reverts everything if reduced motion is switched on
// while the page is open. Scrolling stays the browser's own (rule 5): no
// smoother, no scroller proxy. Astro's router: set up on astro:page-load,
// torn down on astro:before-swap.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

let mm: gsap.MatchMedia | null = null;

function setup(): void {
  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;
  const titles = document.querySelectorAll<HTMLElement>('[data-about-split]');
  const lighten = document.querySelectorAll<HTMLElement>('[data-about-lighten] p');
  const frames = document.querySelectorAll<HTMLElement>('[data-about-parallax]');
  if (!titles.length && !lighten.length && !frames.length) return;

  mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // 1. The headline, line by line.
    titles.forEach((title) => {
      SplitText.create(title, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'about-line',
        autoSplit: true,
        onSplit(self) {
          // The masks SplitText wraps the lines in take this class, so the
          // CSS can pad them for descenders and italic overhangs.
          self.masks.forEach((m) => (m as HTMLElement).classList.add('about-line-mask'));
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.4,
            stagger: 0.1,
            ease: 'expo.out',
          });
        },
      });
    });

    // 2. Paragraphs from a soft grey to full ink. The soft end is the muted
    // text colour (5.7:1 on paper), not an opacity, so a paragraph still
    // waiting below the fold passes AA contrast at every point of the tween.
    // Read per paragraph, not from the root: on a jewel band (src/lib/jewel-cadence.ts) the
    // band re-points both tokens, so the tween runs from the band's caption colour to its
    // own ink and never paints paper ink onto a coloured field.
    lighten.forEach((p) => {
      const style = getComputedStyle(p);
      const soft = style.getPropertyValue('--color-muted-foreground').trim();
      const ink = style.getPropertyValue('--color-foreground').trim();
      if (soft && ink) {
        gsap.fromTo(
          p,
          { color: soft },
          {
            color: ink,
            ease: 'none',
            scrollTrigger: { trigger: p, start: 'top 92%', end: 'top 55%', scrub: true },
          },
        );
      }
    });

    // 3. The slow photos.
    frames.forEach((frame) => {
      const picture = frame.firstElementChild as HTMLElement | null;
      // A placeholder stays put, so its "Placeholder" label is never cropped.
      if (!picture || picture.classList.contains('focus-image--placeholder')) return;
      gsap.fromTo(
        picture,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
  });
}

function teardown(): void {
  // Reverting the matchMedia context reverts every split, tween and trigger
  // made inside it, so the next page starts clean.
  mm?.revert();
  mm = null;
}

setup();
document.addEventListener('astro:page-load', () => {
  teardown();
  setup();
});
document.addEventListener('astro:before-swap', teardown);

export {};
