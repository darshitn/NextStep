import { createClient } from '@supabase/supabase-js';
import { config, assertSupabaseConfig } from '../config.js';

let sharedAuthClient = null;

function getSharedAuthClient() {
  assertSupabaseConfig();
  if (!sharedAuthClient) {
    sharedAuthClient = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return sharedAuthClient;
}

/**
 * Verifies a Supabase access token and retrieves user metadata.
 * Throws 401 error on missing or invalid token.
 */
export async function verifyUser(token) {
  if (!token) {
    const err = new Error('Authorization bearer token is required.');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const supabase = getSharedAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    const err = new Error(error?.message || 'Invalid or expired session token.');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  return data.user;
}

/**
 * Creates a per-request Supabase client scoped to the caller's JWT.
 * Postgres RLS evaluates auth.uid() against this user's token.
 * No service-role key is ever used.
 */
export function createScopedClient(token) {
  assertSupabaseConfig();
  return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}
