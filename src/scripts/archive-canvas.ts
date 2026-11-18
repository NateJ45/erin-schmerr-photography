// scaffold-file: stories
// Safe to edit by hand
// The archive canvas (DESIGN.md "Archive canvas", /archive/). Progressive: the
// page ships a plain grid of every photo, and this turns it into an endless,
// draggable plane only where that makes sense (a mouse, a wide screen, motion
// allowed). Touch, reduced motion and JavaScript-off keep the grid.
//
// How the endless plane works: the grid becomes a fixed-size TILE (columns of
// a set width, every other column dropped half a cell for an organic edge), and
// three more copies of the tile sit right, below and diagonally. Dragging moves
// all four together, and the offset wraps modulo the tile size, so the copies
// always cover the viewport. The copies are `inert` and aria-hidden: assistive
// tech and the keyboard only ever meet the original links once.
//
// Keyboard: the viewport takes focus and pans with the arrow keys; tabbing to a
// photo glides the plane to centre it. A click that ends a drag is swallowed so
// a drag never opens a story by accident.

const CELL = 240; // px, one column's width
const GAP = 24; // px between photos
const RATIO = 5 / 4; // cells are 4:5 portraits
const FRICTION = 0.92; // momentum decay per frame
const DRAG_THRESHOLD = 6; // px before a press counts as a drag

const wants = () =>
  document.documentElement.classList.contains('motion') &&
  window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 64rem)').matches;

