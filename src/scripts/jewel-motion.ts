// Safe to edit by hand
// =============================================================================
// Jewel motion (2026-11-20): the three signature hand-offs between bands
// =============================================================================
// The site alternates paper with full-bleed jewel fields (src/lib/jewel-cadence.ts,
// globals.css ".jewel"). Every band marked data-band="jewel" gets the same three
// hand-offs, so the whole site moves one way (DESIGN.md "Colour and transitions",
// docs/agent/animation.md "Jewel transitions"):
//
//   1. COLOUR BLEED, into a jewel band. The band's colour (its --jw token, which every
//      surface inside reads) scrubs from the colour of the band before it to its own
//      jewel as it rises from the bottom of the screen to just past the middle, so the
//      page seems to take on the colour of the next picture. Inspired by the colour-on-
//      scroll pages in the Details catalog (Somefolk's stacked photographic sections,
//      Haoqi's field changes); it tweens one custom property, background only.
//   2. SHUTTER, out of a jewel band. The section after a jewel band starts covered by
//      slats in the jewel's colour that open away bottom slat first as it scrolls in.
//      This is the Details Vault "Shutter transition" (section-transition-04) in its
//      reveal mode: the same 4px slat overlap, from: 'end' stagger and expo.in ease;
//      transform (scaleY) only, and the layer is aria-hidden and pointer-events: none.
//   3. STACKED SHEETS, wide screens only. A jewel band holds still once its foot reaches
//      the bottom of the screen and the next sheet slides up over it, like prints laid on
//      a table. The Details Vault "Parallax Transition" (section-transition-01) in its
//      pin mode: pinSpacing false, so nothing below moves and there is no layout shift.
//
// Rules this keeps: native scrolling only (rule 5, no Lenis); transform, opacity,
// clip-path and colour only; everything runs under html.motion (BaseLayout: JavaScript
// on, reduced motion off) inside gsap.matchMedia, so with reduced motion or no
// JavaScript every band simply sits at rest in its colour, fully readable. Set up on
// astro:page-load, torn down on astro:before-swap, like the site's other motion.
// =============================================================================
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | null = null;
const injected: HTMLElement[] = [];
/** Neighbours whose inline styles this script set, so teardown can clear them. */
const touched: HTMLElement[] = [];

/** The neighbouring band, skipping scripts, styles and zero-height markers. */
function neighbour(el: Element, dir: 'prev' | 'next'): HTMLElement | null {
  let n = dir === 'prev' ? el.previousElementSibling : el.nextElementSibling;
  while (n) {
    const skip =
      ['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(n.tagName) ||
      (n as HTMLElement).offsetHeight === 0;
    if (!skip) return n as HTMLElement;
    n = dir === 'prev' ? n.previousElementSibling : n.nextElementSibling;
  }
  return null;
}

/**
 * Whether a neighbour can take the shutter and slide over a held band: a paper band that
 * spans the whole width. A content-width block would let the held colour show at its sides.
 */
function sheet(el: HTMLElement): boolean {
  return el.dataset.band !== 'jewel' && el.offsetWidth >= document.documentElement.clientWidth - 2;
}

const isClear = (c: string) => c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);

/** The colour an element shows: its own background, or the page's. */
function groundOf(el: HTMLElement | null): string {
  if (el) {
    if (el.dataset.band === 'jewel') return getComputedStyle(el).getPropertyValue('--jw').trim();
    const own = getComputedStyle(el).backgroundColor;
    if (!isClear(own)) return own;
    const child = el.firstElementChild as HTMLElement | null;
    if (child) {
      const inner = getComputedStyle(child).backgroundColor;
      if (!isClear(inner)) return inner;
    }
  }
  return getComputedStyle(document.body).backgroundColor;
}

/** The resolved jewel colour of a band (its --jw token). */
function jewelOf(band: HTMLElement): string {
  return getComputedStyle(band).getPropertyValue('--jw').trim();
}

