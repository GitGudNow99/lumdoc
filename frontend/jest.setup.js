// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.UPSTASH_VECTOR_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_VECTOR_REST_TOKEN = 'test-token';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
process.env.ALGOLIA_APP_ID = 'test-app';
process.env.ALGOLIA_API_KEY = 'test-key';

// Mock fetch for tests
global.fetch = jest.fn();