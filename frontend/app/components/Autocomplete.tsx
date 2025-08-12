'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Clock, FileText } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { dedupFetch } from '@/lib/request-dedup';

interface Suggestion {
  text: string;
  section: string;
  preview: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  version?: string;
}

export function Autocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Search documentation...",
  className,
  version = '2.3',
}: AutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await dedupFetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: value, version }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, version]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const suggestion = suggestions[selectedIndex];
          onChange(suggestion.text);
          onSubmit(suggestion.text);
          setShowSuggestions(false);
        } else {
          onSubmit(value);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    onSubmit(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getIcon = (section: string) => {
    if (section === 'Popular search') return <Clock className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-3 bg-zinc-800 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-ma3-yellow focus:bg-zinc-700",
            "transition-colors",
            className
          )}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors",
                  "border-b border-zinc-700 last:border-b-0",
                  index === selectedIndex && "bg-zinc-700"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 text-zinc-500">
                    {getIcon(suggestion.section)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{suggestion.text}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{suggestion.section}</div>
                    <div className="text-xs text-zinc-600 mt-1 line-clamp-1">
                      {suggestion.preview}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}