'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface FeedbackButtonProps {
  messageId: string;
  query: string;
  answer: string;
  citations: any[];
}

export function FeedbackButton({ messageId, query, answer, citations }: FeedbackButtonProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (type: 'helpful' | 'not-helpful') => {
    if (feedback || isSubmitting) return;
    
    setIsSubmitting(true);
    setFeedback(type);

    try {
      // Send to analytics
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('track', 'feedback', {
          type,
          messageId,
          query: query.slice(0, 100), // Truncate for privacy
        });
      }

      // Optionally send to backend
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          messageId,
          query,
          answer: answer.slice(0, 500),
          citationCount: citations.length,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
      <span className="text-xs text-zinc-500">Was this helpful?</span>
      
      <button
        onClick={() => submitFeedback('helpful')}
        disabled={feedback !== null || isSubmitting}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          feedback === 'helpful'
            ? "bg-green-900/30 text-green-400"
            : feedback === null
            ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            : "text-zinc-700 cursor-not-allowed"
        )}
        aria-label="Mark as helpful"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => submitFeedback('not-helpful')}
        disabled={feedback !== null || isSubmitting}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          feedback === 'not-helpful'
            ? "bg-red-900/30 text-red-400"
            : feedback === null
            ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            : "text-zinc-700 cursor-not-allowed"
        )}
        aria-label="Mark as not helpful"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
      
      {feedback && (
        <span className="text-xs text-zinc-500 ml-2">
          Thanks for your feedback!
        </span>
      )}
    </div>
  );
}