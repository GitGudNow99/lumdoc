import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

export interface RerankResult {
  index: number;
  relevance_score: number;
}

export async function rerankPassages(
  query: string,
  documents: string[],
  topK: number = 8
): Promise<RerankResult[]> {
  try {
    const response = await cohere.rerank({
      query,
      documents,
      topN: topK,
      model: 'rerank-v3.5',
    });

    return response.results.map(result => ({
      index: result.index,
      relevance_score: result.relevanceScore,
    }));
  } catch (error) {
    console.error('Rerank error:', error);
    // Fallback: return top K documents in original order
    return documents.slice(0, topK).map((_, index) => ({
      index,
      relevance_score: 1.0 - (index * 0.1),
    }));
  }
}