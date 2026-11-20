// Safe to edit by hand
// The booking request's behaviour (src/components/booking/BookingForm.astro, DESIGN.md
// "Booking request"). Vanilla TypeScript, no dependency.
//
// - Motion allowed: one chapter at a time. Continue checks the chapter it is on, Back never
//   checks, the thin progress line and "Chapter II of IV" follow along, and focus moves to
//   each chapter's heading. Enter in a text box acts as Continue until the last chapter.
// - Reduced motion: every chapter stays stacked; Send checks them all.
// - Either way: errors are written under their own field (aria-invalid, aria-describedby),
//   focus goes to the first one, and the answers go to /api/contact/ as one message through
//   sendContactSubmission() (the contact form's own backend, honeypot and timing check). On
//   success: generate_lead, the draft is cleared and the page turns to "Thank you, <name>".
// - The unsent draft lives in sessionStorage (this tab only, never localStorage), as the old
//   contact form's did. ?topic=<word> picks a sitting, ?about=<text> starts the story.
//
// Without JavaScript none of this runs and the form posts to /api/booking/ (see the component).

import { sendContactSubmission } from '@/lib/contact-transport';
import { track } from '@/lib/track';
import { composeBooking, type BookingAnswers } from '@/lib/booking-message';

const ROMAN = ['I', 'II', 'III', 'IV'];
const DRAFT_KEY = 'booking-draft';
const DRAFT_FIELDS = [
  'sitting',
  'season',
  'month',
  'flexibility',
  'story',
  'name',
  'phone',
  'email',
];
const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY as string | undefined;

