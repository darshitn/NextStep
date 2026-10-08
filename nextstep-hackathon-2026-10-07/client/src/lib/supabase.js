/**
 * Supabase Auth Adapter for NextStep (Client)
 * Conforms to contracts/API-V1.md and START-HERE.md.
 * Uses native Fetch API against Supabase Auth endpoints so client build
 * remains lean and dependency-free.
 * Supports sign-in, sign-up (session and confirmation required flows),
 * and confirmation URL return handling.
 */

const STORAGE_KEY = 'nextstep_supabase_session';

function getEnvConfig() {
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : null;
  const procEnv = typeof process !== 'undefined' ? process.env : null;
  const automatedTest = Boolean(procEnv?.NODE_TEST_CONTEXT);
  const url = metaEnv?.VITE_SUPABASE_URL || procEnv?.VITE_SUPABASE_URL || (automatedTest ? 'https://supabase.local' : '');
  const key = metaEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || procEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || (automatedTest ? 'test-anon-key' : '');
  return { url, key };
}

let authListeners = [];
let refreshPromise = null;

export const supabaseAuth = {
  STORAGE_KEY,

  getSession() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // Check expiry (with 30s buffer)
      if (session.expires_at && (Date.now() / 1000) > session.expires_at - 30) {
        return session; // May be refreshed or discarded
      }
      return session;
    } catch {
      return null;
    }
  },

  getAccessToken() {
    const session = this.getSession();
    return session?.access_token || null;
  },

  async getValidAccessToken() {
    const session = this.getSession();
    if (!session?.access_token) return null;
    if (session.expires_at && Date.now() / 1000 < session.expires_at - 60) return session.access_token;
    if (!session.refresh_token) {
      const err = new Error('Your session has expired. Please sign in again.');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    // Dashboard requests share one token rotation rather than racing each other.
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const { url, key } = getEnvConfig();
      let response;
      try {
        response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: key },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
          signal: AbortSignal.timeout(10000)
        });
      } catch {
        const err = new Error('Could not renew your session. Check your connection and try again.');
        err.code = 'NETWORK_ERROR';
        err.status = 0;
        throw err;
      }
      const data = await response.json().catch(() => ({}));
      // A sign-out or account switch during the request must win over its response.
      if (this.getSession()?.refresh_token !== session.refresh_token) return this.getAccessToken();
      if (!response.ok || !data.access_token || !data.refresh_token) {
        const expired = [400, 401, 403].includes(response.status);
        if (expired && typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        const err = new Error(expired ? 'Your session has expired. Please sign in again.' : 'Session renewal is temporarily unavailable. Please try again.');
        err.code = expired ? 'UNAUTHORIZED' : 'AUTH_UNAVAILABLE';
        err.status = expired ? 401 : 503;
        throw err;
      }
      const updated = { ...session, ...data, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) };
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      authListeners.forEach(fn => fn('TOKEN_REFRESHED', updated));
      return updated.access_token;
    })();
    try { return await refreshPromise; } finally { refreshPromise = null; }
  },

  checkAuthFromUrl() {
    const win = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' && globalThis.window ? globalThis.window : null);
    if (!win || !win.location) return null;

    // 1. Check hash fragment (Implicit flow redirect: #access_token=...&refresh_token=...)
    if (win.location.hash && win.location.hash.includes('access_token=')) {
      try {
        const hash = win.location.hash.startsWith('#') ? win.location.hash.substring(1) : win.location.hash;
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const expires_in = Number(params.get('expires_in') || 3600);
        const type = params.get('type') || 'signup';

        if (access_token) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const session = {
            access_token,
            refresh_token,
            expires_in,
            expires_at: nowSeconds + expires_in,
            user: null
          };
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          }

          // Clean URL hash so tokens aren't visible in address bar
          if (win.history?.replaceState) {
            win.history.replaceState(null, (win.document?.title || ''), (win.location.pathname || '') + (win.location.search || ''));
          }
          authListeners.forEach(fn => fn('SIGNED_IN', session));
          return { session, confirmed: true, type };
        }
      } catch (err) {
        console.error('Failed to parse auth token from URL hash:', err);
      }
    }

    // 2. Check query params for error from confirmation flow
    if (win.location.search && (win.location.search.includes('error=') || win.location.search.includes('error_description='))) {
      try {
        const params = new URLSearchParams(win.location.search);
        const errorDescription = params.get('error_description') || params.get('error');
        if (errorDescription) {
          return { error: decodeURIComponent(errorDescription) };
        }
      } catch {}
    }

    return null;
  },

  async getCurrentUser() {
    // Check if returning from email confirmation
    this.checkAuthFromUrl();

    const accessToken = await this.getValidAccessToken();
    const session = this.getSession();
    if (!accessToken || !session) return null;

    // Return stored user immediately if valid
    if (session.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
      };
    }

    const { url, key } = getEnvConfig();
    if (!url || !key) return null;

    try {
      const res = await fetch(`${url}/auth/v1/user`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) {
        this.signOut();
        return null;
      }
      const user = await res.json();
      session.user = user;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0]
      };
    } catch {
      return null;
    }
  },

  async signIn(email, password) {
    // Client-side validations
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const err = new Error('Please enter a valid student email address.');
      err.status = 400;
      err.code = 'INVALID_EMAIL';
      throw err;
    }
    if (!password) {
      const err = new Error('Please enter your password.');
      err.status = 400;
      err.code = 'MISSING_PASSWORD';
      throw err;
    }

    const { url, key } = getEnvConfig();
    if (!url || !key) {
      const err = new Error('Supabase client environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.');
      err.status = 500;
      err.code = 'CONFIG_MISSING';
      throw err;
    }

    let response;
    try {
      response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key
        },
        body: JSON.stringify({ email: cleanEmail, password })
      });
    } catch (networkErr) {
      const err = new Error('Network error while connecting to Supabase Auth.');
      err.status = 0;
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data.error_description || data.msg || data.message || 'Invalid email or password.';
      const err = new Error(msg);
      err.status = response.status;
      if (response.status === 429 || msg.toLowerCase().includes('rate limit')) {
        err.code = 'RATE_LIMITED';
        err.message = 'Too many sign-in attempts. Please wait a moment before trying again.';
      } else {
        err.code = data.error || 'AUTH_ERROR';
      }
      throw err;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: nowSeconds + (data.expires_in || 3600),
      user: data.user
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    const userObj = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0]
    };

    authListeners.forEach(fn => fn('SIGNED_IN', session));

    return {
      user: userObj,
      token: data.access_token,
      session
    };
  },

  async signUp(email, password, { fullName } = {}) {
    // Client-side validations
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const err = new Error('Please enter a valid student email address.');
      err.status = 400;
      err.code = 'INVALID_EMAIL';
      throw err;
    }
    if (!password || password.length < 6) {
      const err = new Error('Password must be at least 6 characters.');
      err.status = 400;
      err.code = 'WEAK_PASSWORD';
      throw err;
    }

    const { url, key } = getEnvConfig();
    if (!url || !key) {
      const err = new Error('Supabase client environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.');
      err.status = 500;
      err.code = 'CONFIG_MISSING';
      throw err;
    }

    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';
    const endpoint = `${url}/auth/v1/signup${redirectUrl ? `?redirect_to=${encodeURIComponent(redirectUrl)}` : ''}`;

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          data: fullName ? { full_name: fullName.trim() } : {}
        })
      });
    } catch (networkErr) {
      const err = new Error('Network error while connecting to Supabase Auth.');
      err.status = 0;
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data.error_description || data.msg || data.message || 'Failed to create account.';
      const err = new Error(msg);
      err.status = response.status;
      if (data.code === 'over_email_send_rate_limit' || msg.toLowerCase().includes('email rate limit')) {
        err.code = 'EMAIL_RATE_LIMITED';
        err.message = 'Confirmation emails are temporarily limited for this project. Please try again later or contact the team.';
      } else if (response.status === 429 || msg.toLowerCase().includes('rate limit')) {
        err.code = 'RATE_LIMITED';
        err.message = 'Too many signup attempts. Please wait a moment and try again.';
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        err.code = 'USER_ALREADY_EXISTS';
        err.message = 'An account with this email already exists. Please sign in instead.';
      } else if (msg.toLowerCase().includes('at least 6 characters')) {
        err.code = 'WEAK_PASSWORD';
        err.message = 'Password must be at least 6 characters.';
      } else {
        err.code = data.error || 'SIGNUP_ERROR';
      }
      throw err;
    }

    // Outcome A: Session returned directly (Auto-confirm is enabled in Supabase)
    if (data.access_token && data.user) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: nowSeconds + (data.expires_in || 3600),
        user: data.user
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }

      const userObj = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || fullName || data.user.email?.split('@')[0]
      };

      authListeners.forEach(fn => fn('SIGNED_IN', session));

      return {
        user: userObj,
        token: data.access_token,
        session,
        confirmationRequired: false
      };
    }

    // Outcome B: Confirmation required, no session returned (Email verification active)
    // IMPORTANT: Do NOT store session, do NOT establish auth, do NOT emit SIGNED_IN
    const userObj = {
      id: data.id || data.user?.id,
      email: data.email || data.user?.email || cleanEmail,
      name: data.user_metadata?.full_name || data.user?.user_metadata?.full_name || fullName || cleanEmail.split('@')[0]
    };

    return {
      user: userObj,
      token: null,
      session: null,
      confirmationRequired: true
    };
  },

  async signOut() {
    const session = this.getSession();
    const { url, key } = getEnvConfig();

    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    authListeners.forEach(fn => fn('SIGNED_OUT', null));

    if (session?.access_token && url && key) {
      try {
        await fetch(`${url}/auth/v1/logout`, {
          method: 'POST',
          signal: AbortSignal.timeout(10000),
          headers: {
            apikey: key,
            Authorization: `Bearer ${session.access_token}`
          }
        });
      } catch {
        // Silently ignore logout network errors
      }
    }

    return { ok: true };
  },

  onAuthStateChange(callback) {
    authListeners.push(callback);
    return () => {
      authListeners = authListeners.filter(fn => fn !== callback);
    };
  }
};
