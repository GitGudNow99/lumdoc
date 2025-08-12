#!/usr/bin/env node
import { redis } from '../frontend/lib/redis';

interface CostThresholds {
  daily: number;
  weekly: number;
  monthly: number;
}

interface ServiceCosts {
  openai: { prompt: number; completion: number };
  cohere: { rerank: number };
  upstash: { vector: number; redis: number };
  algolia: { search: number };
  vercel: { function: number; bandwidth: number };
}

// Cost per 1K tokens/operations
const UNIT_COSTS: ServiceCosts = {
  openai: {
    prompt: 0.0015,  // GPT-3.5 input
    completion: 0.002, // GPT-3.5 output
  },
  cohere: {
    rerank: 0.001, // Per 1K docs reranked
  },
  upstash: {
    vector: 0.0001, // Per query
    redis: 0.00002, // Per command
  },
  algolia: {
    search: 0.0005, // Per 1K searches
  },
  vercel: {
    function: 0.0000002, // Per GB-second
    bandwidth: 0.15, // Per GB
  },
};

const THRESHOLDS: CostThresholds = {
  daily: parseFloat(process.env.COST_THRESHOLD_DAILY || '10'),
  weekly: parseFloat(process.env.COST_THRESHOLD_WEEKLY || '50'),
  monthly: parseFloat(process.env.COST_THRESHOLD_MONTHLY || '150'),
};

class CostMonitor {
  async trackUsage(service: string, metric: string, amount: number) {
    const key = `costs:${service}:${metric}`;
    const today = new Date().toISOString().split('T')[0];
    
    // Increment counters
    await redis.hincrby(`${key}:${today}`, 'count', amount);
    await redis.expire(`${key}:${today}`, 60 * 60 * 24 * 31); // 31 days TTL
  }

  async calculateCosts(period: 'daily' | 'weekly' | 'monthly'): Promise<number> {
    const now = new Date();
    const dates: string[] = [];
    
    // Generate date range
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    let totalCost = 0;
    
    // Calculate OpenAI costs
    for (const date of dates) {
      const promptTokens = await redis.hget(`costs:openai:prompt:${date}`, 'count') || 0;
      const completionTokens = await redis.hget(`costs:openai:completion:${date}`, 'count') || 0;
      
      totalCost += (Number(promptTokens) / 1000) * UNIT_COSTS.openai.prompt;
      totalCost += (Number(completionTokens) / 1000) * UNIT_COSTS.openai.completion;
    }
    
    // Calculate Cohere costs
    for (const date of dates) {
      const rerankCount = await redis.hget(`costs:cohere:rerank:${date}`, 'count') || 0;
      totalCost += (Number(rerankCount) / 1000) * UNIT_COSTS.cohere.rerank;
    }
    
    // Calculate Upstash costs
    for (const date of dates) {
      const vectorQueries = await redis.hget(`costs:upstash:vector:${date}`, 'count') || 0;
      const redisOps = await redis.hget(`costs:upstash:redis:${date}`, 'count') || 0;
      
      totalCost += Number(vectorQueries) * UNIT_COSTS.upstash.vector;
      totalCost += Number(redisOps) * UNIT_COSTS.upstash.redis;
    }
    
    // Calculate Algolia costs
    for (const date of dates) {
      const searches = await redis.hget(`costs:algolia:search:${date}`, 'count') || 0;
      totalCost += (Number(searches) / 1000) * UNIT_COSTS.algolia.search;
    }
    
    // Calculate Vercel costs (estimated)
    for (const date of dates) {
      const functionTime = await redis.hget(`costs:vercel:function:${date}`, 'count') || 0;
      const bandwidth = await redis.hget(`costs:vercel:bandwidth:${date}`, 'count') || 0;
      
      totalCost += Number(functionTime) * UNIT_COSTS.vercel.function;
      totalCost += (Number(bandwidth) / 1024 / 1024 / 1024) * UNIT_COSTS.vercel.bandwidth;
    }
    
    return totalCost;
  }

  async checkThresholds(): Promise<{ period: string; cost: number; threshold: number; alert: boolean }[]> {
    const results = [];
    
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const cost = await this.calculateCosts(period);
      const threshold = THRESHOLDS[period];
      const alert = cost > threshold * 0.8; // Alert at 80% of threshold
      
      results.push({
        period,
        cost: Math.round(cost * 100) / 100,
        threshold,
        alert,
      });
      
      if (alert) {
        await this.sendAlert(period, cost, threshold);
      }
    }
    
