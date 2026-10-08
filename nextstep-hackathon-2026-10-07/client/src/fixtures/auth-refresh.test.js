import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseAuth } from '../lib/supabase.js';

function setup(t) {
  const storage = globalThis.localStorage, fetch = globalThis.fetch;
  let value = JSON.stringify({ access_token: 'expired-synthetic-token', refresh_token: 'synthetic-refresh', expires_at: 1, user: { id: 'synthetic', email: 'synthetic@example.test' } });
  globalThis.localStorage = { getItem: () => value, setItem: (_, v) => { value = v; }, removeItem: () => { value = null; } };
  t.after(() => { globalThis.localStorage = storage; globalThis.fetch = fetch; });
  return { read: () => value, clear: () => { value = null; } };
}
const renewed = { access_token: 'new-synthetic-token', refresh_token: 'rotated-synthetic-refresh', expires_in: 3600 };
test('expired cached user refreshes once for simultaneous API requests and persists rotation', async t => {
  const store = setup(t); let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++; assert.match(url, /grant_type=refresh_token/);
    assert.equal(JSON.parse(options.body).refresh_token, 'synthetic-refresh');
    return { ok: true, json: async () => renewed };
  };
  const [user, token] = await Promise.all([supabaseAuth.getCurrentUser(), supabaseAuth.getValidAccessToken()]);
  assert.equal(calls, 1); assert.equal(user.id, 'synthetic'); assert.equal(token, renewed.access_token);
  assert.equal(JSON.parse(store.read()).refresh_token, renewed.refresh_token);
  assert.equal(await supabaseAuth.getValidAccessToken(), renewed.access_token); assert.equal(calls, 1);
});
test('temporary refresh outage keeps the stored session for an explicit retry', async t => {
  const store = setup(t); const before = store.read();
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(supabaseAuth.getValidAccessToken(), e => e.code === 'AUTH_UNAVAILABLE');
  assert.equal(store.read(), before);
});
test('invalid refresh token requires sign-in and clears expired credentials', async t => {
  const store = setup(t);
  globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({}) });
  await assert.rejects(supabaseAuth.getValidAccessToken(), e => e.code === 'UNAUTHORIZED' && e.status === 401);
  assert.equal(store.read(), null);
});
test('refresh completing after sign-out cannot restore the session', async t => {
  const store = setup(t); let resolve;
  globalThis.fetch = () => new Promise(r => { resolve = r; });
  const pending = supabaseAuth.getValidAccessToken(); store.clear();
  resolve({ ok: true, json: async () => renewed });
  assert.equal(await pending, null); assert.equal(store.read(), null);
});
test('network failure during refresh preserves session and can be retried', async t => {
  const store = setup(t); const before = store.read();
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(supabaseAuth.getValidAccessToken(), e => e.code === 'NETWORK_ERROR');
  assert.equal(store.read(), before);
  globalThis.fetch = async () => ({ ok: true, json: async () => renewed });
  assert.equal(await supabaseAuth.getValidAccessToken(), renewed.access_token);
});