function store(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-booking]');
  if (!root || root.dataset.bkReady) return;
  root.dataset.bkReady = '1';

  const form = root.querySelector<HTMLFormElement>('[data-bk-form]');
  if (!form) return;
  const chapters = [...form.querySelectorAll<HTMLFieldSetElement>('[data-bk-chapter]')];
  const alertBox = form.querySelector<HTMLElement>('[data-bk-alert]');
  const sendButton = form.querySelector<HTMLButtonElement>('[data-bk-send]');
  const sent = root.querySelector<HTMLElement>('#booking-sent');

  // Our own messages replace the browser's bubbles once the script runs.
  form.noValidate = true;
  const rendered = form.querySelector<HTMLInputElement>('[data-bk-rendered]');
  if (rendered) rendered.value = String(Date.now());

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepped = !reduce;
  let current = 0;

  // ---- Values -------------------------------------------------------------------------
  const field = (name: string) => form.elements.namedItem(name);
  const value = (name: string): string => {
    const el = field(name);
    if (!el) return '';
    if (el instanceof RadioNodeList) return el.value.trim();
    return (el as HTMLInputElement).value.trim();
  };
  const inputsOf = (name: string): HTMLInputElement[] => [
    ...form.querySelectorAll<HTMLInputElement>(`[name="${name}"]`),
  ];

  // ---- Errors -------------------------------------------------------------------------
  function setError(name: string, message: string | null): void {
    const line = form!.querySelector<HTMLElement>(`[data-bk-error-for="${name}"]`);
    if (line) {
      line.textContent = message ?? '';
      line.hidden = !message;
    }
    for (const input of inputsOf(name)) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      // A radio points at its group's line; text boxes already do in the markup.
      if (input.type === 'radio' && line) {
        const ids = new Set((input.getAttribute('aria-describedby') ?? '').split(' '));
        ids.add(line.id);
        input.setAttribute('aria-describedby', [...ids].filter(Boolean).join(' '));
      }
    }
  }

  /** The problems in one chapter, as name to message, in the order they appear. */
  function problems(index: number): [string, string][] {
    const out: [string, string][] = [];
    if (index === 0 && !value('sitting')) out.push(['sitting', 'Please choose a sitting.']);
    if (index === 1 && !value('season'))
      out.push(['season', 'Please choose a season, or "Open to any season".']);
    if (index === 2 && !value('story')) out.push(['story', 'Please tell me a little about it.']);
    if (index === 3) {
      if (!value('name')) out.push(['name', 'Please tell me your name.']);
      const email = value('email');
      if (!email) out.push(['email', 'Please give me an email address so I can reply.']);
      else if (!looksLikeEmail(email))
        out.push(['email', 'That email address does not look right.']);
    }
    return out;
  }

  const CHAPTER_FIELDS = [['sitting'], ['season'], ['story'], ['name', 'email']];

  /** Write a chapter's errors; true when it is clean. Focus goes to the first problem. */
  function check(index: number, focus = true): boolean {
    const found = problems(index);
    for (const name of CHAPTER_FIELDS[index]) setError(name, null);
    for (const [name, message] of found) setError(name, message);
    if (found.length && focus) {
      const first = inputsOf(found[0][0]);
      const target = first.find((i) => i.checked) ?? first[0];
      target?.focus();
    }
    return found.length === 0;
  }

  // Clear a line as soon as it is answered.
  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name;
    if (name && form.querySelector(`[data-bk-error-for="${name}"]:not([hidden])`)) {
      const index = CHAPTER_FIELDS.findIndex((f) => f.includes(name));
      if (index >= 0 && !problems(index).some(([n]) => n === name)) setError(name, null);
    }
    saveDraft();
  });
  form.addEventListener('change', saveDraft);

  // ---- Chapters -----------------------------------------------------------------------
  const progressLabel = form.querySelector<HTMLElement>('[data-bk-progress-label]');
  const progressFill = form.querySelector<HTMLElement>('[data-bk-progress-fill]');

  function show(index: number, moveFocus: boolean): void {
    current = index;
    chapters.forEach((ch, i) => {
      ch.hidden = i !== index;
      ch.classList.toggle('is-entering', i === index && moveFocus);
    });
    if (progressLabel) progressLabel.textContent = `Chapter ${ROMAN[index]} of IV`;
    if (progressFill) progressFill.style.transform = `scaleX(${(index + 1) / chapters.length})`;
    if (moveFocus) {
      const heading = chapters[index].querySelector<HTMLElement>('[data-bk-chapter-heading]');
      // Bring the chapter's top into view (native scroll, rule 5), then focus its heading.
      const top = form!.getBoundingClientRect().top;
      if (top < 0) form!.scrollIntoView({ behavior: 'instant', block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }

  if (stepped) {
    root.classList.add('bk--stepped');
    for (const el of form.querySelectorAll<HTMLElement>('[data-bk-nav], [data-bk-progress]')) {
      el.hidden = false;
    }
    show(0, false);
  }

  form.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-bk-next]')) {
      if (check(current)) show(Math.min(current + 1, chapters.length - 1), true);
    } else if (t.closest('[data-bk-back]')) {
      show(Math.max(current - 1, 0), true);
    }
  });

  // ---- Draft and prefill ---------------------------------------------------------------
  function saveDraft(): void {
    const draft: Record<string, string> = {};
    for (const name of DRAFT_FIELDS) {
      const v = value(name);
      if (v) draft[name] = v;
    }
    try {
      if (Object.keys(draft).length) store()?.setItem(DRAFT_KEY, JSON.stringify(draft));
      else store()?.removeItem(DRAFT_KEY);
    } catch {
      /* storage blocked: the form still works */
    }
  }

  function put(name: string, v: string): void {
    for (const input of inputsOf(name)) {
      if (input.type === 'radio') input.checked = input.value === v;
      else if (!input.value) input.value = v;
    }
    const area = form!.querySelector<HTMLTextAreaElement>(`textarea[name="${name}"]`);
    if (area && !area.value) area.value = v;
  }

  try {
    const raw = store()?.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw) as Record<string, string>;
      for (const name of DRAFT_FIELDS) if (draft[name]) put(name, draft[name]);
    }
  } catch {
    /* a broken draft is ignored */
  }

  const params = new URLSearchParams(window.location.search);
  const topic = params.get('topic')?.trim().toLowerCase();
  if (topic && !value('sitting')) {
    const match = form.querySelector<HTMLInputElement>(`[data-bk-topic*="${CSS.escape(topic)}"]`);
    if (match) match.checked = true;
  }
  const about = params.get('about')?.trim().slice(0, 120);
  const story = form.querySelector<HTMLTextAreaElement>('[data-bk-story]');
  if (about && story && !story.value) story.value = `About ${about}: `;

  // ---- Sending ------------------------------------------------------------------------
  const compose = () =>
    composeBooking(Object.fromEntries(DRAFT_FIELDS.map((n) => [n, value(n)])) as BookingAnswers);

  function say(message: string | null): void {
    if (!alertBox) return;
    alertBox.textContent = message ?? '';
    alertBox.hidden = !message;
  }

  function showSent(): void {
    const name = value('name');
    const heading = root!.querySelector<HTMLElement>('[data-bk-sent-heading]');
    if (heading && name) heading.textContent = `Thank you, ${name.split(/\s+/)[0]}.`;
    root!.classList.add('is-sent');
    sent?.scrollIntoView({ behavior: 'instant', block: 'start' });
    sent?.focus({ preventScroll: true });
  }

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;

    // Enter in a text box on an earlier chapter means Continue.
    if (stepped && current < chapters.length - 1) {
      if (check(current)) show(current + 1, true);
      return;
    }

    // Every chapter, first problem first; the stepped form goes back to that chapter.
    for (let i = 0; i < chapters.length; i++) {
      if (!problems(i).length) continue;
      if (stepped && i !== current) show(i, true);
      check(i, true);
      for (let j = i + 1; j < chapters.length; j++) check(j, false);
      return;
    }

    say(null);
    sending = true;
    form.setAttribute('aria-busy', 'true');
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = 'Sending';
    }
    const { subject, message } = compose();
    try {
      const result = await sendContactSubmission(
        {
          name: value('name'),
          email: value('email'),
          subject,
          message,
          company: value('company'),
          renderedAt: Number(rendered?.value) || undefined,
        },
        // Only used on a host with no Worker (contact-transport.ts).
        WEB3FORMS_KEY
          ? async () => {
              const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                  access_key: WEB3FORMS_KEY,
                  subject,
                  name: value('name'),
                  email: value('email'),
                  message,
                }),
              });
              return res.ok ? { ok: true } : { ok: false, error: undefined };
            }
          : undefined,
      );
      if (result.ok) {
        track('generate_lead', { form_name: 'contact', form_location: 'contact_page' });
        try {
          store()?.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        showSent();
        return;
      }
      if (result.errors) {
        for (const [name, msg] of Object.entries(result.errors)) {
          setError(name === 'message' ? 'story' : name, msg);
        }
      }
      say(result.error ?? 'That did not send. Please try again in a minute, or email me directly.');
    } catch {
      say('That did not send. Please check your connection, or email me directly.');
    } finally {
      sending = false;
      form.setAttribute('aria-busy', 'false');
      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = 'Send my request';
      }
    }
  });
}

init();
document.addEventListener('astro:page-load', init);
