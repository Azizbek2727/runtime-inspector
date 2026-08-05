import assert from 'node:assert/strict';
import test from 'node:test';

import { canonicalize, stableStringify } from '../src/stable-json.ts';

test('canonicalize sorts object keys recursively', () => {
  const value = {
    zebra: 1,
    alpha: {
      delta: 4,
      beta: 2,
    },
    list: [{ y: 2, x: 1 }],
  };

  assert.deepEqual(canonicalize(value), {
    alpha: {
      beta: 2,
      delta: 4,
    },
    list: [{ x: 1, y: 2 }],
    zebra: 1,
  });
});

test('stableStringify produces deterministic output and a final newline', () => {
  const first = stableStringify({ second: 2, first: 1 });
  const second = stableStringify({ first: 1, second: 2 });

  assert.equal(first, second);
  assert.equal(
    first,
    `{
  "first": 1,
  "second": 2
}\n`,
  );
});

test('canonicalize converts non-finite values to JSON null', () => {
  assert.deepEqual(canonicalize([Number.NaN, Number.POSITIVE_INFINITY]), [
    null,
    null,
  ]);
});
