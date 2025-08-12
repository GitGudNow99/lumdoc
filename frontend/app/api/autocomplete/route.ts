import { NextRequest, NextResponse } from 'next/server';
import { searchClient } from '@algolia/client-search';
import { redis } from '@/lib/redis';

const client = searchClient(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_API_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { query, version = '2.3' } = await req.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Check cache
    const cacheKey = `autocomplete:${query}:${version}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ suggestions: cached });
    }

    // Get suggestions from Algolia
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'grandma3-docs';
    
    const { results } = await client.search({
      requests: [{
        indexName,
        query,
        filters: `version:${version}`,
        hitsPerPage: 5,
        attributesToRetrieve: ['title', 'section', 'content'],
        attributesToHighlight: ['title'],
        queryType: 'prefixAll',
        distinct: true,
      }]
    });

    // Extract suggestions
    const hits = (results[0] as any).hits || [];
    const suggestions = hits.map((hit: any) => ({
      text: hit.title,
      section: hit.section,
      preview: hit.content?.substring(0, 100) + '...',
    }));

    // Also get query suggestions from popular searches
    const popularQueries = [
      'Store command',
      'MAtricks',
      'Delete cue',
      'Phaser effect',
      'Timecode trigger',
      'Preset types',
      'Go vs Goto',
      'MA-Net3 setup',
      'Patch fixtures',
      'Recipe values',
    ];

    const matchingQueries = popularQueries
      .filter(q => q.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(q => ({
        text: q,
        section: 'Popular search',
        preview: 'Frequently searched topic',
      }));

    const allSuggestions = [...matchingQueries, ...suggestions].slice(0, 8);

    // Cache for 5 minutes
    await redis.set(cacheKey, allSuggestions, { ex: 300 });

    return NextResponse.json({ suggestions: allSuggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}