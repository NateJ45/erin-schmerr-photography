// scaffold-file: stories
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contentsLead, editorialRuns, gridSlot, mastheadSize, storyMasthead } from './magazine.ts';

const photo = (n: number) => ({ _key: `p${n}`, alt: `Photo ${n}` });

describe('contentsLead', () => {
  it('leads with the magazine a story ran in', () => {
    assert.equal(
      contentsLead({ publication: { magazine: ' Hollyway Magazine ' } }),
      'Hollyway Magazine',
    );
  });
  it('falls back to the decade the look comes from, then the decade it was made', () => {
    assert.equal(contentsLead({ title: "A '60s look", date: '2025-03-29' }), 'The 1960s');
    assert.equal(contentsLead({ title: 'Mint', date: '2023-11-25' }), 'The 2020s');
    assert.equal(contentsLead({ title: 'Mint' }), 'Portrait');
  });
});

describe('storyMasthead', () => {
  it('uses the magazine, else the house name', () => {
    assert.equal(storyMasthead({ publication: { magazine: 'PhotoVogue' } }, 'Tate'), 'PhotoVogue');
    assert.equal(storyMasthead({ publication: null }, 'Tate'), 'Tate');
  });
});

describe('mastheadSize', () => {
  it('caps short names and shrinks long ones with the viewport', () => {
    assert.equal(mastheadSize('Tate'), 'min(13rem, 37.1vw)');
    assert.match(mastheadSize('BleachFilm Magazine'), /^min\(13rem, 7\.81vw\)$/);
  });
});

describe('editorialRuns', () => {
  it('runs pair, single, bleed and numbers plates from 2', () => {
    const runs = editorialRuns([1, 2, 3, 4, 5, 6].map(photo));
    assert.deepEqual(
      runs.map((r) => r.kind),
      ['pair', 'single', 'bleed', 'pair'],
    );
    assert.deepEqual(
      runs.flatMap((r) => r.plates.map((p) => p.no)),
      [2, 3, 4, 5, 6, 7],
    );
  });
  it('turns a lone last pair into a single and alternates single sides', () => {
    const runs = editorialRuns([1, 2, 3, 4, 5].map(photo));
    assert.deepEqual(
      runs.map((r) => [r.kind, r.side ?? null]),
      [
        ['pair', null],
        ['single', 'end'],
        ['bleed', null],
        ['single', 'start'],
      ],
    );
  });
  it('is empty with no photos', () => {
    assert.deepEqual(editorialRuns([]), []);
  });
});

describe('gridSlot', () => {
  it('repeats every five', () => {
    assert.deepEqual([0, 1, 4, 5, 9, 10].map(gridSlot), [0, 1, 4, 0, 4, 0]);
  });
});
