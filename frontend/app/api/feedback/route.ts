import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const FeedbackSchema = z.object({
  type: z.enum(['helpful', 'not-helpful']),
  messageId: z.string(),
  query: z.string(),
  answer: z.string(),
  citationCount: z.number(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedback = FeedbackSchema.parse(body);

    // Store in Redis for analytics
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      
      // Store feedback
      const key = `feedback:${feedback.type}:${Date.now()}`;
      await redis.set(key, feedback, { ex: 30 * 24 * 60 * 60 }); // 30 days
      
      // Increment counters
      await redis.hincrby('feedback:stats', feedback.type, 1);
      
      // Track problematic queries
      if (feedback.type === 'not-helpful') {
        await redis.zadd('feedback:problematic', {
          score: Date.now(),
          member: JSON.stringify({
            query: feedback.query,
            messageId: feedback.messageId,
          }),
        });
      }
    }

    // Log to analytics
    if (process.env.NODE_ENV === 'production') {
      console.log('Feedback received:', {
        type: feedback.type,
        query: feedback.query.slice(0, 100),
        citationCount: feedback.citationCount,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// Get feedback stats
export async function GET(request: NextRequest) {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      
      const stats = await redis.hgetall('feedback:stats');
      const problematic = await redis.zrange('feedback:problematic', 0, 10, {
        rev: true,
      });
      
      return NextResponse.json({
        stats: stats || { helpful: 0, 'not-helpful': 0 },
        problematicQueries: problematic.slice(0, 5),
      });
    }
    
    return NextResponse.json({
      stats: { helpful: 0, 'not-helpful': 0 },
      problematicQueries: [],
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}