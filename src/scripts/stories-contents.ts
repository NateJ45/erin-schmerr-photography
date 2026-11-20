// scaffold-file: stories
// Safe to edit by hand
// The /stories/ List / Grid toggle (StoriesContents.astro). Shows the toggle
// (it stays hidden without JavaScript, where the list is the only view), keeps
// aria-pressed in step with the root's data-view, and remembers the choice per
// visitor in localStorage. Storage can throw (private windows, blocked site
// data), so every read and write is wrapped and a failure only forgets.
// Astro's router: bound on astro:page-load, so it runs again on every visit.
export {};

const KEY = 'tate-stories-view';

function remember(view: string): void {
  try {
    localStorage.setItem(KEY, view);
  } catch {
    /* Storage blocked: the choice lasts for this page only. */
  }
}

function setup(): void {
  const root = document.querySelector<HTMLElement>('[data-mag-contents]');
  const toggle = root?.querySelector<HTMLElement>('[data-mag-toggle]');
  if (!root || !toggle) return;
  const buttons = Array.from(toggle.querySelectorAll<HTMLButtonElement>('[data-view-btn]'));

  const apply = (view: string) => {
    root.dataset.view = view;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
    root.dispatchEvent(new CustomEvent('mag:view', { detail: view }));
  };

  apply(root.dataset.view === 'grid' ? 'grid' : 'list');
  toggle.hidden = false;
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const view = b.dataset.viewBtn === 'grid' ? 'grid' : 'list';
      apply(view);
      remember(view);
    }),
  );
}

document.addEventListener('astro:page-load', setup);
