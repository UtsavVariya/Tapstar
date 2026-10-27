// Simple in-memory rate limiter
// For production, use Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 attempts per 15 min
  apiReviews: { maxAttempts: 10, windowMs: 60 * 1000 },       // 10 per minute
  adminLogin: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },   // 5 per 15 min
} as const;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remainingAttempts: number; resetInMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetInMs: config.windowMs };
  }

  if (entry.count >= config.maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetInMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remainingAttempts: config.maxAttempts - entry.count, resetInMs: entry.resetAt - now };
}

export function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
