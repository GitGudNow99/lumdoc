import { useState, useEffect, useCallback } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  version?: string;
}

const MAX_HISTORY_ITEMS = 20;
const STORAGE_KEY = 'grandma3-search-history';

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((items: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setHistory(items);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  // Add item to history
  const addToHistory = useCallback((query: string, version?: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      version,
    };

    setHistory(prev => {
      // Remove duplicates
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase()
      );
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      saveHistory(updated);
      
      return updated;
    });
  }, [saveHistory]);

  // Remove item from history
  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase()
      );
      saveHistory(filtered);
      return filtered;
    });
  }, [saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  // Get recent searches (last 5)
  const getRecentSearches = useCallback(() => {
    return history.slice(0, 5);
  }, [history]);

  // Get frequent searches
  const getFrequentSearches = useCallback(() => {
    const frequency: Record<string, number> = {};
    
    history.forEach(item => {
      const key = item.query.toLowerCase();
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query]) => query);
  }, [history]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
    getFrequentSearches,
  };
}