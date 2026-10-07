/**
 * Supabase Auth Adapter for NextStep (Client)
 * Conforms to contracts/API-V1.md and START-HERE.md.
 * Uses native Fetch API against Supabase Auth endpoints so client build
 * remains lean and dependency-free.
 */

const STORAGE_KEY = 'nextstep_supabase_session';

function getEnvConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return { url, key };
}

let authListeners = [];

export const supabaseAuth = {
  getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // Check expiry (with 30s buffer)
      if (session.expires_at && (Date.now() / 1000) > session.expires_at - 30) {
        // Session expired
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

  async getCurrentUser() {
    const session = this.getSession();
    if (!session?.access_token) return null;

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
        body: JSON.stringify({ email, password })
      });
    } catch (networkErr) {
      const err = new Error('Network error while connecting to Supabase Auth.');
      err.status = 0;
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data.error_description || data.msg || data.message || 'Invalid email or password.');
      err.status = response.status;
      err.code = data.error || 'AUTH_ERROR';
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

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

  async signOut() {
    const session = this.getSession();
    const { url, key } = getEnvConfig();

    if (session?.access_token && url && key) {
      try {
        await fetch(`${url}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${session.access_token}`
          }
        });
      } catch {
        // Silently ignore logout network errors
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    authListeners.forEach(fn => fn('SIGNED_OUT', null));
    return { ok: true };
  },

  onAuthStateChange(callback) {
    authListeners.push(callback);
    return () => {
      authListeners = authListeners.filter(fn => fn !== callback);
    };
  }
};
