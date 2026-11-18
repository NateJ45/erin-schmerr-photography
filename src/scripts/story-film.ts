// Safe to edit by hand
// The story film player (src/pages/stories/[slug].astro; DESIGN.md "Story
// page"). The page arrives as a vertical run of full-bleed frames, which is
// what a visitor without JavaScript keeps. This script turns it into a film:
// the frames stack in one screen (`data-mode="film"`), each holds for 4.8s with
// a slow push-in, and the next one burns in (src/scripts/film-burn.ts) or,
// where WebGL or CORS say no, crossfades with a focus pull.
//
// Accessibility (WCAG 2.2.2): autoplay starts only without reduced motion and
// the Pause button is on screen from the first frame. Playing also stops by
// itself while the tab is hidden or the film is mostly scrolled away, and on
// the end credits. Reduced motion: no autoplay, no push-in and no burn; the
// Previous and Next buttons cut between frames. The live region announces the
// frame and its caption politely when the visitor moves; it is quiet while the
// film plays by itself, so a screen reader is not talked over every 4.8s.
//
// Keys: Left and Right arrows move while the film is in view and focus is not
// in a form field; Space plays and pauses when focus is on the page itself
// (on a button, Space presses that button as usual). Swipe sideways on touch.
// Scrolling is never touched (rule 5): the film is a block in the page.
import { createFilmBurn, type BurnFrame, type FilmBurn } from './film-burn';

const HOLD = 4800;
const BURN = 1600;

let teardown: (() => void) | null = null;