/** Transition 2: the shutter, slats in the jewel's colour opening over the next band. */
function shutter(next: HTMLElement, colour: string, slatCount: number, span = 1): void {
  const cs = getComputedStyle(next);
  if (cs.position === 'static') next.style.position = 'relative';
  next.style.isolation = 'isolate';

  const layer = document.createElement('div');
  layer.setAttribute('data-jewel-shutter', '');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'absolute',
    left: '0',
    right: '0',
    top: '0',
    height: `${Math.min(next.offsetHeight, window.innerHeight * 0.88)}px`,
    zIndex: '4',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  });
  const slats = Array.from({ length: slatCount }, () => {
    const row = document.createElement('div');
    Object.assign(row.style, { flex: '1 1 0', minHeight: '0', position: 'relative' });
    const slat = document.createElement('div');
    Object.assign(slat.style, {
      width: '100%',
      height: 'calc(100% + 4px)',
      marginTop: '-2px',
      background: colour,
      transformOrigin: '50% 0%',
      willChange: 'transform',
    });
    row.append(slat);
    layer.append(row);
    return slat;
  });
  next.append(layer);
  injected.push(layer);

  gsap.set(slats, { scaleY: 1 });
  gsap
    .timeline({
      defaults: { ease: 'expo.in' },
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        // Clamped to the last scroll position, so the shutter is always fully open at rest.
        end: () =>
          Math.min(
            next.getBoundingClientRect().top +
              window.scrollY -
              window.innerHeight +
              Math.max(layer.offsetHeight * span, 1),
            ScrollTrigger.maxScroll(window) - 1,
          ),
        scrub: 1,
        invalidateOnRefresh: true,
      },
    })
    .to(slats, { scaleY: 0, duration: 0.03, stagger: { each: 0.0015, from: 'end' } }, 0);
}

function setup(): void {
  if (!document.documentElement.classList.contains('motion')) return;
  const bands = [...document.querySelectorAll<HTMLElement>('main [data-band="jewel"]')];
  if (!bands.length) return;

  mm = gsap.matchMedia();
  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 900px)',
    },
    (ctx) => {
      const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
      if (!motion) return;

      bands.forEach((band) => {
        const jewel = jewelOf(band);
        const prev = neighbour(band, 'prev');
        const next = neighbour(band, 'next');

        // 3. Stacked sheets: hold the band while the next sheet slides over it.
        if (next) touched.push(next);
        // Only when the next sheet is at least a screen tall: a short one would pass before
        // the hold ends and let the held colour show under whatever follows it.
        const held = wide && !!next && sheet(next) && next.offsetHeight >= window.innerHeight;
        if (next && held) {
          if (getComputedStyle(next).position === 'static') next.style.position = 'relative';
          next.style.zIndex = '2';
          if (isClear(getComputedStyle(next).backgroundColor)) {
            next.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
          }
          ScrollTrigger.create({
            trigger: next,
            start: 'top bottom',
            end: 'top top',
            pin: band,
            pinSpacing: false,
          });
        }

        // 1. Colour bleed: the band takes on its jewel as it rises into view, and its
        // content comes up with the colour, so no line of text ever sits half-contrast on a
        // half-made colour. The end is clamped to the page's last scroll position, so a
        // band near the foot of a short page still finishes at rest in its full colour.
        const from = groundOf(prev);
        const inner = band.firstElementChild as HTMLElement | null;
        const bandTop = () => band.getBoundingClientRect().top + window.scrollY;
        const maxScroll = () => ScrollTrigger.maxScroll(window) - 1;
        const end = () => Math.min(bandTop() - window.innerHeight * 0.45, maxScroll());
        const start = () => Math.min(bandTop() - window.innerHeight * 0.95, end() - 1);
        const bleed = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: band, start, end, scrub: true, invalidateOnRefresh: true },
        });
        bleed.fromTo(band, { '--jw': from }, { '--jw': jewel }, 0);
        if (inner) bleed.fromTo(inner, { opacity: 0.12 }, { opacity: 1 }, 0);

        // 2. Shutter: the next band opens out of this one's colour.
        if (next && sheet(next)) {
          shutter(next, jewel, wide ? 12 : 7, held ? 0.5 : 1);
        }
      });

      return () => {
        injected.splice(0).forEach((el) => el.remove());
        bands.forEach((band) => band.style.removeProperty('--jw'));
        touched.splice(0).forEach((next) => {
          for (const p of ['position', 'z-index', 'background-color', 'isolation']) {
            next.style.removeProperty(p);
          }
        });
      };
    },
  );
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
