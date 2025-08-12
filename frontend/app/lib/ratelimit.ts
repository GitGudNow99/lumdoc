import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Different rate limiters for different tiers/purposes
export const rateLimiters = {
  // Standard API rate limit
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 req/min
    analytics: true,
  }),

  // Stricter limit for expensive operations
  expensive: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min
    analytics: true,
    prefix: 'expensive',
  }),

  // More generous limit for cached/cheap operations  
  cached: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
    analytics: true,
    prefix: 'cached',
  }),

  // Per-user rate limiting (for authenticated users)
  user: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min per user
    analytics: true,
    prefix: 'user',
  }),

  // Global rate limit (across all users)
  global: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(1000, '1 m'), // 1000 total req/min
    analytics: true,
    prefix: 'global',
  }),
};

// Helper to get identifier
export function getIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] ?? real ?? 'anonymous';
  
  // Could also use user ID if authenticated
  // const userId = getUser(request)?.id;
  // return userId ?? ip;
  
  return ip;
}

// Helper to format rate limit response
export function rateLimitResponse(message?: string) {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: message ?? 'Please slow down. Try again in a moment.',
      retryAfter: 60,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}