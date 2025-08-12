import { searchClient } from '@algolia/client-search';
import type { SearchResponse } from '@algolia/client-search';

// Initialize Algolia client
const algolia = searchClient(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_API_KEY!
);

export interface AlgoliaSearchResult {
  objectID: string;
  text: string;
  url: string;
  title: string;
  section_path: string;
  version: string;
  code_blocks?: string[];
  _highlightResult?: any;
}

export async function lexicalSearch(
  query: string,
  version: string = '2.3',
  limit: number = 50
): Promise<AlgoliaSearchResult[]> {
  const { results } = await algolia.search<AlgoliaSearchResult>({
    requests: [
      {
        indexName: 'ma3_docs',
        query,
        filters: `version:${version}`,
        hitsPerPage: limit,
        attributesToRetrieve: [
          'objectID',
          'text',
          'url', 
          'title',
          'section_path',
          'version',
          'code_blocks'
        ],
        attributesToHighlight: ['text', 'title'],
      }
    ]
  });

  return (results[0] as any).hits || [];
}

export async function indexDocuments(
  documents: Array<{
    objectID: string;
    text: string;
    url: string;
    title: string;
    section_path: string;
    version: string;
    code_blocks?: string[];
  }>
) {
  // Batch index to Algolia
  const batchSize = 1000;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await algolia.saveObjects({
      indexName: 'ma3_docs',
      objects: batch
    });
  }

  // Note: Index settings should be configured in the Algolia dashboard
  // The v5 API doesn't directly support setSettings on the client

  return documents.length;
}