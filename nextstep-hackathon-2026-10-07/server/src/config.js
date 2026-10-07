import { z } from 'zod';
import dotenv from 'dotenv';

// Node's test runner must never load local credentials or call paid providers.
const automatedTest = Boolean(process.env.NODE_TEST_CONTEXT);
if (!automatedTest) dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).optional()
});

const parsed = envSchema.safeParse(automatedTest ? { NODE_ENV: 'test' } : process.env);

if (!parsed.success) {
  const missingKeys = parsed.error.issues.map(i => i.path.join('.')).join(', ');
  throw new Error(`[Configuration Error] Invalid or missing environment variables: ${missingKeys}`);
}

export const config = parsed.data;

/**
 * Asserts that required live Supabase environment variables are present.
 * Throws a clean error without printing any secret or configuration values.
 */
export function assertSupabaseConfig() {
  const missing = [];
  if (!config.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!config.SUPABASE_PUBLISHABLE_KEY) missing.push('SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    throw new Error(`[Configuration Error] Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Returns array of missing AI configuration variable names without exposing any values.
 */
export function getMissingAiConfig() {
  const missing = [];
  if (!config.AI_API_KEY) missing.push('AI_API_KEY');
  if (!config.AI_MODEL) missing.push('AI_MODEL');
  return missing;
}

/**
 * Returns true if both AI_API_KEY and AI_MODEL are populated.
 */
export function isAiConfigured() {
  return Boolean(config.AI_API_KEY && config.AI_MODEL);
}