function setup(root: HTMLElement): () => void {
  const frames = Array.from(root.querySelectorAll<HTMLElement>('[data-film-frame]'));
  const controls = root.querySelector<HTMLElement>('[data-film-controls]');
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-film-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-film-next]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-film-play]');
  const count = root.querySelector<HTMLElement>('[data-film-count]');
  const live = root.querySelector<HTMLElement>('[data-film-live]');
  const again = root.querySelector<HTMLButtonElement>('[data-film-again]');
  const progress = root.querySelector<HTMLElement>('[data-film-progress]');
  if (frames.length < 2 || !controls || !prevBtn || !nextBtn || !playBtn || !progress) {
    return () => {};
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const last = frames.length - 1;
  const pad = (n: number) => String(n).padStart(2, '0');

  // ---- Film mode on --------------------------------------------------------
  root.dataset.mode = 'film';
  if (reduce) root.dataset.reduced = '';
  controls.hidden = false;
  progress.hidden = false;
  if (again) again.hidden = false;
  if (reduce) playBtn.hidden = true;
  frames.forEach((f, i) => {
    f.classList.toggle('is-on', i === 0);
    f.classList.toggle('is-first', i === 0);
  });
  const ticks = frames.map(() => {
    const tick = document.createElement('i');
    tick.appendChild(document.createElement('b'));
    progress.appendChild(tick);
    return tick;
  });

  // ---- The burn (never under reduced motion) --------------------------------
  let burn: FilmBurn | null = null;
  let canvas: HTMLCanvasElement | null = null;
  if (!reduce) {
    canvas = document.createElement('canvas');
    canvas.className = 'film__burn';
    canvas.setAttribute('aria-hidden', 'true');
    root.insertBefore(canvas, progress);
    const data: BurnFrame[] = frames.map((f) => ({
      src: f.dataset.burnSrc ?? '',
      lqip: f.dataset.lqip ?? '',
      ratio: Number(f.dataset.ratio) || 1,
      x: Number(f.dataset.x ?? 0.5),
      y: Number(f.dataset.y ?? 0.5),
    }));
    burn = createFilmBurn(canvas, data);
    if (!burn) {
      canvas.remove();
      canvas = null;
    }
  }

  // ---- State -----------------------------------------------------------------
  let at = 0;
  let wantPlay = !reduce;
  let tabHidden = document.visibilityState === 'hidden';
  let inView = true;
  let busy = false;
  let timer = 0;
  let startedAt = 0;
  let remaining = HOLD;

  const running = () => wantPlay && !tabHidden && inView && !busy && at < last;

  const imgOf = (i: number) => frames[i]?.querySelector<HTMLImageElement>('.focus-image__img');

  /** Starts or stops the hold timer and the CSS clocks to match the state. */
  const sync = () => {
    const on = running();
    if (on && !timer) {
      startedAt = performance.now();
      timer = window.setTimeout(() => {
        timer = 0;
        void go(at + 1);
      }, remaining);
    } else if (!on && timer) {
      window.clearTimeout(timer);
      timer = 0;
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
    }
    if (on) delete root.dataset.paused;
    else root.dataset.paused = '';
    // Stopped by the visitor (or at the end): the current segment shows full.
    if (!wantPlay || at === last) root.dataset.stopped = '';
    else delete root.dataset.stopped;
    playBtn.textContent = wantPlay && at < last ? 'Pause' : 'Play';
    if (live) live.setAttribute('aria-live', wantPlay && at < last ? 'off' : 'polite');
  };

  const announce = () => {
    if (!live) return;
    const f = frames[at];
    live.textContent =
      at === last && f.dataset.end !== undefined
        ? 'End credits'
        : `Frame ${at + 1} of ${frames.length}${f.dataset.caption ? `: ${f.dataset.caption}` : ''}`;
  };

  /** Shows frame n. `burned`: the canvas already showed it, so skip the crossfade. */
  const show = (n: number, burned: boolean) => {
    const from = at;
    // The opening frame keeps 'is-first' (no focus pull on the LCP) until the film moves.
    frames.forEach((f) => f.classList.remove('is-burned', ...(n === from ? [] : ['is-first'])));
    if (burned) {
      frames[from].classList.add('is-burned');
      frames[n].classList.add('is-burned');
    }
    frames[from].classList.remove('is-on');
    frames[n].classList.add('is-on');
    at = n;
    remaining = HOLD;
    // After the opening frame the title chip shrinks to a running title.
    root.toggleAttribute('data-rolling', at > 0);
    ticks.forEach((t, i) => {
      t.className = i < at ? 'is-done' : i === at ? 'is-now' : '';
    });
    if (count) count.textContent = `${pad(at + 1)} / ${pad(frames.length)}`;
    prevBtn.setAttribute('aria-disabled', String(at === 0));
    nextBtn.setAttribute('aria-disabled', String(at === last));
    // Fetch the next photo ahead of its turn, and its burn textures.
    const nextImg = imgOf(at + 1);
    if (nextImg) nextImg.loading = 'eager';
    if (burn) {
      burn.load(at);
      burn.load(at + 1);
      burn.keep([at - 1, at, at + 1]);
    }
    announce();
    sync();
  };

  const go = async (n: number) => {
    if (busy || n < 0 || n > last || n === at) return;
    window.clearTimeout(timer);
    timer = 0;
    const from = at;
    const imgA = imgOf(from);
    const imgB = imgOf(n);
    if (burn && canvas && imgA && imgB && burn.ready(from, n)) {
      busy = true;
      sync();
      const zoom = new DOMMatrixReadOnly(getComputedStyle(imgA).transform).a || 1;
      await burn.run(from, n, {
        zoomA: zoom,
        containA: getComputedStyle(imgA).objectFit === 'contain',
        containB: getComputedStyle(imgB).objectFit === 'contain',
        duration: BURN,
      });
      busy = false;
      show(n, true);
      // Let the swapped frames paint under the canvas before it fades away.
      requestAnimationFrame(() => requestAnimationFrame(() => burn?.clear()));
      return;
    }
    show(n, false);
  };

  const setPlay = (v: boolean) => {
    wantPlay = v && !reduce;
    if (wantPlay && at === last) {
      void go(0);
      return;
    }
    sync();
  };

  // ---- Wiring ------------------------------------------------------------------
  const onPrev = () => void go(at - 1);
  const onNext = () => void go(at + 1);
  const onPlay = () => setPlay(!wantPlay || at === last);
  const onAgain = () => {
    wantPlay = !reduce;
    void go(0);
    playBtn.focus({ preventScroll: true });
  };
  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  playBtn.addEventListener('click', onPlay);
  again?.addEventListener('click', onAgain);

  const editable = (el: EventTarget | null) =>
    el instanceof HTMLElement &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !inView) return;
    if (editable(e.target) || document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowRight') onNext();
    else if (e.key === 'ArrowLeft') onPrev();
    else if (e.key === ' ' && !reduce) {
      const t = e.target;
      if (t !== document.body && t !== root && t !== document.documentElement) return;
      e.preventDefault();
      onPlay();
    }
  };
  document.addEventListener('keydown', onKey);

  let x0: number | null = null;
  let y0 = 0;
  const onTouchStart = (e: TouchEvent) => {
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) (dx < 0 ? onNext : onPrev)();
  };
  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });

  const onVisibility = () => {
    tabHidden = document.visibilityState === 'hidden';
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          ([entry]) => {
            inView = entry.intersectionRatio >= 0.5;
            sync();
          },
          { threshold: [0, 0.5, 1] },
        )
      : null;
  io?.observe(root);

  show(0, false);

  return () => {
    window.clearTimeout(timer);
    io?.disconnect();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    burn?.destroy();
  };
}

// Runs at load and again on every astro:page-load (which also fires on the
// first load); a film already set up is left alone.
function init() {
  const root = document.querySelector<HTMLElement>('[data-film]');
  if (!root || root.dataset.mode === 'film') return;
  teardown?.();
  teardown = setup(root);
}

init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  teardown?.();
  teardown = null;
});

export {};
