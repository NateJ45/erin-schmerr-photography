// scaffold-file: sessions
// The Sessions page helpers (src/lib/sessions.ts).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  figure,
  rowIncludes,
  roman,
  scaleSizes,
  showInvestment,
  signatureIndex,
  sittingRows,
  splitTurn,
} from './sessions.ts';

describe('phase 2 helpers', () => {
  it('treats an empty or blank figure as empty, so its row hides', () => {
    assert.equal(figure(''), '');
    assert.equal(figure('   '), '');
    assert.equal(figure(undefined), '');
    assert.equal(figure(' Typed '), 'Typed');
  });
  it('draws the wall sizes to one scale, the largest side as 1', () => {
    const [mini, statement, nameOnly] = scaleSizes([
      { name: 'Mini', width: 8, height: 10 },
      { name: 'Statement', width: 40, height: 60 },
      { name: 'Custom' },
      { name: '' },
    ]);
    assert.equal(statement.h, 1);
    assert.equal(statement.w, 40 / 60);
    assert.equal(mini.w, 8 / 60);
    assert.equal(mini.drawn, true);
    assert.equal(nameOnly.drawn, false);
    assert.equal(scaleSizes(null).length, 0);
  });
  it('finds the signature step, or -1', () => {
    assert.equal(signatureIndex([{}, { signature: true }, { signature: true }]), 1);
    assert.equal(signatureIndex([{ signature: false }]), -1);
    assert.equal(signatureIndex(undefined), -1);
  });
});

describe('splitTurn', () => {
  it('splits the line around the italic words', () => {
    assert.deepEqual(splitTurn('A portrait, made slowly.', 'made slowly'), [
      'A portrait, ',
      'made slowly',
      '.',
    ]);
  });
  it('is null when the words are missing or not in the line', () => {
    assert.equal(splitTurn('A portrait.', ''), null);
    assert.equal(splitTurn('A portrait.', undefined), null);
    assert.equal(splitTurn('A portrait.', 'slowly'), null);
    assert.equal(splitTurn('', 'slowly'), null);
  });
});

describe('the sittings table', () => {
  it('an unset tick counts as included; only an explicit untick greys a row', () => {
    const row = { label: 'Styling', inFirst: true, inSecond: false };
    assert.equal(rowIncludes(row, 0), true);
    assert.equal(rowIncludes(row, 1), false);
    assert.equal(rowIncludes(row, 2), true);
  });
  it('drops rows without a label', () => {
    assert.equal(sittingRows([{ label: 'Styling' }, { label: '  ' }, {}]).length, 1);
    assert.deepEqual(sittingRows(null), []);
  });
  it('hides the investment row while every sitting leaves it empty', () => {
    assert.equal(showInvestment([{}, { investmentFrom: '' }, { investmentFrom: '   ' }]), false);
    assert.equal(showInvestment(null), false);
    assert.equal(showInvestment([{}, { investmentFrom: 'typed' }]), true);
  });
  it('numbers sittings in roman', () => {
    assert.equal(roman(1), 'I');
    assert.equal(roman(3), 'III');
  });
});
