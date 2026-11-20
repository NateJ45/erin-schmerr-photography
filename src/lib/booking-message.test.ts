// Safe to edit by hand
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { composeBooking } from './booking-message.ts';

describe('composeBooking', () => {
  it('writes the chosen kind and its own questions above the story', () => {
    const out = composeBooking({
      kind: 'family',
      childrenAges: '2 and 5',
      included: ['Parents', 'Children'],
      setting: 'On location',
      hang: 'Above the fireplace',
      timing: 'October',
      phone: '555 0100',
      story: 'A portrait for my mother.',
      name: 'Probe Person',
    });
    assert.equal(out.subject, 'Consultation request: Family and children (Probe Person)');
    assert.equal(
      out.message,
      [
        'For: Family and children',
        'Children’s ages: 2 and 5',
        'Who is included: Parents, Children',
        'Studio or location: On location',
        'Where the portraits will hang: Above the fireplace',
        'Rough timing or dates: October',
        'Phone: 555 0100',
        '',
        'A portrait for my mother.',
      ].join('\n'),
    );
  });

  it('leaves out the questions of the kinds not chosen', () => {
    const out = composeBooking({
      kind: 'creative',
      childrenAges: 'typed before switching',
      agency: 'New face',
      moodboard: 'https://example.net/board',
    });
    assert.equal(
      out.message,
      'For: Model or creative\nAgency status: New face\nMood board: https://example.net/board',
    );
  });

  it('sends an empty message with neither a kind nor a story', () => {
    assert.equal(composeBooking({ name: 'A' }).message, '');
  });

  it('ignores an unknown kind and anything that is not text', () => {
    const out = composeBooking({ kind: 'wedding', story: 'x', name: 42 as unknown as string });
    assert.equal(out.message, 'x');
    assert.equal(out.subject, 'Consultation request');
  });
});
