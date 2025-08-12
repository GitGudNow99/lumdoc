'use client';

import { Clock, TrendingUp, X, Trash2 } from 'lucide-react';
import { useSearchHistory } from '@/app/hooks/useSearchHistory';

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void;
  className?: string;
}

export function SearchHistory({ onSelectQuery, className }: SearchHistoryProps) {
  const { 
    history, 
    removeFromHistory, 
    clearHistory, 
    getRecentSearches,
    getFrequentSearches 
  } = useSearchHistory();

  const recentSearches = getRecentSearches();
  const frequentSearches = getFrequentSearches();

  if (history.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-400">Search History</h3>
          <button
            onClick={clearHistory}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            title="Clear all history"
          >
            <Trash2 className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-zinc-600" />
              <span className="text-xs text-zinc-500">Recent</span>
            </div>
            <div className="space-y-1">
              {recentSearches.map((item, index) => (
                <div
                  key={`recent-${index}`}
                  className="group flex items-center justify-between p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                >
                  <button
                    onClick={() => onSelectQuery(item.query)}
                    className="flex-1 text-left text-sm truncate"
                  >
                    {item.query}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.query);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-600 rounded transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequent Searches */}
        {frequentSearches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3 h-3 text-zinc-600" />
              <span className="text-xs text-zinc-500">Frequent</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {frequentSearches.map((query, index) => (
                <button
                  key={`frequent-${index}`}
                  onClick={() => onSelectQuery(query)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}