import { getPool } from './db.js';

async function migrate() {
  console.log('Initiating database migration for "notes" table...');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not configured in backend environment.');
    console.error('Configure DATABASE_URL in Replit Secrets or local environment variables before executing migrations.');
    process.exit(1);
  }

  let pool;
  try {
    pool = getPool();
  } catch (initErr) {
    console.error('Error initializing database connection pool:', initErr.message);
    process.exit(1);
  }

  const migrationSql = `
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(migrationSql);
    console.log('Migration successful: table "notes" is ready.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration execution failed:', err.message);
    try {
      await pool.end();
    } catch (_) {}
    process.exit(1);
  }
}

migrate();
