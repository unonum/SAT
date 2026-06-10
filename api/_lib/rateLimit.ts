/**
 * In-memory sliding-window rate limiter.
 * Works per Vercel warm instance — good enough to block accidental hammering
 * and cost-spike attacks. Not a substitute for edge-level rate limiting.
 */

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

/**
 * Returns true if the key is within the allowed limit.
 * @param key        e.g. email or IP
 * @param maxCalls   max calls allowed in the window
 * @param windowMs   rolling window in ms (default 60 000 = 1 min)
 */
export function checkRateLimit(key: string, maxCalls: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxCalls) return false;

  entry.timestamps.push(now);
  return true;
}

/** Prune stale entries (call occasionally to avoid memory leak in long-lived instances). */
export function pruneRateLimitStore(windowMs = 60_000): void {
  const cutoff = Date.now() - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}
