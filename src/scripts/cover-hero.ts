// scaffold-file: stories
// Safe to edit by hand
// The home cinema's motion (src/components/portfolio/CoverHero.astro). Two parts:
//
// 1. The OPENING, the Details Vault "Reveal Hero" (hero-01) with a knockout
//    start, kept to the Vault's timings: the name stands huge on paper with the
//    cover showing through its letters (an aria-hidden duplicate over the real
//    h1); behind it the media clips from a narrow window (50% wide at zero) to a
//    30% window over 1.4 s while the image scales to 0.86, then to full bleed
//    over 1.65 s (starting 0.1 s early) while it scales back to 1. From 1.3 s
//    to 2.2 s the scrim fades in and the knockout letters cross-fade into the
//    real h1's solid paper-coloured type over the photo, and at the `content`
//    label (2.24 s) the header fades in and the small line rises through a line
//    mask. Runs only when the component's inline script added
//    html.showcase-intro (a full load, motion allowed, first time this tab).
//
// 2. The FRAMES: as each story frame arrives (ScrollTrigger, once), its photo
//    racks from soft to sharp (DESIGN.md "everything comes into focus") and its
//    title rises in line masks (SplitText). The overlap and knockout titles also
//    slide a little across the photo's edge. Transform, opacity and filter
//    only, so nothing shifts (tests/cls.spec.ts). Scrolling stays the
//    browser's own (rule 5); the gentle proximity snap is CSS.
//
// Without html.motion (JavaScript off or reduced motion) nothing here runs and
// everything shows at rest.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const html = document.documentElement;
const PAPER = '#f3eee7';

type Cleanup = () => void;
let cleanup: Cleanup | null = null;

/** Play a frame's timeline, or, in a hidden tab (no animation frames), set it at rest. */
function playOrFinish(tl: gsap.core.Timeline): void {
  if (document.hidden) tl.progress(1);
  else tl.play();
}

/** Line masks the way the Vault's textReveal01 does (type lines, mask lines). */
function splitLines(el: HTMLElement): SplitText {
  // aria: 'none'. SplitText's default puts aria-label on the split element,
  // which axe rejects on a span (aria-prohibited-attr). Lines keep every word
  // whole, so the text reads the same without it.
  const split = SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'line',
    aria: 'none',
  });
  // The lines of a decorative copy are decorative too: the contrast spec reads
  // data-contrast-decorative on the text's own element, not on an ancestor.
  if (
    el.closest(
      '[aria-hidden="true"][data-contrast-decorative], [aria-hidden="true"] [data-contrast-decorative]',
    )
  )
    split.lines.forEach((l) => l.setAttribute('data-contrast-decorative', ''));
  return split;
}