function setup(root: HTMLElement) {
  if (root.dataset.canvasReady) return;
  root.dataset.canvasReady = '1';

  const viewport = root.querySelector<HTMLElement>('.archive__viewport');
  const plane = root.querySelector<HTMLUListElement>('.archive__plane');
  const controls = document.querySelector<HTMLElement>('.archive__controls');
  const toggle = document.querySelector<HTMLButtonElement>('[data-archive-toggle]');
  if (!viewport || !plane || !controls || !toggle) return;
  // Non-null copies, so the closures below keep the narrowing.
  const vp: HTMLElement = viewport;
  const pl: HTMLUListElement = plane;
  const ctl: HTMLElement = controls;
  const tg: HTMLButtonElement = toggle;

  const items = Array.from(pl.children) as HTMLElement[];
  if (items.length < 4) return; // too few photos to loop; the grid is better

  ctl.hidden = false;
  let on = false;
  let world: HTMLElement | null = null;
  let tileW = 0;
  let tileH = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let raf = 0;

  const cols = Math.max(4, Math.ceil(Math.sqrt(items.length * 1.6)));
  const rowH = CELL * RATIO + GAP;

  function layout() {
    const rows = Math.ceil(items.length / cols);
    tileW = cols * (CELL + GAP);
    tileH = rows * rowH;
    // A short last row would leave holes in the endless plane, so fill the
    // tile with hidden repeats of the first photos. A dropped column's last
    // photo runs into the next tile's top half-cell, which that column leaves
    // empty, so the seams meet exactly.
    const cells: HTMLElement[] = [...items];
    for (let i = items.length; i < rows * cols; i++) {
      const filler = items[i % items.length].cloneNode(true) as HTMLElement;
      filler.setAttribute('aria-hidden', 'true');
      filler.inert = true;
      filler.classList.add('archive__filler');
      filler.querySelectorAll('[data-focus]').forEach((el) => el.classList.add('is-focused'));
      pl.append(filler);
      cells.push(filler);
    }
    cells.forEach((li, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      li.style.left = `${c * (CELL + GAP)}px`;
      li.style.top = `${r * rowH + (c % 2 ? rowH / 2 : 0)}px`;
    });
    pl.style.width = `${tileW}px`;
    pl.style.height = `${tileH}px`;
  }

  function paint() {
    if (!world) return;
    const ox = (((x % tileW) + tileW) % tileW) - tileW;
    const oy = (((y % tileH) + tileH) % tileH) - tileH;
    world.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
  }

  function glide() {
    x += vx;
    y += vy;
    vx *= FRICTION;
    vy *= FRICTION;
    paint();
    raf = Math.abs(vx) + Math.abs(vy) > 0.2 ? requestAnimationFrame(glide) : 0;
  }

  function enable() {
    on = true;
    root.classList.add('archive--canvas');
    pl.classList.remove('mx-auto', 'max-w-content', 'px-m');
    layout();
    world = document.createElement('div');
    world.className = 'archive__world';
    pl.replaceWith(world);
    world.append(pl);
    // Three copies make the pl endless. 3x3 would cover any vp; 2x2
    // plus the modulo is enough when a tile is at least the vp's size,
    // so add copies until it is.
    const across = Math.max(2, Math.ceil(vp.clientWidth / tileW) + 1);
    const down = Math.max(2, Math.ceil(vp.clientHeight / tileH) + 1);
    for (let a = 0; a < across; a++) {
      for (let d = 0; d < down; d++) {
        if (a === 0 && d === 0) continue;
        const copy = pl.cloneNode(true) as HTMLElement;
        copy.setAttribute('aria-hidden', 'true');
        copy.inert = true;
        copy.classList.add('archive__copy');
        copy.style.left = `${a * tileW}px`;
        copy.style.top = `${d * tileH}px`;
        // Copies keep their photos sharp (their focus-pull observers never ran).
        copy.querySelectorAll('[data-focus]').forEach((f) => f.classList.add('is-focused'));
        world.append(copy);
      }
    }
    vp.tabIndex = 0;
    vp.setAttribute('role', 'region');
    vp.setAttribute('aria-label', 'Archive canvas. Drag, or use the arrow keys, to move around.');
    x = -(tileW - vp.clientWidth) / 2;
    y = -rowH / 3;
    paint();
    tg.textContent = 'View as a grid';
  }

  function disable() {
    on = false;
    cancelAnimationFrame(raf);
    root.classList.remove('archive--canvas');
    world?.querySelectorAll('.archive__copy').forEach((c) => c.remove());
    pl.querySelectorAll('.archive__filler').forEach((c) => c.remove());
    if (world) world.replaceWith(pl);
    world = null;
    pl.classList.add('mx-auto', 'max-w-content', 'px-m');
    pl.style.width = '';
    pl.style.height = '';
    items.forEach((li) => {
      li.style.left = '';
      li.style.top = '';
    });
    vp.removeAttribute('tabindex');
    vp.removeAttribute('role');
    vp.removeAttribute('aria-label');
    tg.textContent = 'View as a canvas';
  }

  tg.removeAttribute('aria-pressed');
  tg.addEventListener('click', () => (on ? disable() : enable()));

  // Drag, with momentum on release.
  let down = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  vp.addEventListener('pointerdown', (e) => {
    if (!on || e.button !== 0) return;
    down = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    vx = vy = 0;
    cancelAnimationFrame(raf);
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > DRAG_THRESHOLD) root.classList.add('is-dragging');
    x += dx;
    y += dy;
    vx = dx;
    vy = dy;
    paint();
  });
  const release = () => {
    if (!down) return;
    down = false;
    root.classList.remove('is-dragging');
    raf = requestAnimationFrame(glide);
  };
  vp.addEventListener('pointerup', release);
  vp.addEventListener('pointercancel', release);
  // A click that ends a real drag must not follow the link under the pointer.
  vp.addEventListener(
    'click',
    (e) => {
      if (on && moved > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  vp.addEventListener('dragstart', (e) => on && e.preventDefault());

  // Keyboard: arrows pan; focusing a photo brings it to the middle.
  vp.addEventListener('keydown', (e) => {
    if (!on) return;
    const step = e.shiftKey ? CELL * 2 : CELL / 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    vx = m[0] * (1 - FRICTION);
    vy = m[1] * (1 - FRICTION);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(glide);
  });
  vp.addEventListener('focusin', (e) => {
    if (!on || !(e.target instanceof HTMLElement) || e.target === vp) return;
    const li = e.target.closest('li');
    if (!li) return;
    const v = vp.getBoundingClientRect();
    const r = li.getBoundingClientRect();
    x += v.left + v.width / 2 - (r.left + r.width / 2);
    y += v.top + v.height / 2 - (r.top + r.height / 2);
    paint();
  });

  enable();
}

function init() {
  if (!wants()) return;
  document.querySelectorAll<HTMLElement>('[data-archive]').forEach(setup);
}

init();
document.addEventListener('astro:page-load', init);

export {};
