/**
 * Simple in-memory rate limiter.
 * Tracks actions per key (user token + action type) with a sliding window.
 */

interface RateWindow {
  timestamps: number[];
}

const store = new Map<string, RateWindow>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of store) {
    window.timestamps = window.timestamps.filter((t) => now - t < 120_000);
    if (window.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

/**
 * Check if an action is rate-limited.
 * @param key - Unique identifier (e.g. "contribution:user-token-123")
 * @param maxActions - Maximum actions allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, retryAfterMs: number | null }
 */
export function checkRateLimit(
  key: string,
  maxActions: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number | null } {
  const now = Date.now();
  let window = store.get(key);

  if (!window) {
    window = { timestamps: [] };
    store.set(key, window);
  }

  // Remove expired timestamps
  window.timestamps = window.timestamps.filter((t) => now - t < windowMs);

  if (window.timestamps.length >= maxActions) {
    const oldest = window.timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  window.timestamps.push(now);
  return { allowed: true, retryAfterMs: null };
}
