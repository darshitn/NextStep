import pg from 'pg';

let pool = null;

/**
 * Returns the singleton PostgreSQL connection pool.
 * Reuses one connection pool across the entire application lifecycle.
 * Reads DATABASE_URL strictly from process.env.DATABASE_URL.
 */
export function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in the backend environment.');
  }

  if (!pool) {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new pg.Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false }
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }

  return pool;
}

/**
 * Executes a parameterized query using the shared connection pool.
 */
export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}
