import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { rateLimiters, getIdentifier, rateLimitResponse } from '@/app/lib/ratelimit';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const AnswerRequestSchema = z.object({
  query: z.string(),
  mode: z.enum(['strict', 'helpful']).default('strict'),
  version: z.string().default('2.3'),
});

export async function POST(request: NextRequest) {
  // Apply stricter rate limit for expensive GPT-4 calls
  const identifier = getIdentifier(request);
  const { success } = await rateLimiters.expensive.limit(identifier);
  
  if (!success) {
    return rateLimitResponse('Answer generation rate limit exceeded. This operation is expensive, please wait a minute.');
  }

  try {
    const body = await request.json();
    const { query, mode, version } = AnswerRequestSchema.parse(body);

    // First, search for relevant passages
    const searchResponse = await fetch(new URL('/api/search', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k: 8, version }),
    });

    if (!searchResponse.ok) {
      throw new Error('Search failed');
    }

    const { passages } = await searchResponse.json();

    // Check confidence
    const avgScore = passages.slice(0, 3).reduce((sum: number, p: any) => 
      sum + (p.rerank_score || p.score || 0), 0) / Math.min(3, passages.length);

    if (avgScore < 0.45 && mode === 'strict') {
      return NextResponse.json({
        answer: formatLowConfidenceResponse(passages),
        citations: extractCitations(passages.slice(0, 4)),
        confidence: avgScore,
        version,
      });
    }

    // Generate answer with GPT-4
    const context = formatPassagesForLLM(passages.slice(0, 6));
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a precise assistant for grandMA3 documentation version ${version}.
Your task is to answer questions using ONLY the provided documentation passages.

Rules:
1. Use only information from the provided passages
2. Include citations [1], [2], etc. for each fact
3. Quote exact command syntax in code blocks
4. If information is incomplete, say so clearly
5. Never guess or make up information`,
        },
        {
          role: 'user',
          content: `Question: ${query}\n\nDocumentation passages:\n${context}\n\nAnswer the question using only these passages. Include citations.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const answer = completion.choices[0].message.content || '';
    const citations = extractCitationsFromAnswer(answer, passages);

    return NextResponse.json({
      answer,
      citations,
      confidence: avgScore,
      version,
    });
  } catch (error) {
    console.error('Answer generation error:', error);
    return NextResponse.json(
      { error: 'Answer generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function formatPassagesForLLM(passages: any[]): string {
  return passages.map((p, i) => {
    const section = Array.isArray(p.section_path) 
      ? p.section_path.join(' > ') 
      : p.section_path;
    
    let formatted = `[${i + 1}] ${p.title} - ${section}\nURL: ${p.url}\n---\n${p.text}`;
    
    if (p.code_blocks && p.code_blocks.length > 0) {
      formatted += '\n\nCode examples:\n';
      p.code_blocks.slice(0, 2).forEach((code: string) => {
        formatted += `\`\`\`\n${code}\n\`\`\`\n`;
      });
    }
    
    return formatted;
  }).join('\n\n');
}

function formatLowConfidenceResponse(passages: any[]): string {
  let answer = "I found some potentially relevant sections, but I'm not confident they fully answer your question. Here are the closest matches:\n\n";
  
  passages.slice(0, 4).forEach((p, i) => {
    const section = Array.isArray(p.section_path) 
      ? p.section_path.join(' > ') 
      : p.section_path;
    const snippet = p.text.length > 300 ? p.text.slice(0, 300) + '...' : p.text;
    answer += `[${i + 1}] ${p.title} - ${section}\n${snippet}\n\n`;
  });
  
  answer += "\nPlease review these sections or try rephrasing your question for better results.";
  return answer;
}

function extractCitations(passages: any[]): any[] {
  return passages.map((p, i) => ({
    id: i + 1,
    url: p.url,
    title: p.title,
    section: Array.isArray(p.section_path) 
      ? p.section_path.join(' > ') 
      : p.section_path,
    snippet: p.text.length > 200 ? p.text.slice(0, 200) + '...' : p.text,
  }));
}

function extractCitationsFromAnswer(answer: string, passages: any[]): any[] {
  const citationPattern = /\[(\d+)\]/g;
  const citedNumbers = new Set(
    Array.from(answer.matchAll(citationPattern)).map(match => parseInt(match[1]))
  );
  
  const citations: any[] = [];
  citedNumbers.forEach(num => {
    if (num > 0 && num <= passages.length) {
      const p = passages[num - 1];
      citations.push({
        id: num,
        url: p.url,
        title: p.title,
        section: Array.isArray(p.section_path) 
          ? p.section_path.join(' > ') 
          : p.section_path,
        snippet: p.text.length > 200 ? p.text.slice(0, 200) + '...' : p.text,
      });
    }
  });
  
  return citations.sort((a, b) => a.id - b.id);
}