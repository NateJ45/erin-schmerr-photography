// scaffold-file: stories
// Safe to edit by hand
// The home showcase (src/components/portfolio/CoverHero.astro). Two parts:
//
// 1. The OPENING, from the Details Vault "Reveal Hero" (hero-01), kept to its
//    timings: the media clips from a narrow window (50% wide at zero) to a 30%
//    window over 1.4 s while the image scales to 0.86, then to full bleed over
//    1.65 s (starting 0.1 s early) while it scales back to 1; the scrim fades in
//    0.5 s after that second move starts; at the `content` label (2.24 s) the
//    header fades in and the words rise line by line through masks (SplitText,
//    expo.out, 1 s, 0.06 s stagger). Runs only when the component's inline
//    script added html.showcase-intro (a full load, motion allowed, first time
//    this tab).
//
// 2. The SHOWCASE, from Martin Briceno's portfolio: pointing at, focusing or
//    tapping a thumbnail brings its story up. The new cover crossfades in (and
//    eases from soft to sharp, this site's signature), the old words drop out
//    of their masks and the new ones rise in. On a touch screen the first tap
//    on a thumbnail shows that story and the second opens it; a sideways swipe
//    across the photo moves to the next or previous story. Under reduced motion
//    the swap is instant.

import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const html = document.documentElement;
const reduced = () => !html.classList.contains('motion');

type Cleanup = () => void;
let cleanup: Cleanup | null = null;

