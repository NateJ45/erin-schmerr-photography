// Safe to edit by hand
// The booking request's answers folded into the contact route's one message (2026-11-20).
// Used by the browser (src/scripts/booking-form.ts) and by the no-JS route
// (src/pages/api/booking.ts), so both send the same email. The contact backend only knows
// name, email, subject and message; the chapters' answers travel as "Label: answer" lines,
// the way the old form's own questions did, so nothing downstream had to change.
//
// No imports on purpose: node runs this file directly in the unit tests.

export interface BookingAnswers {
  sitting?: string;
  season?: string;
  month?: string;
  flexibility?: string;
  story?: string;
  name?: string;
  phone?: string;
}

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/\s+$/g, '').trim().slice(0, max) : '';

export function composeBooking(a: BookingAnswers): { subject: string; message: string } {
  const sitting = clean(a.sitting, 80);
  const name = clean(a.name, 120);
  const lines: string[] = [];
  if (sitting) lines.push(`Sitting: ${sitting}`);
  if (clean(a.season, 60)) lines.push(`Season: ${clean(a.season, 60)}`);
  if (clean(a.month, 120)) lines.push(`Month or date in mind: ${clean(a.month, 120)}`);
  if (clean(a.flexibility, 200)) lines.push(`Flexibility: ${clean(a.flexibility, 200)}`);
  if (clean(a.phone, 40)) lines.push(`Phone: ${clean(a.phone, 40)}`);
  const story = clean(a.story, 4000);
  // The story is required; with it missing the message is empty so the route's own check
  // ("Please write a message.") answers, rather than a message of labels alone.
  const message = !story ? '' : lines.length ? [...lines, '', story].join('\n') : story;
  const subject = `Booking request${sitting ? `: ${sitting}` : ''}${name ? ` (${name})` : ''}`;
  return { subject: subject.slice(0, 200), message };
}
