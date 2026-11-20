// Safe to edit by hand
// The jewel cadence (src/lib/jewel-cadence.ts): colour fields alternate with paper,
// never touch each other or a dark band, never open a page, and every jewel is a
// measured surface in src/lib/surfaces.ts.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  JEWEL_ORDER,
  assignJewels,
  jewelClass,
  jewelSurface,
  wantsJewel,
} from './jewel-cadence.ts';
import { SURFACE_BY_VALUE } from './surfaces.ts';

const b = (_type: string, extra: Record<string, unknown> = {}) => ({ _type, ...extra });

describe('jewel cadence', () => {
  it('every jewel is a measured surface with the class the band carries', () => {
    for (const j of JEWEL_ORDER) {
      const s = SURFACE_BY_VALUE[jewelSurface(j)];
      assert.ok(s, `no surface pair for ${j}`);
      assert.equal(s.className, jewelClass(j));
    }
  });

  it('alternates paper and colour, and never opens a page on colour', () => {
    const out = assignJewels([
      b('kindWords'),
      b('pressContents'),
      b('kindWords'),
      b('processFigures'),
      b('aboutStory'),
    ]);
    assert.equal(out[0], null);
    for (let i = 1; i < out.length; i++) {
      assert.ok(!(out[i] && out[i - 1]), `rows ${i - 1} and ${i} are both colour`);
    }
    assert.ok(out.filter(Boolean).length >= 2);
  });

  it('deals different jewels in turn', () => {
    const out = assignJewels([
      b('aboutOpening'),
      b('aboutStory'),
      b('aboutApproach'),
      b('processFigures'),
      b('aboutApproach'),
      b('kindWords'),
    ]).filter(Boolean);
    assert.equal(new Set(out).size, out.length);
  });

  it('never puts colour on the last row, which sits on the jewel footer', () => {
    const out = assignJewels([b('aboutOpening'), b('aboutApproach'), b('kindWords')]);
    assert.equal(out[2], null);
  });

  it('keeps colour away from a dark band', () => {
    const out = assignJewels([b('aboutOpening'), b('kindWords'), b('ctaBandSection')]);
    assert.equal(out[1], null);
  });

  it('a content block asks for colour only with the Jewel look', () => {
    assert.equal(wantsJewel(b('richTextSection')), false);
    assert.equal(wantsJewel(b('richTextSection', { look: 'jewel' })), true);
    assert.equal(wantsJewel(b('richTextSection', { look: 'feature' })), false);
  });
});
