// Safe to edit by hand
// /api/guide/ - "Send me the sitting guide" (2026-11-20, phase 2 booking funnel).
//
// Takes an email (and an optional first name) from GuideCapture.astro, as JSON from the
// browser script or as a plain form post without JavaScript, and does two things:
//
//   1. Emails the visitor the guide's link through the site's one sender
//      (src/lib/mail-env.ts workerMailer, the email backbone of PORTS.md card 127), when the
//      Worker has a sender. One transactional email they asked for; nothing is stored and
//      they join no list (the newsletter stays its own double opt-in).
//   2. Tells Erin, as a "Sitting guide request" through the contact route's own POST, so the
//      lead lands where every enquiry does (stored first in CONTACT_DB when it exists, then
//      emailed; the Studio inbox), with the same checks. Nothing reaches Sanity.
//
// The guide itself is never held back by the mail: the answer always carries its address,
// and the page shows the link at once. `emailed` says whether a copy really went out, so
// the page never claims an email that was not sent. Today the live Worker has no sender
// (no EMAIL binding, no RESEND_API_KEY), so `emailed` is false until OPERATIONS.md "Email"
// is done; see docs/PENDING.md.
//
// Spam: the honeypot and the timing check the contact form uses (looksAutomated), and a
// small per-isolate limit on how often one visitor can ask (it sends mail to an address
// typed by a stranger, so it must not become a way to flood someone's inbox).
// Without JavaScript it answers with a 303 to /guide/#guide-sent, #guide-ready or
// #guide-failed; nothing typed travels in the address.

import type { APIContext, APIRoute } from 'astro';
import { POST as contactPost } from './contact';
import { looksAutomated } from '@/lib/contact-submission';
import { normalizeEmail } from '@/lib/mail-send';
import { workerMailer } from '@/lib/mail-env';
import { renderEmail } from '@/lib/mail-template';
import { MAIL_BRAND, mailAddress } from '@/lib/newsletter-content';
import { GUIDE } from '@/data/sitting-guide';
import { site } from '@/data/site';

export const prerender = false;

type Outcome = 'guide-sent' | 'guide-ready' | 'guide-failed';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const back = (hash: Outcome) =>
  new Response(null, {
    status: 303,
    headers: { location: `/guide/#${hash}`, 'cache-control': 'no-store' },
  });

// ---- A small limit per visitor (per isolate; a Cloudflare rate rule is the hard one) ----
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 4;
const seen = new Map<string, number[]>();
function overLimit(key: string, now: number): boolean {
  const recent = (seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  seen.set(key, recent);
  if (seen.size > 2000) seen.clear();
  return recent.length > MAX_PER_WINDOW;
}

const firstName = (raw: unknown): string =>
  typeof raw === 'string'
    ? (raw
        .replace(/[\r\n<>]/g, ' ')
        .trim()
        .split(/\s+/)[0]
        ?.slice(0, 40) ?? '')
    : '';

async function guideEmail(origin: string, name: string) {
  const url = `${origin}${GUIDE.readPath}`;
  return renderEmail({
    brand: MAIL_BRAND,
    preheader: GUIDE.dek,
    title: GUIDE.title,
    blocks: [
      {
        kind: 'paragraph',
        text: `${name ? `Hi ${name},` : 'Hello,'}\n\nHere is the sitting guide you asked for: what to wear, how to prepare and what to expect. Keep it for the week before your sitting, or share it with whoever is coming with you.`,
      },
      { kind: 'button', label: 'Read the sitting guide', url },
      {
        kind: 'paragraph',
        text: 'When you are ready, reserve a complimentary consultation and we will plan your portrait together. There is no obligation.',
      },
      { kind: 'button', label: 'Reserve a consultation', url: `${origin}/contact/` },
    ],
    footer: {
      address: await mailAddress(),
      reason: `Someone asked for ${site.name}'s sitting guide to come to this address. This is a single email; you are not on any list.`,
    },
  });
}

export const POST: APIRoute = async (context: APIContext) => {
  const { request } = context;
  const isForm = !(request.headers.get('content-type') ?? '').includes('application/json');
  const answer = (outcome: Outcome, status = 200, extra: Record<string, unknown> = {}) =>
    isForm
      ? back(outcome)
      : json(
          {
            ok: outcome !== 'guide-failed',
            emailed: outcome === 'guide-sent',
            url: GUIDE.readPath,
            ...extra,
          },
          status,
        );

  let raw: Record<string, unknown>;
  try {
    raw = isForm
      ? Object.fromEntries((await request.formData()).entries())
      : ((await request.json()) as Record<string, unknown>);
  } catch {
    return answer('guide-failed', 400, { error: 'Could not read that request.' });
  }

  // A bot gets the same answer a person does (contact-submission.ts explains why).
  if (looksAutomated(raw, Date.now()).automated) return answer('guide-ready');

  const email = normalizeEmail(raw.email);
  if (!email) {
    return answer('guide-failed', 422, {
      errors: { email: 'That email address does not look right.' },
    });
  }
  const name = firstName(raw.name);

  const ip = request.headers.get('cf-connecting-ip') ?? 'local';
  if (overLimit(ip, Date.now())) {
    // The guide is still theirs; only the email is held back.
    return answer('guide-ready');
  }

  // 1. The visitor's copy, when the Worker can send.
  let emailed = false;
  const { mailer, reason } = workerMailer();
  if (mailer) {
    try {
      const { html, text } = await guideEmail(new URL(request.url).origin, name);
      const r = await mailer.send({
        to: email,
        subject: `${GUIDE.title}, from ${site.name}`,
        text,
        html,
        fromName: site.name,
      });
      emailed = r.ok;
      if (!r.ok) console.error('[guide] could not email the guide:', r.error);
    } catch (err) {
      console.error('[guide] could not email the guide:', err);
    }
  } else {
    console.error('[guide] no sender, the guide is shown on the page only:', reason);
  }

  // 2. Erin hears about it the way she hears about every enquiry.
  try {
    const body = {
      name: name || 'A visitor',
      email,
      subject: `Sitting guide request${name ? ` (${name})` : ''}`,
      message: emailed
        ? 'Asked for the sitting guide. A copy was emailed to them.'
        : 'Asked for the sitting guide. It was shown on the page (no email copy was sent).',
    };
    const headers = new Headers(request.headers);
    headers.set('content-type', 'application/json');
    headers.delete('content-length');
    await contactPost({
      request: new Request(new URL('/api/contact/', context.url), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
      locals: context.locals,
    } as unknown as APIContext);
  } catch (err) {
    console.error('[guide] could not hand the request to the contact route:', err);
  }

  return answer(emailed ? 'guide-sent' : 'guide-ready');
};

/** Anything but POST: a person opening the address lands on the guide's page. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 303, headers: { location: '/guide/' } });
