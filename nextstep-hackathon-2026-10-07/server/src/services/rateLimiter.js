/**
 * In-memory sliding-window rate limiter for sensitive endpoints (e.g. AI guidance).
 * Tracks request timestamps per user ID or client identifier.
 */

const rateLimitMap = new Map(); // key -> Array<number> (timestamps in ms)

/**
 * Checks whether a given key is allowed to perform an action.
 *
 * @param {string} key - Unique identifier (e.g. userId)
 * @param {object} options
 * @param {number} options.windowMs - Sliding window duration in milliseconds (default: 60s)
 * @param {number} options.maxRequests - Max allowed requests within the window (default: 5)
 * @returns {{ allowed: boolean, retryAfterSeconds?: number, currentCount?: number }}
 */
export function checkRateLimit(key, { windowMs = 60000, maxRequests = 5 } = {}) {
  if (!key) {
    return { allowed: true };
  }

  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  // Filter timestamps within window
  const recent = timestamps.filter(t => now - t < windowMs);

  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    const retryAfterMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    // Update map with cleaned timestamps
    rateLimitMap.set(key, recent);

    return {
      allowed: false,
      retryAfterSeconds,
      currentCount: recent.length
    };
  }

  recent.push(now);
  rateLimitMap.set(key, recent);

  return {
    allowed: true,
    currentCount: recent.length
  };
}

/**
 * Clears in-memory rate limit records (useful for test isolation).
 */
export function clearRateLimits() {
  rateLimitMap.clear();
}
