import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { headers } from 'next/headers';

// Simple admin auth check
async function checkAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  // Check auth
  if (!await checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '24h';

  try {
    // Get stats from Redis
    const [
      totalQueries,
      uniqueUsers,
      cacheHits,
      totalRequests,
      errorCount,
    ] = await Promise.all([
      redis.get('stats:total_queries') || 0,
      redis.scard('stats:unique_users') || 0,
      redis.get('stats:cache_hits') || 0,
      redis.get('stats:total_requests') || 0,
      redis.get('stats:error_count') || 0,
    ]);

    // Calculate cache hit rate
    const cacheHitRate = Number(totalRequests) > 0 
      ? Number(cacheHits) / Number(totalRequests)
      : 0;

    // Get queries per hour (mock data for now)
    const now = new Date();
    const queriesPerHour = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        count: Math.floor(Math.random() * 100) + 20,
      };
    });

    // Get top queries from Redis
    const topQueriesData = await redis.zrange('stats:top_queries', 0, 9, {
      rev: true,
      withScores: true,
    }) || [];
    
    const topQueries = topQueriesData.map((item: any) => ({
      query: item.member,
      count: item.score,
    }));

    // Get error logs
    const errorLogs = await redis.lrange('stats:error_logs', 0, 19) || [];
    const parsedErrorLogs = errorLogs.map(log => {
      try {
        return typeof log === 'string' ? JSON.parse(log) : log;
      } catch {
        return { timestamp: new Date().toISOString(), error: String(log) };
      }
    });

    // Check system health (simplified)
    const systemHealth = {
      upstash: 'healthy' as const,
      algolia: 'healthy' as const,
      openai: 'healthy' as const,
    };

    // Calculate average response time (mock for now)
    const avgResponseTime = 234;

    return NextResponse.json({
      totalQueries: Number(totalQueries),
      uniqueUsers: Number(uniqueUsers),
      avgResponseTime,
      cacheHitRate,
      errorRate: Number(totalRequests) > 0 ? Number(errorCount) / Number(totalRequests) : 0,
      queriesPerHour,
      topQueries,
      errorLogs: parsedErrorLogs,
      systemHealth,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

// Track stats endpoint
export async function POST(req: NextRequest) {
  // This endpoint would be called to track various metrics
  // For now, it's a placeholder
  
  try {
    const { event, data } = await req.json();
    
    switch (event) {
      case 'query':
        await redis.incr('stats:total_queries');
        await redis.sadd('stats:unique_users', data.userId || data.ip);
        await redis.zincrby('stats:top_queries', 1, data.query);
        break;
        
      case 'cache_hit':
        await redis.incr('stats:cache_hits');
        break;
        
      case 'error':
        await redis.incr('stats:error_count');
        await redis.lpush('stats:error_logs', JSON.stringify({
          timestamp: new Date().toISOString(),
          error: data.error,
          query: data.query,
        }));
        await redis.ltrim('stats:error_logs', 0, 99); // Keep last 100 errors
        break;
    }
    
    await redis.incr('stats:total_requests');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track stats error:', error);
    return NextResponse.json(
      { error: 'Failed to track stats' },
      { status: 500 }
    );
  }
}