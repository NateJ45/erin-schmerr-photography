// Safe to edit by hand
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { composeBooking } from './booking-message.ts';

describe('composeBooking', () => {
  it('folds every answer into labelled lines above the story', () => {
    const out = composeBooking({
      sitting: 'Sitting one',
      season: 'Autumn',
      month: 'October',
      flexibility: 'Weekends',
      phone: '555 0100',
      story: 'A portrait for my mother.',
      name: 'Probe Person',
    });
    assert.equal(out.subject, 'Booking request: Sitting one (Probe Person)');
    assert.equal(
      out.message,
      [
        'Sitting: Sitting one',
        'Season: Autumn',
        'Month or date in mind: October',
        'Flexibility: Weekends',
        'Phone: 555 0100',
        '',
        'A portrait for my mother.',
      ].join('\n'),
    );
  });

  it('leaves out the optional lines that are empty', () => {
    const out = composeBooking({ sitting: 'Not sure yet', season: 'Spring', story: 'Hello' });
    assert.equal(out.message, 'Sitting: Not sure yet\nSeason: Spring\n\nHello');
    assert.equal(out.subject, 'Booking request: Not sure yet');
  });

  it('sends an empty message without a story, so the contact route asks for one', () => {
    assert.equal(composeBooking({ sitting: 'Sitting one', season: 'Winter' }).message, '');
  });

  it('ignores anything that is not text', () => {
    const out = composeBooking({ sitting: 42 as unknown as string, story: 'x' });
    assert.equal(out.message, 'x');
    assert.equal(out.subject, 'Booking request');
  });
});
