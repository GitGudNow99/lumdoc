# Evaluation Harness

Automated quality testing for the grandMA3 Documentation Search system.

## Overview

The evaluation harness tests the search and answer quality using a set of golden queries across different categories:
- Command syntax
- Workflows
- Concepts
- Hardware
- Network
- Fixtures
- Edge cases
- Version-specific queries
- Negative tests (out-of-scope queries)

## Running Tests

### Mock Test (No Server Required)
```bash
cd frontend
npm run eval:mock
```
This runs a simulated evaluation without needing a live server or indexed data.

### Local Test (Requires Dev Server)
```bash
# Terminal 1: Start dev server
cd frontend
npm run dev

# Terminal 2: Run evaluation
cd frontend
npm run eval
```

### Production Test
```bash
cd frontend
npm run eval:prod
```
Tests against the live production deployment.

## Test Configuration

Golden queries are defined in `golden-queries.json`:
- `expected_keywords`: Words that should appear in the answer
- `expected_citations`: Whether citations should be present
- `min_confidence`: Minimum acceptable confidence score
- `should_refuse`: For negative tests, whether the query should be refused

## Success Criteria

- Overall pass rate > 90%
- Citation accuracy > 85%
- Keyword coverage > 80%
- Average confidence > 0.7
- P95 response time < 3000ms

## Troubleshooting

### "fetch failed" Errors
- Make sure the dev server is running: `npm run dev`
- Check that API keys are set in `.env.local`
- Verify data has been indexed

### Low Pass Rate
- Check if documents are properly indexed
- Review Algolia and Upstash dashboards for data
- Verify API keys are correct
- Check rate limits haven't been exceeded

### Mock vs Real Testing
- Mock tests simulate the evaluation without a server
- Real tests require indexed data and running server
- Use mock tests to verify the test infrastructure
- Use real tests to measure actual system quality