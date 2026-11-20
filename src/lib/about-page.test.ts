// scaffold-file: about
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { emphasisRuns, figureLabel, headingEnds, plainHeadline } from './about-page.ts';

describe('emphasisRuns', () => {
  it('sets a word between underscores in italic', () => {
    assert.deepEqual(emphasisRuns('afraid of _forgetting_ it all.'), [
      { text: 'afraid of ', italic: false },
      { text: 'forgetting', italic: true },
      { text: ' it all.', italic: false },
    ]);
  });
  it('keeps a lone underscore as written', () => {
    assert.deepEqual(emphasisRuns('a_b'), [{ text: 'a_b', italic: false }]);
  });
  it('is empty for nothing', () => {
    assert.deepEqual(emphasisRuns(undefined), []);
  });
  it('reads as plain words without the marks', () => {
    assert.equal(plainHeadline('the _whole_ thing'), 'the whole thing');
  });
});

describe('headingEnds', () => {
  it('puts the first word left and the rest right', () => {
    assert.deepEqual(headingEnds('Behind the scenes'), ['Behind', 'the scenes']);
  });
  it('keeps one word on the left', () => {
    assert.deepEqual(headingEnds(' Process '), ['Process', '']);
  });
});

describe('figureLabel', () => {
  it('numbers from Fig 01.', () => {
    assert.equal(figureLabel(0), 'Fig 01.');
    assert.equal(figureLabel(4), 'Fig 05.');
  });
});
