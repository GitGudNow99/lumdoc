import { z } from 'zod';

export const CitationSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  section: z.string(),
  snippet: z.string(),
});

export const SearchResultSchema = z.object({
  passages: z.array(z.object({
    id: z.string(),
    text: z.string(),
    url: z.string(),
    title: z.string(),
    section_path: z.array(z.string()),
    score: z.number(),
    version: z.string(),
  })),
  query: z.string(),
  version: z.string().optional(),
});

export const AnswerResultSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
  confidence: z.number(),
  version: z.string(),
});

export type Citation = z.infer<typeof CitationSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type AnswerResult = z.infer<typeof AnswerResultSchema>;

export type ToolName = 'search_docs' | 'answer' | 'get_passage';