import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseAuth } from '../lib/supabase.js';

test('AUTH-01: Client-side validation rejects invalid email on signup', async () => {
  await assert.rejects(
    () => supabaseAuth.signUp('not-an-email', 'validpass123'),
    (err) => {
      assert.equal(err.code, 'INVALID_EMAIL');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('AUTH-02: Client-side validation rejects short password (< 6 chars) on signup', async () => {
  await assert.rejects(
    () => supabaseAuth.signUp('student@college.edu', '12345'),
    (err) => {
      assert.equal(err.code, 'WEAK_PASSWORD');
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('AUTH-03: parseAuthFromUrl extracts access_token from URL hash and creates session', () => {
  const originalLocation = global.window?.location;
  const originalHistory = global.window?.history;
  const originalStorage = global.localStorage;

  let storedSession = null;
  global.localStorage = {
    getItem: (k) => k === supabaseAuth.STORAGE_KEY ? storedSession : null,
    setItem: (k, v) => { if (k === supabaseAuth.STORAGE_KEY) storedSession = v; },
    removeItem: (k) => { if (k === supabaseAuth.STORAGE_KEY) storedSession = null; }
  };

  let replacedState = null;
  global.window = {
    location: {
      hash: '#access_token=mock-confirmed-token&refresh_token=mock-refresh&expires_in=3600&type=signup',
      pathname: '/login',
      search: ''
    },
    history: {
      replaceState: (state, title, url) => { replacedState = url; }
    }
  };

  try {
    const res = supabaseAuth.checkAuthFromUrl();
    assert.ok(res, 'Should return confirmation auth result');
    assert.equal(res.confirmed, true);
    assert.equal(res.session.access_token, 'mock-confirmed-token');
    assert.equal(replacedState, '/login', 'Should clean access_token from browser history URL');
    assert.ok(storedSession, 'Should persist confirmed session to storage');
  } finally {
    global.localStorage = originalStorage;
    if (originalLocation) global.window.location = originalLocation;
    if (originalHistory) global.window.history = originalHistory;
  }
});

test('AUTH-04: Confirmation required response does NOT establish session in storage', async () => {
  const originalFetch = global.fetch;
  const originalStorage = global.localStorage;

  let storedSession = null;
  global.localStorage = {
    getItem: (k) => k === supabaseAuth.STORAGE_KEY ? storedSession : null,
    setItem: (k, v) => { if (k === supabaseAuth.STORAGE_KEY) storedSession = v; },
    removeItem: (k) => { if (k === supabaseAuth.STORAGE_KEY) storedSession = null; }
  };

  // Mock Supabase returning user with confirmation sent (no access_token)
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      id: 'usr-unconfirmed-123',
      email: 'newjudge@hackathon.org',
      confirmation_sent_at: '2026-10-07T12:00:00Z',
      user_metadata: { full_name: 'Judge Persona' }
    })
  });

  try {
    const result = await supabaseAuth.signUp('newjudge@hackathon.org', 'judgeSecurePass123', {
      fullName: 'Judge Persona'
    });

    assert.equal(result.confirmationRequired, true, 'confirmationRequired must be true');
    assert.equal(result.session, null, 'session must be null when confirmation is required');
    assert.equal(result.token, null, 'token must be null');
    assert.equal(storedSession, null, 'Must NOT persist unconfirmed session to storage');
  } finally {
    global.fetch = originalFetch;
    global.localStorage = originalStorage;
  }
});

test('AUTH-05: Session returned response establishes session in storage', async () => {
  const originalFetch = global.fetch;
  const originalStorage = global.localStorage;

  let storedSession = null;
  global.localStorage = {
    getItem: (k) => k === supabaseAuth.STORAGE_KEY ? storedSession : null,
    setItem: (k, v) => { if (k === supabaseAuth.STORAGE_KEY) storedSession = v; },
    removeItem: (k) => { if (k === supabaseAuth.STORAGE_KEY) storedSession = null; }
  };

  // Mock Supabase returning full session directly (auto-confirm enabled)
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      access_token: 'mock-session-jwt-456',
      refresh_token: 'mock-refresh-456',
      expires_in: 3600,
      user: {
        id: 'usr-autoconfirmed-456',
        email: 'confirmed@college.edu',
        user_metadata: { full_name: 'Fast Student' }
      }
    })
  });

  try {
    const result = await supabaseAuth.signUp('confirmed@college.edu', 'studentPass123', {
      fullName: 'Fast Student'
    });

    assert.equal(result.confirmationRequired, false, 'confirmationRequired must be false');
    assert.equal(result.token, 'mock-session-jwt-456');
    assert.ok(result.session, 'session must exist');
    assert.ok(storedSession, 'Must persist session to storage');
    assert.match(storedSession, /mock-session-jwt-456/);
  } finally {
    global.fetch = originalFetch;
    global.localStorage = originalStorage;
  }
});

test('AUTH-06: Existing user error from Supabase is cleanly normalized', async () => {
  const originalFetch = global.fetch;

  // Mock Supabase returning already registered error
  global.fetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      error_description: 'User already registered',
      error: 'validation_failed'
    })
  });

  try {
    await assert.rejects(
      () => supabaseAuth.signUp('existing@college.edu', 'secretPassword123'),
      (err) => {
        assert.equal(err.code, 'USER_ALREADY_EXISTS');
        assert.equal(err.message, 'An account with this email already exists. Please sign in instead.');
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
