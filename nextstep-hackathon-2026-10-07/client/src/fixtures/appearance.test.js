import test from 'node:test';
import assert from 'node:assert/strict';
import { STYLES, getSavedStyle, applyStyle } from '../services/appearanceEngine.js';

test('A01: STYLES contains the 3 specified styles with Frosted Sage as default', () => {
  assert.equal(STYLES.length, 3);
  assert.deepEqual(STYLES.map(s => s.id), ['frosted-sage', 'study-journal', 'quiet-focus']);
});

test('A02: getSavedStyle returns frosted-sage when storage is empty or undefined', () => {
  const original = global.localStorage;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  try {
    assert.equal(getSavedStyle(), 'frosted-sage');
  } finally {
    global.localStorage = original;
  }
});

test('A03: getSavedStyle safely ignores invalid stored style names', () => {
  const original = global.localStorage;
  global.localStorage = {
    getItem: (key) => key === 'nextstep-style' ? 'cyberpunk-neon' : null,
    setItem: () => {}
  };
  try {
    assert.equal(getSavedStyle(), 'frosted-sage');
  } finally {
    global.localStorage = original;
  }
});

test('A04: applyStyle validates and saves valid styles to storage', () => {
  let stored = null;
  const original = global.localStorage;
  global.localStorage = {
    getItem: () => stored,
    setItem: (k, v) => { stored = v; }
  };
  try {
    assert.equal(applyStyle('study-journal'), 'study-journal');
    assert.equal(stored, 'study-journal');

    assert.equal(applyStyle('quiet-focus'), 'quiet-focus');
    assert.equal(stored, 'quiet-focus');

    // Invalid style falls back
    assert.equal(applyStyle('invalid-style'), 'frosted-sage');
    assert.equal(stored, 'frosted-sage');
  } finally {
    global.localStorage = original;
  }
});
