// scaffold-file: testimonials
// Safe to edit by hand
// Pins the Kind words block's choice and order of quotes, and its placeholder rule.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPlaceholderQuote, kindWordsEntries, KIND_WORDS_MAX } from './kind-words.ts';

const doc = (id: string, extra: Record<string, unknown> = {}) => ({
  _id: id,
  quote: `Words from ${id}`,
  ...extra,
});

describe('kindWordsEntries', () => {
  it('keeps the picked order and skips a pick that no longer exists', () => {
    const docs = [doc('a'), doc('b'), doc('c')];
    const out = kindWordsEntries(docs, [{ _ref: 'c' }, { _ref: 'gone' }, { _ref: 'a' }]);
    assert.deepEqual(
      out.map((d) => d._id),
      ['c', 'a'],
    );
  });

  it('with no picks shows every testimonial, featured first, then newest', () => {
    const docs = [
      doc('old', { date: '2024-01-01' }),
      doc('new', { date: '2026-05-01' }),
      doc('star', { date: '2023-01-01', featured: true }),
    ];
    assert.deepEqual(
      kindWordsEntries(docs, []).map((d) => d._id),
      ['star', 'new', 'old'],
    );
  });

  it('drops documents with no words and caps the rows', () => {
    const docs = [
      doc('empty', { quote: '  ' }),
      ...Array.from({ length: 12 }, (_, i) => doc(`q${i}`)),
    ];
    const out = kindWordsEntries(docs, null);
    assert.equal(out.length, KIND_WORDS_MAX);
    assert.ok(!out.some((d) => d._id === 'empty'));
  });
});

describe('isPlaceholderQuote', () => {
  it('is a placeholder until Confirmed is ticked', () => {
    assert.equal(isPlaceholderQuote({ quote: 'Real words', confirmed: false }), true);
    assert.equal(isPlaceholderQuote({ quote: 'Real words' }), true);
    assert.equal(isPlaceholderQuote({ quote: 'Real words', confirmed: true }), false);
  });

  it('stays a placeholder while the words are still the seeded stand-in', () => {
    assert.equal(
      isPlaceholderQuote({ quote: 'Replace this with a real quote.', confirmed: true }),
      true,
    );
  });
});
