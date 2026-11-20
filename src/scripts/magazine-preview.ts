// Safe to edit by hand
// The floating picture and cursor label for the magazine lists: /stories/
// (StoriesContents.astro) and /press/ (press.astro). After clementgrellier.fr
// (Details voyTQPKp3dU0hluXAXv2Mq): one fixed frame holds every picture,
// stacked; pointing at a row cross-fades to that row's picture and the frame
// eases after the cursor (a requestAnimationFrame lerp, transforms only).
//
// Markup it reads:
//   [data-mag-preview-root]        the list; gets data-preview="on" when live
//   [data-preview-index]           each row's link (and data-cursor-label,
//                                  data-vt-name for the story cover hand-off)
//   [data-mag-preview]             the fixed frame, [data-preview-pic=i] inside
//   [data-mag-cursor]              the small label that rides with the cursor
//
// Live only with a mouse-like pointer from 64rem up and motion allowed
// (html.motion, set by BaseLayout). Everywhere else nothing is set, and the CSS
// shows each row's own small picture inline. On /stories/ the frame is only
// used in the List view (the Grid has its own pictures). Keyboard focus shows
// the frame beside the focused row without moving it after a pointer.
//
// The story cover hand-off: on a click, the frame's picture takes the story's
// view-transition name, so Astro's router grows it into the story page's
// opening cover (the row's own thumbnail, which carries the name, is hidden).
//
// Astro's router: set up on astro:page-load, torn down on astro:before-swap.
export {};

const FINE = '(hover: hover) and (pointer: fine) and (min-width: 64rem)';
let stop: (() => void) | null = null;

function setup(): void {
  stop?.();
  stop = null;
  const root = document.querySelector<HTMLElement>('[data-mag-preview-root]');
  const frame = root?.querySelector<HTMLElement>('[data-mag-preview]');
  const label = root?.querySelector<HTMLElement>('[data-mag-cursor]');
  if (!root || !frame || !label) return;

  const ac = new AbortController();
  const opts = { signal: ac.signal };
  const media = window.matchMedia(FINE);
  const pics = Array.from(frame.querySelectorAll<HTMLElement>('[data-preview-pic]'));
  let raf = 0;
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let placed = false;
  let active: HTMLElement | null = null;
  // The row keyboard focus put the picture beside (it follows that row on scroll).
  let keyed: HTMLElement | null = null;

  const live = () =>
    document.documentElement.classList.contains('motion') &&
    media.matches &&
    (root.dataset.view === undefined || root.dataset.view === 'list');

  const hide = () => {
    active = null;
    keyed = null;
    frame.classList.remove('is-shown');
    label.classList.remove('is-shown');
    placed = false;
  };

  const sync = () => {
    if (live()) root.dataset.preview = 'on';
    else {
      delete root.dataset.preview;
      hide();
    }
  };

  const tick = () => {
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    frame.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
  };
  const moveTo = (nx: number, ny: number, jump: boolean) => {
    const w = frame.offsetWidth;
    const h = frame.offsetHeight;
    const pad = 16;
    tx = nx + 40 + w > window.innerWidth - pad ? nx - w - 40 : nx + 40;
    ty = Math.min(Math.max(ny - h / 2, pad), window.innerHeight - h - pad);
    if (jump || !placed) {
      x = tx;
      y = ty;
      placed = true;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const show = (link: HTMLElement) => {
    active = link;
    const i = link.dataset.previewIndex;
    pics.forEach((p) => p.classList.toggle('is-active', p.dataset.previewPic === i));
    if (root.dataset.preview === 'on') frame.classList.add('is-shown');
  };

  // Over and move both pick the row under the mouse, so the picture comes back
  // on the next move after a scroll has put it away.
  const point = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    keyed = null;
    label.style.transform = `translate3d(${e.clientX + 18}px, ${e.clientY + 18}px, 0)`;
    const link = (e.target as Element).closest<HTMLElement>('[data-preview-index]');
    if (link && link !== active) {
      show(link);
      label.textContent = link.dataset.cursorLabel ?? '';
      label.classList.toggle('is-shown', !!label.textContent && media.matches);
    }
    if (active && root.dataset.preview === 'on') moveTo(e.clientX, e.clientY, false);
  };
  root.addEventListener('pointerover', point, opts);
  root.addEventListener('pointermove', point, opts);
  root.addEventListener(
    'pointerout',
    (e) => {
      const to = e.relatedTarget as Element | null;
      if (to && to.closest('[data-preview-index]')) return;
      hide();
    },
    opts,
  );
  const besideKeyed = () => {
    if (!keyed) return;
    const r = keyed.getBoundingClientRect();
    moveTo(r.left + r.width * 0.55, r.top + r.height / 2, true);
  };
  // Keyboard: beside the focused row, at its middle, without the ease.
  root.addEventListener(
    'focusin',
    (e) => {
      const link = (e.target as Element).closest<HTMLElement>('[data-preview-index]');
      if (!link || !link.matches(':focus-visible') || root.dataset.preview !== 'on') return;
      show(link);
      keyed = link;
      besideKeyed();
    },
    opts,
  );
  root.addEventListener('focusout', () => hide(), opts);
  window.addEventListener('scroll', () => (keyed ? besideKeyed() : active && hide()), {
    ...opts,
    passive: true,
  });

  // Hand the story's view-transition name to the visible picture before the router leaves.
  root.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element).closest<HTMLElement>('[data-vt-name]');
      if (!link || root.dataset.preview !== 'on' || !frame.classList.contains('is-shown')) return;
      const pic = pics.find((p) => p.dataset.previewPic === link.dataset.previewIndex);
      if (pic) pic.style.viewTransitionName = link.dataset.vtName ?? '';
    },
    opts,
  );

  root.addEventListener('mag:view', sync, opts);
  media.addEventListener('change', sync, opts);
  sync();

  stop = () => {
    ac.abort();
    if (raf) cancelAnimationFrame(raf);
  };
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', () => {
  stop?.();
  stop = null;
});
