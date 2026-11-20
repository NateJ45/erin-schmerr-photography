// Safe to edit by hand
// The consultation request WITHOUT JavaScript (src/components/booking/BookingForm.astro).
//
// A plain HTML form cannot send JSON, and /api/contact/ (PORTABLE, the family's contact
// backend) reads JSON only. Rather than fork that route, this one turns the posted form
// into the same JSON the browser script sends (composeBooking, src/lib/booking-message.ts)
// and hands it to the contact route's own POST, so the honeypot, the timing check,
// Turnstile, store-first-then-notify and the Studio inbox all apply unchanged.
//
// It answers with a 303 back to the Contact page: #booking-sent when the message is stored
// or sent, #booking-failed otherwise. The page shows the matching panel with `:target`, so
// nothing typed ever travels in the address. The JavaScript form never posts here.

import type { APIContext, APIRoute } from 'astro';
import { POST as contactPost } from './contact';
import { BOOKING_FIELD_NAMES, composeBooking, type BookingAnswers } from '@/lib/booking-message';

export const prerender = false;

const back = (hash: 'booking-sent' | 'booking-failed') =>
  new Response(null, {
    status: 303,
    headers: { location: `/contact/#${hash}`, 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async (context: APIContext) => {
  let data: FormData;
  try {
    data = await context.request.formData();
  } catch {
    return back('booking-failed');
  }
  const text = (name: string) => {
    const v = data.get(name);
    return typeof v === 'string' ? v : '';
  };

  // Every question the form can ask; composeBooking keeps only the chosen kind's own
  // (without JavaScript every branch is on the page, so the others may hold stray answers).
  // A "tick any that apply" group posts one value per box, hence getAll.
  const answers: BookingAnswers = {};
  for (const name of BOOKING_FIELD_NAMES) {
    const all = data.getAll(name).filter((v): v is string => typeof v === 'string');
    answers[name] = all.length > 1 ? all : (all[0] ?? '');
  }
  const { subject, message } = composeBooking(answers);

  // The contact route reads exactly these keys (src/lib/contact-submission.ts). No render
  // time travels without JavaScript, so its timing check is skipped, as it is designed to be.
  const payload = {
    name: text('name'),
    email: text('email'),
    subject,
    message,
    company: text('company'),
  };
  const headers = new Headers(context.request.headers);
  headers.set('content-type', 'application/json');
  headers.delete('content-length');
  const request = new Request(new URL('/api/contact/', context.url), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  try {
    // Only what the contact route reads. Spreading the whole context would touch getters such
    // as clientAddress, which the Cloudflare adapter throws on.
    const res = await contactPost({ request, locals: context.locals } as unknown as APIContext);
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
    return back(res.ok && body.ok ? 'booking-sent' : 'booking-failed');
  } catch (err) {
    console.error('[booking] could not hand the request to the contact route:', err);
    return back('booking-failed');
  }
};

/** Anything but POST: a person opening the address lands on the page itself. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 303, headers: { location: '/contact/' } });
