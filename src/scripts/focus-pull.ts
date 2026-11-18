// Safe to edit by hand
// The focus pull (DESIGN.md "Everything comes into focus"): a [data-focus]
// frame gets .is-focused once it is near the viewport and its image has
// decoded, and portfolio.css eases the photo from its blur to sharp. The hidden
// start state lives under html.motion, so this script is never what makes a
// photo visible for someone with JavaScript off or reduced motion.

const FOCUSED = 'is-focused';

function sharpen(frame: Element) {
  const img = frame.querySelector('img');
  const done = () => frame.classList.add(FOCUSED);
  if (!img || (img.complete && img.naturalWidth > 0)) return done();
  img.decode().then(done, done);
}

function init() {
  const frames = Array.from(document.querySelectorAll(`[data-focus]:not(.${FOCUSED})`));
  if (!frames.length) return;
  if (
    !document.documentElement.classList.contains('motion') ||
    !('IntersectionObserver' in window)
  ) {
    frames.forEach((f) => f.classList.add(FOCUSED));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        sharpen(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  frames.forEach((f) => io.observe(f));
}

init();
document.addEventListener('astro:page-load', init);

export {};