function setup(root: HTMLElement): Cleanup {
  const media = root.querySelector<HTMLElement>('[data-hero-media]');
  const image = root.querySelector<HTMLElement>('[data-hero-image]');
  const overlay = root.querySelector<HTMLElement>('[data-hero-overlay]');
  const header = document.querySelector<HTMLElement>('.site-header');
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const thumbs = [...root.querySelectorAll<HTMLAnchorElement>('[data-thumb]')];
  // Each story owns one panel in each of the three stacks (title, line, credits).
  const stacks = [...root.querySelectorAll<HTMLElement>('.cover-hero__stack')].map((s) => [
    ...s.querySelectorAll<HTMLElement>('[data-panel]'),
  ]);
  const ctx = gsap.context(() => {}, root);
  const splits: SplitText[] = [];

  // Line masks for every reveal target, the way the Vault's textReveal01 does
  // (type lines, mask lines). Split once, after the fonts (init awaits them).
  // Not autoSplit: a re-split swaps the line elements under a running tween,
  // which left the title showing mid-opening. A real width change re-splits
  // below, between animations.
  const lineTargets = [...root.querySelectorAll<HTMLElement>('[data-reveal-lines]')];
  const linesOf = new Map<HTMLElement, Element[]>();
  const split = () => {
    for (const el of lineTargets) {
      // aria: 'none'. SplitText's default puts aria-label on the split element,
      // which axe rejects on a span, dt or dd (aria-prohibited-attr). Lines keep
      // every word whole, so the text reads the same without it.
      const s = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'line',
        aria: 'none',
      });
      splits.push(s);
      linesOf.set(el, s.lines);
    }
  };
  if (!reduced()) split();
  let lastWidth = window.innerWidth;
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (reduced() || window.innerWidth === lastWidth) return;
      if (html.classList.contains('showcase-running')) return;
      lastWidth = window.innerWidth;
      splits.splice(0).forEach((s) => s.revert());
      split();
    }, 250);
  };
  window.addEventListener('resize', onResize);
  const panelLines = (panel: HTMLElement) =>
    [...panel.querySelectorAll<HTMLElement>('[data-reveal-lines]')].flatMap(
      (el) => linesOf.get(el) ?? [],
    );

  // ---- 1. The opening -------------------------------------------------------
  const intro = html.classList.contains('showcase-intro') && media && image && overlay;
  if (intro) {
    html.classList.add('showcase-running');
    try {
      sessionStorage.setItem('tate-intro', '1');
    } catch {
      /* private mode: the opening may play again, which is harmless */
    }
    ctx.add(() => {
      gsap.set(media, { clipPath: 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)' });
      gsap.set(image, { scale: 1 });
      gsap.set(overlay, { autoAlpha: 0 });
      if (header) gsap.set(header, { autoAlpha: 0 });
      const fades = root.querySelectorAll('[data-hero-fade]');
      gsap.set(fades, { autoAlpha: 0 });
      // The class hid things with CSS until now; GSAP owns them from here.
      html.classList.remove('showcase-intro');

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          gsap.set([media, image], { clearProps: 'clipPath,transform' });
          if (header) gsap.set(header, { clearProps: 'opacity,visibility' });
          html.classList.remove('showcase-running');
        },
      });
      tl.to(media, {
        clipPath: 'polygon(35% 20%, 65% 20%, 65% 80%, 35% 80%)',
        duration: 1.4,
        ease: 'power2.inOut',
      })
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
        .to(overlay, { autoAlpha: 1, duration: 1.7 }, '<+=0.5');
      if (header) tl.to(header, { autoAlpha: 1, duration: 1, ease: 'expo.out' }, 'content');
      tl.to(fades, { autoAlpha: 1, duration: 1, ease: 'expo.out' }, 'content');

      // The words: the headline and the first story's panels, from below
      // their masks, starting on the label.
      const first = [
        root.querySelector<HTMLElement>('.cover-hero__headline'),
        ...stacks.map((s) => s[0]),
      ].filter((el): el is HTMLElement => !!el);
      const lines = first.flatMap((el) =>
        el.matches('[data-reveal-lines]') ? (linesOf.get(el) ?? []) : panelLines(el),
      );
      tl.from(
        lines,
        { yPercent: 110, duration: 1, stagger: 0.06, ease: 'expo.out', immediateRender: true },
        'content',
      );
    });
  }

  // ---- 2. The showcase ------------------------------------------------------
  let current = 0;
  const show = (next: number) => {
    next = (next + slides.length) % slides.length;
    if (next === current || !slides[next]) return;
    const prev = current;
    current = next;

    thumbs.forEach((t, i) => {
      t.classList.toggle('is-active', i === next);
      if (i === next) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });

    if (reduced()) {
      slides[prev].classList.remove('is-active');
      slides[next].classList.add('is-active');
      for (const s of stacks) {
        s[prev]?.classList.remove('is-active');
        s[next]?.classList.add('is-active');
      }
      return;
    }

    ctx.add(() => {
      const inSlide = slides[next];
      const outSlide = slides[prev];
      const inImg = inSlide.querySelector('img');
      gsap.killTweensOf([inSlide, outSlide]);
      inSlide.classList.add('is-active');
      gsap.set(inSlide, { zIndex: 2 });
      gsap.set(outSlide, { zIndex: 1 });
      gsap.fromTo(
        inSlide,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.9,
          ease: 'power2.out',
          onComplete: () => {
            outSlide.classList.remove('is-active');
            gsap.set(outSlide, { clearProps: 'all' });
            gsap.set(inSlide, { clearProps: 'zIndex' });
          },
        },
      );
      if (inImg) {
        gsap.fromTo(
          inImg,
          { filter: 'blur(12px)', scale: 1.04 },
          {
            filter: 'blur(0px)',
            scale: 1,
            duration: 1.4,
            ease: 'expo.out',
            clearProps: 'filter,scale',
          },
        );
      }

      for (const s of stacks) {
        const out = s[prev];
        const inn = s[next];
        if (out) {
          const outLines = panelLines(out);
          gsap.killTweensOf(outLines);
          gsap.to(outLines, {
            yPercent: -110,
            duration: 0.45,
            stagger: 0.03,
            ease: 'power3.in',
            onComplete: () => {
              out.classList.remove('is-active');
              gsap.set(outLines, { clearProps: 'transform' });
            },
          });
        }
        if (inn) {
          const inLines = panelLines(inn);
          gsap.killTweensOf(inLines);
          inn.classList.add('is-active');
          gsap.fromTo(
            inLines,
            { yPercent: 110 },
            { yPercent: 0, duration: 1, stagger: 0.06, ease: 'expo.out', delay: 0.25 },
          );
        }
      }
    });
  };

  const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');
  const offs: Cleanup[] = [];
  const on = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ) => {
    el.addEventListener(type, fn as EventListener, opts);
    offs.push(() => el.removeEventListener(type, fn as EventListener, opts));
  };

  thumbs.forEach((thumb, i) => {
    on(thumb, 'pointerenter', () => {
      if (hoverable.matches) show(i);
    });
    on(thumb, 'focus', () => show(i));
    on(thumb, 'click', (e) => {
      // Touch: the first tap shows the story, the second (on the shown one) opens it.
      if (!hoverable.matches && i !== current) {
        e.preventDefault();
        show(i);
      }
    });
    on(thumb, 'keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      thumbs[(i + step + thumbs.length) % thumbs.length]?.focus();
    });
  });

  // A sideways swipe across the photo moves between stories.
  let x0: number | null = null;
  let y0 = 0;
  on(root, 'pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    x0 = e.clientX;
    y0 = e.clientY;
  });
  on(root, 'pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  });
  on(root, 'pointercancel', () => (x0 = null));

  return () => {
    offs.forEach((off) => off());
    window.removeEventListener('resize', onResize);
    window.clearTimeout(resizeTimer);
    ctx.revert();
    splits.forEach((s) => s.revert());
    html.classList.remove('showcase-intro', 'showcase-running');
    if (header) gsap.set(header, { clearProps: 'opacity,visibility' });
  };
}

async function init() {
  cleanup?.();
  cleanup = null;
  const root = document.querySelector<HTMLElement>('[data-cover-hero]');
  if (!root) return;
  // Split after the webfonts settle so the lines break where they will stay
  // (the Vault's note); the opening waits with them so both clocks agree.
  await document.fonts.ready;
  if (!root.isConnected) return;
  cleanup = setup(root);
}

init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
});

export {};
