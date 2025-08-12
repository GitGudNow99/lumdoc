import { Redis } from '@upstash/redis';

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCached<T>(
  key: string,
  ttl: number = 900 // 15 minutes default
): Promise<T | null> {
  try {
    const cached = await redis.get<T>(key);
    return cached;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = 900
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function getCacheKey(params: Record<string, any>): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {} as Record<string, any>);
  
  const paramString = JSON.stringify(sortedParams);
  const encoder = new TextEncoder();
  const data = encoder.encode(paramString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `search:${hashHex.slice(0, 16)}`;
}