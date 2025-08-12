'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { dedupFetch } from '@/lib/request-dedup';

interface SearchResult {
  title: string;
  content: string;
  url: string;
  section: string;
  version: string;
  score: number;
  highlights?: string[];
}

let debounceTimer: NodeJS.Timeout;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const searchAbortController = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearchTime(null);
      return;
    }

    // Cancel previous search if in progress
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    searchAbortController.current = new AbortController();
    setIsSearching(true);
    setError(null);
    
    const startTime = performance.now();
    
    try {
      const response = await dedupFetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          version: '2.3' // Default to latest version
        }),
        signal: searchAbortController.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please slow down.');
        }
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setSearchTime(performance.now() - startTime);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Search failed');
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((value: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleSearch(value);
    }, 300);
  }, [handleSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-ma3-yellow rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">MA3</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">grandMA3 Docs Search</h1>
              <p className="text-xs text-zinc-500">Fast keyword search with instant results</p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search grandMA3 documentation..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-ma3-yellow focus:bg-zinc-700 transition-colors"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-zinc-500" />
            )}
          </div>
          
          {/* Search stats */}
          {searchTime !== null && results.length > 0 && (
            <div className="mt-2 text-xs text-zinc-500">
              Found {results.length} results in {searchTime.toFixed(0)}ms
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
        
        {results.length === 0 && query && !isSearching && !error && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No results found for "{query}"</p>
            <p className="text-sm text-zinc-600 mt-2">Try different keywords or check your spelling</p>
          </div>
        )}
        
        {results.length === 0 && !query && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">Start typing to search grandMA3 documentation</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "Store command",
                "MAtricks",
                "Phaser effect",
                "Timecode",
                "Sequence",
                "Preset"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={`${result.url}-${idx}`}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ma3-yellow mb-1 truncate">
                    {result.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-2">
                    {result.section} • Version {result.version}
                  </p>
                  <p className="text-sm text-zinc-300 line-clamp-3">
                    {result.highlights?.[0] || result.content}
                  </p>
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  title="Open in documentation"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              {result.score && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-ma3-yellow"
                      style={{ width: `${result.score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {(result.score * 100).toFixed(0)}% match
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}