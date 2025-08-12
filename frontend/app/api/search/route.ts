import { NextRequest, NextResponse } from 'next/server';
import { vectorSearch } from '@/app/lib/services/vector';
import { lexicalSearch } from '@/app/lib/services/search';
import { rerankPassages } from '@/app/lib/services/rerank';
import { getCached, setCached, getCacheKey } from '@/app/lib/services/cache';
import { rateLimiters, getIdentifier, rateLimitResponse } from '@/app/lib/ratelimit';
import { z } from 'zod';

const SearchRequestSchema = z.object({
  query: z.string(),
  k: z.number().default(8),
  version: z.string().default('2.3'),
  path: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const identifier = getIdentifier(request);
  const { success, limit, reset, remaining } = await rateLimiters.api.limit(identifier);
  
  if (!success) {
    return rateLimitResponse('Search rate limit exceeded. Please wait a moment.');
  }

  let query: string | undefined;
  let version: string | undefined;
  
  try {
    const body = await request.json();
    const parsed = SearchRequestSchema.parse(body);
    query = parsed.query;
    version = parsed.version;
    const { k, path } = parsed;

    // Check cache
    const cacheKey = await getCacheKey({ query, k, version, path });
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Parallel search: vector + lexical
    const [vectorResults, lexicalResults] = await Promise.all([
      vectorSearch(query, version, 50),
      lexicalSearch(query, version, 50),
    ]);

    // Combine and deduplicate results
    const combinedMap = new Map();
    
    // Add vector results with their scores
    vectorResults.forEach(result => {
      combinedMap.set(result.id, {
        id: result.id,
        text: result.metadata.text,
        url: result.metadata.url,
        title: result.metadata.title,
        section_path: result.metadata.section_path,
        version: result.metadata.version,
        code_blocks: result.metadata.code_blocks || [],
        score: result.score,
        source: 'vector',
      });
    });

    // Add lexical results (if not already present)
    lexicalResults.forEach(result => {
      if (!combinedMap.has(result.objectID)) {
        combinedMap.set(result.objectID, {
          id: result.objectID,
          text: result.text,
          url: result.url,
          title: result.title,
          section_path: result.section_path,
          version: result.version,
          code_blocks: result.code_blocks || [],
          score: 0.5, // Default score for lexical-only results
          source: 'lexical',
        });
      }
    });

    const combinedResults = Array.from(combinedMap.values());

    // Rerank if we have enough results
    let finalResults = combinedResults;
    if (combinedResults.length > k) {
      const documents = combinedResults.map(r => r.text);
      const reranked = await rerankPassages(query, documents, k);
      
      finalResults = reranked.map(({ index, relevance_score }) => ({
        ...combinedResults[index],
        rerank_score: relevance_score,
      }));
    } else {
      finalResults = combinedResults.slice(0, k);
    }

    const response = {
      passages: finalResults,
      query,
      version,
    };

    // Cache the response
    await setCached(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    // Report to Sentry
    if (process.env.NODE_ENV === 'production') {
      const { captureException } = await import('@sentry/nextjs');
      captureException(error, {
        tags: { endpoint: 'search' },
        extra: { query, version },
      });
    }
    
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Edge runtime for better performance
export const runtime = 'edge';