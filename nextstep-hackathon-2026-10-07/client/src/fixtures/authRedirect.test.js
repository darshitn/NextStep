import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfirmationRedirect } from '../lib/authRedirect.js';
import { supabaseAuth } from '../lib/supabase.js';

test('confirmation redirects use public NextStep for loopback and non-browser signup', () => {
  for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://[::1]:5173', '', 'null']) {
    assert.equal(resolveConfirmationRedirect(origin), 'https://next-step-six-theta.vercel.app/login');
  }
});

test('hosted signup stays on its HTTPS deployment; development overrides must be explicit', () => {
  assert.equal(resolveConfirmationRedirect('https://next-step-six-theta.vercel.app'), 'https://next-step-six-theta.vercel.app/login');
  assert.equal(resolveConfirmationRedirect('https://preview.example.test'), 'https://preview.example.test/login');
  assert.equal(resolveConfirmationRedirect('http://localhost:5173', 'http://127.0.0.1:5173/login'), 'http://127.0.0.1:5173/login');
  for (const value of ['javascript:alert(1)', '/login', 'http://public.example/login', 'https://name:pass@example.test/login', 'https://example.test/#token']) {
    assert.throws(() => resolveConfirmationRedirect('', value), (error) => error.code === 'CONFIG_INVALID');
  }
});

test('the actual signup request carries the configured public redirect and creates no confirmation session', async () => {
  const previous = { fetch: globalThis.fetch, window: globalThis.window, redirect: process.env.VITE_AUTH_REDIRECT_URL };
  let calledUrl;
  process.env.VITE_AUTH_REDIRECT_URL = 'https://next-step-six-theta.vercel.app/login';
  globalThis.window = { location: { origin: 'http://127.0.0.1:5173' } };
  globalThis.fetch = async (url) => {
    calledUrl = new URL(url);
    return { ok: true, json: async () => ({ id: 'synthetic-unconfirmed', email: 'student@example.test' }) };
  };
  try {
    const result = await supabaseAuth.signUp('student@example.test', 'synthetic-only');
    assert.equal(calledUrl.searchParams.get('redirect_to'), 'https://next-step-six-theta.vercel.app/login');
    assert.equal(result.confirmationRequired, true);
    assert.equal(result.session, null);
    assert.equal(result.confirmationRedirectUrl, calledUrl.searchParams.get('redirect_to'));
  } finally {
    globalThis.fetch = previous.fetch;
    globalThis.window = previous.window;
    if (previous.redirect === undefined) delete process.env.VITE_AUTH_REDIRECT_URL;
    else process.env.VITE_AUTH_REDIRECT_URL = previous.redirect;
  }
});

test('expired confirmation errors surface from fragments and queries without double decoding', () => {
  const previous = globalThis.window;
  try {
    for (const part of ['hash', 'search']) {
      globalThis.window = { location: { [part]: `${part === 'hash' ? '#' : '?'}error=access_denied&error_description=Link+expired+%28100%25%29` } };
      assert.deepEqual(supabaseAuth.checkAuthFromUrl(), { error: 'Link expired (100%)' });
    }
  } finally { globalThis.window = previous; }
});
