import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stateName } from './state-name.ts';

test('stateName: a code becomes the full name', () => {
  assert.equal(stateName('OH'), 'Ohio');
  assert.equal(stateName(' oh '), 'Ohio');
  assert.equal(stateName('NY'), 'New York');
});

test('stateName: a written-out name comes back as written', () => {
  assert.equal(stateName('ohio'), 'Ohio');
  assert.equal(stateName('Ohio'), 'Ohio');
});

test('stateName: unknown or empty gives nothing', () => {
  assert.equal(stateName('XX'), '');
  assert.equal(stateName(''), '');
  assert.equal(stateName(null), '');
  assert.equal(stateName(undefined), '');
});
