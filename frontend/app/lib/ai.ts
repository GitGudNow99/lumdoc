import { createOpenAI } from '@ai-sdk/openai';

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MCP_API_URL = process.env.MCP_API_URL || 'http://localhost:8000';