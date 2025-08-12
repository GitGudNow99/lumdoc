'use client';

import { type UIMessage } from 'ai';
import { FileText, User, Bot, ExternalLink } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FeedbackButton } from './FeedbackButton';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Extract answer and citations from tool calls for feedback
  const getAnswerData = () => {
    const answerPart = message.parts?.find((p: any) => p.type === 'tool-answer' && p.state === 'output-available') as any;
    if (answerPart?.output) {
      return {
        answer: answerPart.output.answer,
        citations: answerPart.output.citations || [],
      };
    }
    return null;
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'message-user' : 'message-assistant'
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5 text-ma3-yellow" />
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <div key={index} className="prose prose-invert max-w-none">
                {part.text.split('\n').map((line, i) => {
                  // Handle code blocks
                  if (line.startsWith('```')) {
                    return null;
                  }
                  
                  // Handle citations [1], [2], etc
                  const citationRegex = /\[(\d+)\]/g;
                  const parts = line.split(citationRegex);
                  
                  return (
                    <p key={i}>
                      {parts.map((part, j) => {
                        if (/^\d+$/.test(part)) {
                          return (
                            <span key={j} className="citation">
                              [{part}]
                            </span>
                          );
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </p>
                  );
                })}
              </div>
            );
          }
          
          if (part.type === 'tool-invocation' && (part as any).toolName === 'search_docs') {
            const toolPart = part as any;
            switch (toolPart.state) {
              case 'input-available':
                return (
                  <div key={index} className="text-sm text-muted-foreground animate-pulse">
                    Searching documentation...
                  </div>
                );
              case 'output-available':
                return (
                  <div key={index} className="text-sm text-muted-foreground">
                    Found {toolPart.output?.passages?.length || 0} relevant passages
                  </div>
                );
              case 'output-error':
                return (
                  <div key={index} className="text-sm text-red-500">
                    Search error: {toolPart.errorText}
                  </div>
                );
            }
          }
          
          if (part.type === 'tool-invocation' && (part as any).toolName === 'answer') {
            const answerPart = part as any;
            switch (answerPart.state) {
              case 'input-available':
                return (
                  <div key={index} className="text-sm text-muted-foreground animate-pulse">
                    Generating answer with citations...
                  </div>
                );
              case 'output-available':
                const { answer, citations } = answerPart.output;
                return (
                  <div key={index} className="space-y-4">
                    <div className="prose prose-invert max-w-none">
                      {answer}
                    </div>
                    {citations && citations.length > 0 && (
                      <div className="border-t border-zinc-700 pt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-zinc-400">Citations</h4>
                        {citations.map((citation: any, i: number) => (
                          <a
                            key={i}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-sm hover:bg-zinc-800 p-2 rounded transition-colors"
                          >
                            <span className="text-ma3-yellow">[{citation.id}]</span>
                            <div className="flex-1">
                              <div className="font-medium">{citation.title}</div>
                              <div className="text-zinc-500 text-xs">{citation.section}</div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              case 'output-error':
                return (
                  <div key={index} className="text-sm text-red-500">
                    Answer error: {answerPart.errorText}
                  </div>
                );
            }
          }
          
          return null;
        })}
      </div>
    </div>
  );
}