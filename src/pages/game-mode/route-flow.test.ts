import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveGameModeSurface } from './route-flow.ts';

test('keeps sequence-memory on participant entry while session is loading', () => {
  assert.equal(resolveGameModeSurface('SEQUENCE_MEMORY', false), 'sequence-flow');
});

test('keeps sequence-memory on participant entry after session loads', () => {
  assert.equal(resolveGameModeSurface('SEQUENCE_MEMORY', true), 'sequence-flow');
});

test('uses generic surface only for other valid modes', () => {
  assert.equal(resolveGameModeSurface('MOTOR_GRIP', false), 'generic');
  assert.equal(resolveGameModeSurface(null, false), 'redirect');
});
