// Safe to edit by hand
// The sitting guide's email capture (src/components/funnel/GuideCapture.astro). Vanilla
// TypeScript, no dependency. Posts JSON to /api/guide/ and turns the form into its answer in
// place; without JavaScript the form posts itself and /guide/ shows the answer (`:target`).
// "A copy is on its way" is shown only when the route says an email really went out.
import { track } from '@/lib/track';

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function wire(root: HTMLElement): void {
  if (root.dataset.gcReady) return;
  root.dataset.gcReady = '1';
  const form = root.querySelector<HTMLFormElement>('[data-gc-form]');
  const done = root.querySelector<HTMLElement>('[data-gc-done]');
  const emailedLine = root.querySelector<HTMLElement>('[data-gc-emailed]');
  const error = root.querySelector<HTMLElement>('[data-gc-error]');
  const send = root.querySelector<HTMLButtonElement>('[data-gc-send]');
  if (!form || !done) return;

  form.noValidate = true;
  const rendered = form.querySelector<HTMLInputElement>('[data-gc-rendered]');
  if (rendered) rendered.value = String(Date.now());
  const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
  const label = send?.textContent ?? '';

  const say = (message: string | null) => {
    if (error) {
      error.textContent = message ?? '';
      error.hidden = !message;
    }
    if (message) emailInput?.setAttribute('aria-invalid', 'true');
    else emailInput?.removeAttribute('aria-invalid');
  };
  emailInput?.addEventListener('input', () => say(null));

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const email = emailInput?.value.trim() ?? '';
    if (!looksLikeEmail(email)) {
      say(email ? 'That email address does not look right.' : 'Please give me your email.');
      emailInput?.focus();
      return;
    }
    say(null);
    sending = true;
    form.setAttribute('aria-busy', 'true');
    if (send) {
      send.disabled = true;
      send.textContent = 'Sending';
    }
    const value = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? '';
    try {
      const res = await fetch('/api/guide/', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          email,
          name: value('name'),
          company: value('company'),
          renderedAt: Number(rendered?.value) || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        emailed?: boolean;
        errors?: Record<string, string>;
        error?: string;
      };
      if (res.ok && body.ok) {
        track('generate_lead', {
          form_name: 'sitting_guide',
          form_location: root.dataset.location ?? 'unknown',
        });
        if (emailedLine) emailedLine.hidden = !body.emailed;
        form.hidden = true;
        done.hidden = false;
        done.focus();
        return;
      }
      say(body.errors?.email ?? body.error ?? 'That did not work. Please try again in a minute.');
    } catch {
      say('That did not send. Please check your connection and try again.');
    } finally {
      sending = false;
      form.setAttribute('aria-busy', 'false');
      if (send) {
        send.disabled = false;
        send.textContent = label;
      }
    }
  });
}

function init(): void {
  document.querySelectorAll<HTMLElement>('[data-guide-capture]').forEach(wire);
}

init();
document.addEventListener('astro:page-load', init);
