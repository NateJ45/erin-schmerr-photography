// Safe to edit by hand
// Pins the header's place block (src/lib/place-block.ts): service areas one per line, the
// state spelled out after the last, the town as a fallback, placeholders never shown.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placeBlockLines, stateName } from './place-block.ts';

describe('place block', () => {
  it('puts each service area on a line and the state after the last', () => {
    assert.deepEqual(
      placeBlockLines({ serviceAreas: ['Cincinnati', 'West Chester'], state: 'OH' }),
      ['Cincinnati', 'West Chester, Ohio'],
    );
  });
  it('falls back to the town when there are no service areas', () => {
    assert.deepEqual(placeBlockLines({ serviceAreas: [], city: 'West Chester', state: 'OH' }), [
      'West Chester, Ohio',
    ]);
  });
  it('draws nothing for the starter placeholders', () => {
    assert.deepEqual(placeBlockLines({ city: 'Your City', state: 'XX' }), []);
  });
  it('keeps a state already spelled out, and does not repeat it', () => {
    assert.equal(stateName('Ohio'), 'Ohio');
    assert.deepEqual(placeBlockLines({ serviceAreas: ['Dayton, Ohio'], state: 'OH' }), [
      'Dayton, Ohio',
    ]);
  });
  it('stops at three lines', () => {
    assert.equal(placeBlockLines({ serviceAreas: ['A', 'B', 'C', 'D'] }).length, 3);
  });
});
