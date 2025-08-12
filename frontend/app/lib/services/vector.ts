import { Index } from '@upstash/vector';
import { OpenAI } from 'openai';

// Initialize Upstash Vector
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    text: string;
    url: string;
    title: string;
    section_path: string;
    version: string;
    code_blocks?: string[];
  };
}

export async function vectorSearch(
  query: string,
  version: string = '2.3',
  limit: number = 50
): Promise<VectorSearchResult[]> {
  // Generate embedding for query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
    dimensions: 1536, // Upstash Vector supports up to 1536 dims
  });

  const queryVector = embeddingResponse.data[0].embedding;

  // Search in Upstash Vector
  const results = await vectorIndex.query({
    vector: queryVector,
    topK: limit,
    includeMetadata: true,
    filter: `version = '${version}'`,
  });

  return results.map((result) => ({
    id: result.id as string,
    score: result.score,
    metadata: result.metadata as VectorSearchResult['metadata'],
  }));
}

export async function upsertVectors(
  documents: Array<{
    id: string;
    text: string;
    metadata: Record<string, any>;
  }>
) {
  // Generate embeddings for all documents
  const texts = documents.map(doc => doc.text);
  
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 1536,
  });

  // Prepare vectors for upsertion
  const vectors = documents.map((doc, i) => ({
    id: doc.id,
    vector: embeddingResponse.data[i].embedding,
    metadata: doc.metadata,
  }));

  // Batch upsert to Upstash Vector
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await vectorIndex.upsert(batch);
  }

  return vectors.length;
}