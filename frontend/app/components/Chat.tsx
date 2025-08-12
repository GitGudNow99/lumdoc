'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Search, ChevronDown } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/app/lib/utils';

const VERSIONS = ['2.3', '2.2', '2.1', '2.0'];

export function Chat() {
  const [version, setVersion] = useState('2.3');
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    body: {
      version,
    },
    maxSteps: 3, // Allow multiple tool calls
    onError: (error) => {
      // Handle rate limit errors gracefully
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        console.error('Rate limited. Please slow down.');
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ma3-yellow rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">MA3</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">grandMA3 Docs Search</h1>
              <p className="text-xs text-zinc-500">AI-powered documentation with citations</p>
            </div>
          </div>
          
          {/* Version Selector */}
          <div className="relative">
            <button
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              <span className="text-zinc-400">Version:</span>
              <span className="text-ma3-yellow font-medium">{version}</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showVersionDropdown && "rotate-180"
              )} />
            </button>
            
            {showVersionDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                {VERSIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setVersion(v);
                      setShowVersionDropdown(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors",
                      v === version && "bg-zinc-700 text-ma3-yellow"
                    )}
                  >
                    Version {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to grandMA3 Docs Search</h2>
              <p className="text-zinc-500">Ask me anything about grandMA3 commands, syntax, or workflows</p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "How do I use the Store command?",
                  "What's the syntax for MAtricks?",
                  "How to create a phaser effect?",
                  "Explain timecode triggers"
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <span className="text-sm text-red-400">
                {error.message?.includes('429') 
                  ? 'You\'re sending messages too quickly. Please wait a moment before trying again.'
                  : 'An error occurred. Please try again.'}
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-900">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about grandMA3 commands, syntax, or workflows..."
              className="w-full px-4 py-3 pr-12 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-ma3-yellow focus:bg-zinc-700 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors",
                input.trim() && !isLoading
                  ? "bg-ma3-yellow text-black hover:bg-yellow-400"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}