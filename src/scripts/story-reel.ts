// Safe to edit by hand
// The /stories/ reel's small helper (StoryReel.astro; portfolio.css, REEL).
// The reel itself is CSS: in pinned mode a view() timeline on the tall run
// slides the track as the page scrolls. This script does two things, and only
// while the stage is actually pinned (position: sticky, which the CSS decides
// from html.motion, the pointer and the width):
//
// 1. A fallback driver for browsers without scroll-driven animations: it reads
//    the run's position on scroll (passive, one rAF per frame) and sets
//    --reel-p from 0 to 1, which the CSS turns into the same slide, drift and
//    progress rule.
// 2. Focus: the stage clips sideways, so the browser cannot bring a focused
//    frame into view itself. On focus inside the track it scrolls the PAGE
//    (instantly, rule 5: code that places the page uses 'instant') to the point
//    where that frame sits in the middle of the stage (WCAG 2.4.11).
//
// Scrolling stays the browser's own; nothing here intercepts wheel or touch.

let teardown: (() => void) | null = null;

function setup(reel: HTMLElement): () => void {
  const run = reel.querySelector<HTMLElement>('[data-reel-run]');
  const stage = reel.querySelector<HTMLElement>('[data-reel-stage]');
  const track = reel.querySelector<HTMLElement>('[data-reel-track]');
  if (!run || !stage || !track) return () => {};

  const pinned = () => getComputedStyle(stage).position === 'sticky';
  const head = () => parseFloat(getComputedStyle(stage).top) || 0;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));

  // The scroll positions where the slide starts (the run's top meets the
  // stage's sticky top) and ends (the run's bottom meets the viewport's).
  const span = () => {
    const top = run.getBoundingClientRect().top + window.scrollY;
    const start = top - head();
    const end = top + run.offsetHeight - window.innerHeight;
    return { start, end: Math.max(start, end) };
  };

  // ---- 1. Fallback driver ---------------------------------------------------
  const supported = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');
  let frame = 0;
  const drive = () => {
    frame = 0;
    if (!pinned()) {
      delete reel.dataset.reelDriven;
      reel.style.removeProperty('--reel-p');
      return;
    }
    reel.dataset.reelDriven = '';
    const { start, end } = span();
    const p = end > start ? clamp((window.scrollY - start) / (end - start)) : 0;
    reel.style.setProperty('--reel-p', p.toFixed(4));
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(drive);
  };
  if (!supported) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    drive();
  }

  // ---- 2. Keep the focused frame in view -------------------------------------
  const onFocus = (event: FocusEvent) => {
    if (!pinned()) return;
    const target = event.target as HTMLElement | null;
    const item = target?.closest<HTMLElement>('.reel__frame, .reel__card');
    if (!item || item.parentElement !== track) return;
    const maxShift = track.offsetWidth - stage.clientWidth;
    if (maxShift <= 0) return;
    const centre = item.offsetLeft + item.offsetWidth / 2 - stage.clientWidth / 2;
    const p = clamp(centre / maxShift);
    const { start, end } = span();
    window.scrollTo({ top: Math.round(start + p * (end - start)), behavior: 'instant' });
  };
  track.addEventListener('focusin', onFocus);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    track.removeEventListener('focusin', onFocus);
  };
}

// Runs at load and again on every astro:page-load (which also fires on the
// first load); the reel on the page is set up once.
function init() {
  const reel = document.querySelector<HTMLElement>('[data-reel]');
  if (!reel || reel.dataset.reelReady === '') return;
  teardown?.();
  reel.dataset.reelReady = '';
  teardown = setup(reel);
}

init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  teardown?.();
  teardown = null;
});

export {};