function setup(root: HTMLElement): Cleanup {
  if (!html.classList.contains('motion')) return () => {};

  const open = root.querySelector<HTMLElement>('[data-hero-open]');
  const media = root.querySelector<HTMLElement>('[data-hero-media]');
  const image = root.querySelector<HTMLElement>('[data-hero-image]');
  const overlay = root.querySelector<HTMLElement>('[data-hero-overlay]');
  const knock = root.querySelector<HTMLElement>('[data-hero-knock]');
  const cut = root.querySelector<HTMLElement>('[data-hero-cut]');
  const header = document.querySelector<HTMLElement>('.site-header');
  const ctx = gsap.context(() => {}, root);
  const splits: SplitText[] = [];

  // ---- 1. The opening -------------------------------------------------------
  const intro = html.classList.contains('showcase-intro') && open && media && image && overlay;
  if (intro) {
    html.classList.add('showcase-running');
    try {
      sessionStorage.setItem('tate-intro', '1');
    } catch {
      /* private mode: the opening may play again, which is harmless */
    }
    const lineEls = [...open.querySelectorAll<HTMLElement>('[data-reveal-lines]')];
    const lineSplits = lineEls.map(splitLines);
    splits.push(...lineSplits);
    const lines = lineSplits.flatMap((s) => s.lines);
    const fades = open.querySelectorAll('[data-hero-fade]');

    ctx.add(() => {
      gsap.set(open, { backgroundColor: PAPER });
      gsap.set(media, { clipPath: 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)' });
      gsap.set(image, { scale: 1 });
      gsap.set(overlay, { autoAlpha: 0 });
      if (knock) {
        gsap.set(knock, { autoAlpha: 1 });
        // Fill the letters with the very file the photo layer chose (eager,
        // high priority, usually in hand by now), so they never wait on a
        // second download and the crop matches exactly.
        const src = image.querySelector('img')?.currentSrc;
        if (src) knock.style.setProperty('--knock-fill', `url("${src}")`);
      }
      if (header) gsap.set(header, { autoAlpha: 0 });
      gsap.set(fades, { autoAlpha: 0 });
      if (cut) gsap.set(cut, { autoAlpha: 0 });
      // The class set the start with CSS until now; GSAP owns it from here.
      html.classList.remove('showcase-intro');

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          gsap.set([media, image], { clearProps: 'clipPath,transform' });
          gsap.set(open, { clearProps: 'backgroundColor' });
          if (knock) gsap.set(knock, { clearProps: 'opacity,visibility,transform' });
          if (cut) gsap.set(cut, { clearProps: 'opacity,visibility,transform,scale' });
          if (header) gsap.set(header, { clearProps: 'opacity,visibility' });
          lineSplits.forEach((s) => s.revert());
          html.classList.remove('showcase-running');
        },
      });
      tl.to(
        media,
        {
          clipPath: 'polygon(35% 20%, 65% 20%, 65% 80%, 35% 80%)',
          duration: 1.4,
          ease: 'power2.inOut',
        },
        0,
      )
        .to(image, { scale: 0.86, duration: 1.4, ease: 'power2.inOut' }, '<')
        .to(
          media,
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 1.65,
            ease: 'power4.inOut',
          },
          '-=0.1',
        )
        .to(image, { scale: 1, duration: 1.65, ease: 'power4.inOut' }, '<')
        .addLabel('content', 2.24)
        // The scrim is full before the small words arrive at 2.24 s (the Vault
        // starts it at 1.85 s, which left the first lines on a bare photo).
        .to(overlay, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 1.3);
      // The knockout gives way to the real, paper-coloured name as the photo fills.
      if (knock) tl.to(knock, { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, 1.3);
      // As a cover: once the photo is full bleed, the person steps in front of
      // her name (the cut-out fades up over it, settling from a touch larger).
      if (cut)
        tl.fromTo(
          cut,
          { autoAlpha: 0, scale: 1.03 },
          { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' },
          2.75,
        );
      if (header) tl.to(header, { autoAlpha: 1, duration: 1, ease: 'expo.out' }, 'content');
      tl.to(fades, { autoAlpha: 1, duration: 1, ease: 'expo.out' }, 'content');
      if (lines.length)
        tl.from(
          lines,
          { yPercent: 110, duration: 1, stagger: 0.06, ease: 'expo.out', immediateRender: true },
          'content',
        );
    });
  }

  // ---- 2. The frames --------------------------------------------------------
  // Automated browsers (tests, Lighthouse) see every frame at rest, like the
  // opening, unless a test asks for the motion with sessionStorage
  // tate-motion-test.
  let bot = false;
  try {
    bot = navigator.webdriver && sessionStorage.getItem('tate-motion-test') !== '1';
  } catch {
    bot = navigator.webdriver;
  }
  const frames = bot ? [] : [...root.querySelectorAll<HTMLElement>('[data-cinema-frame]')];
  interface Built {
    tl: gsap.core.Timeline;
    splits: SplitText[];
    played: boolean;
    st?: ScrollTrigger;
  }
  const built = new Map<HTMLElement, Built>();

  const build = (frame: HTMLElement) => {
    const frameSplits = [...frame.querySelectorAll<HTMLElement>('[data-frame-lines]')].map(
      splitLines,
    );
    const lines = frameSplits.flatMap((s) => s.lines);
    const layout = frame.dataset.layout;
    // A cover frame racks the photo AND the cut-out together (same blur, same
    // scale, same moment), so the person never drifts off her own photograph.
    const imgs =
      layout === 'cover'
        ? [...frame.querySelectorAll<HTMLElement>('.cover__depth img')]
        : [...frame.querySelectorAll<HTMLElement>('.cine__photo img')].slice(0, 1);
    const img = imgs.length ? imgs : null;
    const slides = frame.querySelectorAll<HTMLElement>('[data-frame-slide]');
    // Cover: the masthead's letters rise from behind the person, one by one,
    // through line masks; the echo outline draws in after them; the cover
    // lines fade up in turn.
    const mast = frame.querySelector<HTMLElement>('[data-cover-mast]');
    const echo = frame.querySelector<HTMLElement>('[data-cover-echo]');
    const coverLines = frame.querySelectorAll<HTMLElement>('[data-cover-line]');
    // Each masthead line is split on its own (one nowrap line, so one mask).
    const mastChars: Element[] = [];
    for (const lineEl of mast ? mast.querySelectorAll<HTMLElement>('.cover__mast-line') : []) {
      const s = SplitText.create(lineEl, {
        type: 'lines,chars',
        mask: 'lines',
        linesClass: 'line',
        aria: 'none',
      });
      [...s.lines, ...s.chars].forEach((el) => el.setAttribute('data-contrast-decorative', ''));
      mastChars.push(...s.chars);
      frameSplits.push(s);
    }
    // The overlap titles drift toward the photo's far side; the knockout leftward.
    const dx = frame.classList.contains('cine--right') ? -48 : 48;
    const entry: Built = { tl: gsap.timeline(), splits: frameSplits, played: false };
    ctx.add(() => {
      // TIME-based, never tied to the scroll position: a paused timeline that a
      // ScrollTrigger only STARTS, once, on entry. Killing or refreshing the
      // trigger cannot leave the timeline part-way, and wherever the visitor
      // stops (the snap point included) the frame ends at rest: blur 0, the
      // title fully in, no transform left behind (2026-11-20 live bug: a frame
      // stopped at the snap point stayed soft and half-risen).
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          entry.played = true;
          // Exactly at rest, whatever the eases left behind.
          if (img) gsap.set(img, { clearProps: 'filter,scale,transform' });
          if (slides.length) gsap.set(slides, { clearProps: 'x,transform' });
          if (coverLines.length)
            gsap.set(coverLines, { clearProps: 'opacity,visibility,transform' });
          if (echo) gsap.set(echo, { clearProps: 'opacity,visibility' });
          // The lines have done their work: back to plain text, so a later
          // resize re-wraps naturally.
          entry.splits.forEach((s) => s.revert());
          entry.splits = [];
        },
      });
      if (img)
        tl.fromTo(
          img,
          { filter: 'blur(12px)', scale: 1.04 },
          { filter: 'blur(0px)', scale: 1, duration: 1.2, ease: 'expo.out' },
          0,
        );
      if (lines.length)
        tl.fromTo(
          lines,
          { yPercent: 110 },
          { yPercent: 0, duration: 1, stagger: 0.08, ease: 'expo.out' },
          0.1,
        );
      if (mastChars.length)
        tl.fromTo(
          mastChars,
          { yPercent: 115 },
          { yPercent: 0, duration: 1.1, stagger: 0.04, ease: 'expo.out' },
          0.15,
        );
      if (echo)
        tl.fromTo(echo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 0.9);
      if (coverLines.length)
        tl.fromTo(
          coverLines,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'expo.out' },
          0.45,
        );
      if (slides.length && layout !== 'bleed' && layout !== 'cover')
        tl.fromTo(
          slides,
          { x: layout === 'knock' ? -32 : dx },
          { x: 0, duration: 1.2, ease: 'expo.out' },
          0,
        );
      // Set the start state now (paused timelines do not render until played).
      tl.progress(0.0001).progress(0);
      entry.st = ScrollTrigger.create({
        trigger: frame,
        start: 'top 70%',
        once: true,
        onEnter: () => playOrFinish(tl),
      });
      entry.tl = tl;
    });
    built.set(frame, entry);
  };
  frames.forEach(build);

  // Depth on the cover frames. As a cover scrolls through, the masthead, its
  // outline echo and the cover lines move at different rates against the
  // photo and the person (which stay together, so they always register): the
  // person seems to stand off the page. Scrubbed, but CENTRED on rest: when the
  // frame's top is at the top of the screen (where the snap lands) every offset
  // is exactly 0. On a desktop pointer the same layers also lean a few pixels
  // toward the cursor; none on touch.
  const covers = frames.filter((f) => f.dataset.layout === 'cover');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pointerOffs: (() => void)[] = [];
  for (const frame of covers) {
    const layers: [HTMLElement | null, number, number][] = [
      // [element, scroll travel as a share of the screen height, cursor px]
      [frame.querySelector<HTMLElement>('[data-cover-mast]'), 0.06, 8],
      [frame.querySelector<HTMLElement>('[data-cover-echo]'), 0.1, 14],
      [frame.querySelector<HTMLElement>('[data-cover-lines]'), -0.03, -4],
    ];
    ctx.add(() => {
      for (const [el, travel] of layers) {
        if (!el) continue;
        gsap.fromTo(
          el,
          { y: () => innerHeight * travel },
          {
            y: () => -innerHeight * travel,
            ease: 'none',
            scrollTrigger: {
              trigger: frame,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    });
    if (!finePointer) continue;
    const movers = layers
      .filter(([el]) => !!el)
      .map(([el, , px]) => ({
        to: gsap.quickTo(el!, 'x', { duration: 0.6, ease: 'power3.out' }),
        px,
      }));
    const onMove = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      for (const m of movers) m.to(dx * 2 * m.px);
    };
    const onLeave = () => movers.forEach((m) => m.to(0));
    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerleave', onLeave);
    pointerOffs.push(() => {
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerleave', onLeave);
    });
  }

  // Safety nets. When scrolling stops, any frame on screen that has not
  // finished and is not playing (it never got its trigger, or something
  // paused it) plays to rest. In a hidden tab the browser stops animation
  // frames, so GSAP's clock stops too and a tween would sit part-way: there,
  // and whenever the page is hidden, the frames on screen jump to rest.
  const onScreen = (frame: HTMLElement) => {
    const r = frame.getBoundingClientRect();
    return r.top < innerHeight * 0.7 && r.bottom > 0;
  };
  const settle = () => {
    for (const frame of frames) {
      const b = built.get(frame);
      if (!b || b.played) continue;
      if (document.hidden && b.tl.progress() > 0) b.tl.progress(1);
      else if (!b.tl.isActive() && onScreen(frame)) playOrFinish(b.tl);
    }
  };
  const onScrollEnd = () => settle();
  window.addEventListener('scrollend', onScrollEnd);
  document.addEventListener('visibilitychange', onScrollEnd);

  // Re-split a frame that has not played yet when the width really changes, so
  // its line masks match the new wrap. Played frames are plain text already.
  let lastWidth = window.innerWidth;
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      for (const frame of frames) {
        const b = built.get(frame);
        if (!b || b.played || b.tl.progress() > 0) continue;
        b.st?.kill();
        b.tl.revert();
        b.splits.forEach((s) => s.revert());
        build(frame);
      }
      ScrollTrigger.refresh();
    }, 250);
  };
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scrollend', onScrollEnd);
    document.removeEventListener('visibilitychange', onScrollEnd);
    window.clearTimeout(resizeTimer);
    pointerOffs.forEach((off) => off());
    ctx.revert();
    splits.forEach((s) => s.revert());
    built.forEach((b) => b.splits.forEach((s) => s.revert()));
    html.classList.remove('showcase-intro', 'showcase-running');
    if (header) gsap.set(header, { clearProps: 'opacity,visibility' });
  };
}

// The element the motion is set up on. On a full load both the module's own
// call and Astro's first astro:page-load arrive; the second must not revert the
// running opening and start again (that ended the opening at once).
let mounted: HTMLElement | null = null;

async function init() {
  const root = document.querySelector<HTMLElement>('[data-cover-hero]');
  if (root && root === mounted) return;
  cleanup?.();
  cleanup = null;
  mounted = root;
  if (!root) return;
  // Split after the webfonts settle so the lines break where they will stay
  // (the Vault's note); the opening waits with them so both clocks agree.
  await document.fonts.ready;
  if (!root.isConnected || mounted !== root) return;
  cleanup = setup(root);
}

init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
  mounted = null;
});

export {};
