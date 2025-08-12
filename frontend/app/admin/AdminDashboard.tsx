'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Search,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Line, Bar } from 'recharts';

interface Stats {
  totalQueries: number;
  uniqueUsers: number;
  avgResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  queriesPerHour: Array<{ hour: string; count: number }>;
  topQueries: Array<{ query: string; count: number }>;
  errorLogs: Array<{ timestamp: string; error: string; query?: string }>;
  systemHealth: {
    upstash: 'healthy' | 'degraded' | 'down';
    algolia: 'healthy' | 'degraded' | 'down';
    openai: 'healthy' | 'degraded' | 'down';
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-zinc-500 mt-1">grandMA3 Docs Search Analytics</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={fetchStats}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Queries"
            value={stats.totalQueries.toLocaleString()}
            icon={<Search className="w-5 h-5" />}
            trend="+12%"
          />
          <MetricCard
            title="Unique Users"
            value={stats.uniqueUsers.toLocaleString()}
            icon={<Users className="w-5 h-5" />}
            trend="+5%"
          />
          <MetricCard
            title="Avg Response"
            value={`${stats.avgResponseTime}ms`}
            icon={<Clock className="w-5 h-5" />}
            trend="-8%"
            trendGood={false}
          />
          <MetricCard
            title="Cache Hit Rate"
            value={`${(stats.cacheHitRate * 100).toFixed(1)}%`}
            icon={<Database className="w-5 h-5" />}
            trend="+3%"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Query Volume Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Query Volume</h2>
            <div className="h-64">
              {/* Simplified chart placeholder */}
              <div className="flex items-end justify-between h-full gap-2">
                {stats.queriesPerHour.slice(-24).map((item, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-ma3-yellow hover:bg-yellow-400 transition-colors rounded-t"
                    style={{
                      height: `${(item.count / Math.max(...stats.queriesPerHour.map(q => q.count))) * 100}%`,
                    }}
                    title={`${item.hour}: ${item.count} queries`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top Queries */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Top Queries</h2>
            <div className="space-y-3">
              {stats.topQueries.slice(0, 8).map((query, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400 truncate flex-1">
                    {query.query}
                  </span>
                  <span className="text-sm font-mono text-zinc-500 ml-2">
                    {query.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthIndicator
              service="Upstash Vector"
              status={stats.systemHealth.upstash}
            />
            <HealthIndicator
              service="Algolia Search"
              status={stats.systemHealth.algolia}
            />
            <HealthIndicator
              service="OpenAI API"
              status={stats.systemHealth.openai}
            />
          </div>
        </div>

        {/* Error Logs */}
        {stats.errorLogs.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Recent Errors
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.errorLogs.map((log, i) => (
                <div key={i} className="p-3 bg-zinc-800 rounded-lg text-sm">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-red-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-300">{log.error}</p>
                  {log.query && (
                    <p className="text-zinc-500 text-xs mt-1">Query: {log.query}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendGood = true,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendGood?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-500">{title}</span>
        <span className="text-zinc-600">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <span className={`text-xs flex items-center gap-1 ${
            trendGood ? 'text-green-500' : 'text-red-500'
          }`}>
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function HealthIndicator({
  service,
  status,
}: {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
}) {
  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
      <span className="text-sm">{service}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs capitalize ${
          status === 'healthy' ? 'text-green-500' : 
          status === 'degraded' ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {status}
        </span>
        <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
      </div>
    </div>
  );
}