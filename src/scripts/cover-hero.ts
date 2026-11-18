// scaffold-file: stories
// Safe to edit by hand
// The cover hero's crossfade (src/components/portfolio/CoverHero.astro). One
// slide and its caption carry .is-active; every HOLD ms the next takes over,
// and portfolio.css fades it in from blurred and slightly large to sharp. It
// holds for reduced motion, a hidden tab, a pointer or keyboard focus resting
// on the hero, and the Pause button. With one cover, nothing moves.

const HOLD = 6500;

function setup(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const captions = Array.from(root.querySelectorAll<HTMLElement>('[data-caption]'));
  const pause = root.querySelector<HTMLButtonElement>('[data-cover-pause]');
  if (slides.length < 2 || !document.documentElement.classList.contains('motion')) return;

  let current = 0;
  let paused = false;
  let resting = false;
  let timer = 0;

  const show = (n: number) => {
    slides[current]?.classList.remove('is-active');
    captions[current]?.classList.remove('is-active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    captions[current]?.classList.add('is-active');
  };
  const tick = () => {
    if (!paused && !resting && !document.hidden) show(current + 1);
  };
  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(tick, HOLD);
  };

  if (pause) {
    pause.hidden = false;
    pause.addEventListener('click', () => {
      paused = !paused;
      pause.setAttribute('aria-pressed', String(paused));
      pause.textContent = paused ? 'Play' : 'Pause';
      if (!paused) start();
    });
  }
  root.addEventListener('pointerenter', () => (resting = true));
  root.addEventListener('pointerleave', () => (resting = false));
  root.addEventListener('focusin', () => (resting = true));
  root.addEventListener('focusout', () => (resting = false));
  root.classList.add('is-running');
  start();
  // Stop the interval when the router swaps this page out.
  document.addEventListener('astro:before-swap', () => window.clearInterval(timer), {
    once: true,
  });
}

function init() {
  document.querySelectorAll<HTMLElement>('[data-cover-hero]').forEach(setup);
}

init();
document.addEventListener('astro:page-load', init);

export {};