    return results;
  }

  async sendAlert(period: string, cost: number, threshold: number) {
    const percentage = ((cost / threshold) * 100).toFixed(1);
    const message = `⚠️ Cost Alert: ${period} spending at ${percentage}% of threshold ($${cost.toFixed(2)} / $${threshold})`;
    
    console.error(message);
    
    // Send to monitoring service
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: message,
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Period:* ${period}` },
                { type: 'mrkdwn', text: `*Current Cost:* $${cost.toFixed(2)}` },
                { type: 'mrkdwn', text: `*Threshold:* $${threshold}` },
                { type: 'mrkdwn', text: `*Usage:* ${percentage}%` },
              ],
            },
          ],
        }),
      });
    }
    
    // Log to Redis for admin dashboard
    await redis.lpush('costs:alerts', JSON.stringify({
      timestamp: new Date().toISOString(),
      period,
      cost,
      threshold,
      percentage,
    }));
    await redis.ltrim('costs:alerts', 0, 99); // Keep last 100 alerts
  }

  async generateReport(): Promise<void> {
    console.log('💰 Cost Monitoring Report');
    console.log('=' .repeat(50));
    
    const results = await this.checkThresholds();
    
    for (const result of results) {
      const emoji = result.alert ? '🚨' : '✅';
      const percentage = ((result.cost / result.threshold) * 100).toFixed(1);
      
      console.log(`${emoji} ${result.period.toUpperCase()}: $${result.cost} / $${result.threshold} (${percentage}%)`);
    }
    
    console.log('\n📊 Cost Breakdown by Service:');
    console.log('-'.repeat(50));
    
    // Get today's usage for breakdown
    const today = new Date().toISOString().split('T')[0];
    
    const breakdown = {
      'OpenAI': await this.getServiceCostToday('openai'),
      'Cohere': await this.getServiceCostToday('cohere'),
      'Upstash': await this.getServiceCostToday('upstash'),
      'Algolia': await this.getServiceCostToday('algolia'),
      'Vercel': await this.getServiceCostToday('vercel'),
    };
    
    for (const [service, cost] of Object.entries(breakdown)) {
      console.log(`  ${service}: $${cost.toFixed(4)}`);
    }
    
    console.log('\n💡 Optimization Suggestions:');
    
    // Provide optimization suggestions based on usage
    if (results.find(r => r.period === 'daily')?.cost > 5) {
      console.log('  - Enable more aggressive caching (increase TTL)');
      console.log('  - Consider batching similar queries');
    }
    
    if (breakdown.OpenAI > breakdown.Cohere + breakdown.Upstash + breakdown.Algolia) {
      console.log('  - OpenAI costs dominate - consider caching responses');
      console.log('  - Reduce max_tokens in completions');
    }
    
    const cacheHitRate = await this.getCacheHitRate();
    if (cacheHitRate < 0.6) {
      console.log(`  - Cache hit rate is low (${(cacheHitRate * 100).toFixed(1)}%) - optimize cache keys`);
    }
  }

  private async getServiceCostToday(service: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let cost = 0;
    
    switch (service) {
      case 'openai':
        const promptTokens = await redis.hget(`costs:openai:prompt:${today}`, 'count') || 0;
        const completionTokens = await redis.hget(`costs:openai:completion:${today}`, 'count') || 0;
        cost += (Number(promptTokens) / 1000) * UNIT_COSTS.openai.prompt;
        cost += (Number(completionTokens) / 1000) * UNIT_COSTS.openai.completion;
        break;
      case 'cohere':
        const rerankCount = await redis.hget(`costs:cohere:rerank:${today}`, 'count') || 0;
        cost += (Number(rerankCount) / 1000) * UNIT_COSTS.cohere.rerank;
        break;
      case 'upstash':
        const vectorQueries = await redis.hget(`costs:upstash:vector:${today}`, 'count') || 0;
        const redisOps = await redis.hget(`costs:upstash:redis:${today}`, 'count') || 0;
        cost += Number(vectorQueries) * UNIT_COSTS.upstash.vector;
        cost += Number(redisOps) * UNIT_COSTS.upstash.redis;
        break;
      case 'algolia':
        const searches = await redis.hget(`costs:algolia:search:${today}`, 'count') || 0;
        cost += (Number(searches) / 1000) * UNIT_COSTS.algolia.search;
        break;
      case 'vercel':
        const functionTime = await redis.hget(`costs:vercel:function:${today}`, 'count') || 0;
        const bandwidth = await redis.hget(`costs:vercel:bandwidth:${today}`, 'count') || 0;
        cost += Number(functionTime) * UNIT_COSTS.vercel.function;
        cost += (Number(bandwidth) / 1024 / 1024 / 1024) * UNIT_COSTS.vercel.bandwidth;
        break;
    }
    
    return cost;
  }

  private async getCacheHitRate(): Promise<number> {
    const hits = Number(await redis.get('stats:cache_hits') || 0);
    const total = Number(await redis.get('stats:total_requests') || 0);
    return total > 0 ? hits / total : 0;
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new CostMonitor();
  monitor.generateReport().catch(console.error);
}