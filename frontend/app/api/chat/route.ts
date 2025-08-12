import { streamText, type UIMessage } from 'ai';
import { openai } from '@/app/lib/ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, version = '2.3' }: { messages: UIMessage[], version?: string } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a precise assistant for grandMA3 documentation version ${version}.
Use the search and answer tools to find information and respond with citations.
Always search the docs first before answering.
Quote exact syntax in code fences.
If unsure, say "I found these closest sections" instead of guessing.`,
    messages,
    tools: {
      search_docs: {
        description: 'Search grandMA3 documentation for relevant passages',
        parameters: z.object({
          query: z.string().describe('Search query'),
          k: z.number().optional().default(8).describe('Number of results'),
        }),
        execute: async ({ query, k }) => {
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
            
          const response = await fetch(`${baseUrl}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, k, version }),
          });
          
          if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
          }
          
          return response.json();
        },
      },
      answer: {
        description: 'Generate an answer with citations from search results',
        parameters: z.object({
          query: z.string().describe('User question'),
          mode: z.enum(['strict', 'helpful']).optional().default('strict'),
        }),
        execute: async ({ query, mode }) => {
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
            
          const response = await fetch(`${baseUrl}/api/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, mode, version }),
          });
          
          if (!response.ok) {
            throw new Error(`Answer generation failed: ${response.statusText}`);
          }
          
          return response.json();
        },
      },
    },
  });

  return result.toDataStreamResponse();
}