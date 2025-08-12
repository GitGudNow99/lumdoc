import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter instance
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute per IP
  analytics: true, // Track analytics in Upstash console
});

// Define which routes to protect
const protectedRoutes = [
  '/api/search',
  '/api/answer', 
  '/api/chat',
];

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  const path = request.nextUrl.pathname;
  
  if (!protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Get IP address
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'anonymous';
  
  try {
    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${ip}`
    );

    // Create response
    const response = success 
      ? NextResponse.next()
      : NextResponse.json(
          { 
            error: 'Too Many Requests',
            message: 'Please slow down. Try again in a few seconds.',
          },
          { status: 429 }
        );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return response;
  } catch (error) {
    // If rate limiting fails, allow request but log error
    console.error('Rate limiting error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};