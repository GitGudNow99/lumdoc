# grandMA3 Documentation Search

AI-powered search for grandMA3 lighting console documentation with real citations and zero hallucination. Ask questions in plain English, get accurate answers with direct links to the official docs.

## Features

- **Accurate Citations** - Every answer includes [n] citations linking to exact documentation  
- **No Hallucinations** - Only uses real passages from official docs  
- **Version Aware** - Separate indexes for each grandMA3 version (2.0-2.3)  
- **Lightning Fast** - Sub-second search with edge functions  
- **Code Aware** - Finds exact command syntax like `Store Sequence 1 /merge`  
- **Rate Limited** - Protected against abuse with intelligent throttling  
- **Production Ready** - Full monitoring, testing, and incident response

## Production Features

### Core Functionality
- **Hybrid Search** - Semantic + keyword search with Cohere reranking
- **Chat Interface** - Streaming responses with Vercel AI SDK
- **Export to PDF** - Download chat conversations
- **Request Deduplication** - Prevents duplicate API calls
- **Query Autocomplete** - Suggestions powered by Algolia
- **Search History** - Local storage of recent/frequent searches
- **Keyboard Shortcuts** - Full keyboard navigation

### Operations & Monitoring
- **Admin Dashboard** - Real-time metrics and system health
- **Evaluation Harness** - Automated quality testing with golden queries
- **Cost Monitoring** - Automated alerts for spending thresholds
- **Incident Runbook** - Step-by-step recovery procedures
- **Analytics** - Vercel Analytics + Sentry error tracking
- **Rate Limiting** - Sliding window limits per IP
- **Automated Indexing** - Daily GitHub Actions workflow

## Quick Deploy (15 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GitGudNow99/lumdoc&env=OPENAI_API_KEY,UPSTASH_VECTOR_REST_URL,UPSTASH_VECTOR_REST_TOKEN,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,ALGOLIA_APP_ID,ALGOLIA_API_KEY,ALGOLIA_INDEX_NAME,COHERE_API_KEY,SENTRY_DSN,ADMIN_TOKEN)

1. **Get API Keys** (5 min)
   - [Upstash](https://console.upstash.com) - Create Vector + Redis databases
   - [Algolia](https://www.algolia.com) - Create search application  
   - [OpenAI](https://platform.openai.com) - Get API key
   - [Cohere](https://cohere.com) - Optional, for better ranking
   - [Sentry](https://sentry.io) - Optional, for error tracking

2. **Deploy to Vercel** (2 min)
   - Click deploy button above
   - Add environment variables
   - Deploy!

3. **Index Documentation** (8 min)
   - Go to GitHub Actions
   - Run "Index Documentation" workflow
   - Wait for completion

Done! Visit your Vercel URL to start searching.

## How It Works

### Architecture
```
User Query → Vercel Edge Functions → Parallel Search → Rerank → Stream Response
                                          ↓
                                    Upstash Vector (semantic)
                                    Algolia (keyword)
                                    Upstash Redis (cache)
```

### Search Pipeline
1. **Hybrid Search** - Queries both vector (semantic) and keyword (BM25) indexes
2. **Reranking** - Cohere reranks combined results for precision
3. **Synthesis** - GPT-4o generates answer using only retrieved passages
4. **Citations** - Links each claim to source documentation

### Example Query Flow
```
"How do I use MAtricks?"
    ↓
Vector: finds conceptually similar docs about fixture selection
BM25: finds exact "MAtricks" keyword matches
    ↓
Rerank: prioritizes most relevant passages
    ↓
Answer: "MAtricks is used for selecting multiple fixtures [1]. 
        The syntax is: MAtricks 1 Thru 10 [2]..."
```

## Local Development

```bash
# Clone repository
git clone https://github.com/GitGudNow99/lumdoc
cd lumdoc/frontend

# Install dependencies
npm install

# Set environment variables
cp ../.env.vercel.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Run evaluation tests
npm run eval

# Run cost monitor
npx tsx ../scripts/cost-monitor.ts
```

Visit http://localhost:3000

## Environment Variables

Required in `.env.local` or Vercel dashboard:

```env
# OpenAI - for embeddings and synthesis
OPENAI_API_KEY=sk-...

# Upstash Vector - for semantic search
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=...

# Upstash Redis - for caching and rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Algolia - for keyword search
ALGOLIA_APP_ID=...
ALGOLIA_API_KEY=...
ALGOLIA_INDEX_NAME=grandma3-docs

# Cohere - for reranking (optional but recommended)
COHERE_API_KEY=...

# Sentry - for error tracking (optional)
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...

# Admin - for dashboard access (optional)
ADMIN_TOKEN=your-secret-admin-token

# Cost Monitoring (optional)
COST_THRESHOLD_DAILY=10
COST_THRESHOLD_WEEKLY=50
COST_THRESHOLD_MONTHLY=150
SLACK_WEBHOOK_URL=...
```

## API Routes

All routes are rate limited and require proper API keys:

### `POST /api/search`
Search documentation with hybrid retrieval
```json
{
  "query": "Store command syntax",
  "k": 8,
  "version": "2.3"
}
```

### `POST /api/answer`
Generate answer with citations
```json
{
  "query": "How do I create a phaser effect?",
  "mode": "strict",
  "version": "2.3"
}
```

### `POST /api/chat`
Streaming chat interface with tool calls

### `POST /api/autocomplete`
Get search suggestions
```json
{
  "query": "stor",
  "version": "2.3"
}
```

### `POST /api/export`
Export chat to PDF

### `GET /api/admin/stats`
Admin dashboard metrics (requires auth)

## Rate Limits

- **Search**: 30 requests/minute per IP
- **Answer**: 10 requests/minute per IP (expensive GPT-4 calls)
- **Chat**: 30 requests/minute per IP
- **Autocomplete**: 60 requests/minute per IP
- **Global**: 1000 requests/minute total

Limits configured in `middleware.ts` and `app/lib/ratelimit.ts`.

## Monitoring & Operations

### Automated Testing
```bash
# Run evaluation suite locally
npm run eval

# Run against production
npm run eval:prod
```

### Cost Monitoring
```bash
# Check current costs
npx tsx scripts/cost-monitor.ts

# Automated alerts via GitHub Actions
# Runs every 6 hours, alerts on Slack
```

### Admin Dashboard
Access at `/admin` with bearer token authentication:
- Real-time query metrics
- System health status
- Error logs
- Usage statistics

### Incident Response
See `RUNBOOK.md` for:
- Common incident procedures
- Recovery steps
- Monitoring checklist
- Emergency contacts

## Performance

- **Search Latency**: p50 < 300ms (edge functions)
- **Time to First Token**: < 500ms (streaming)
- **Full Answer**: < 2 seconds
- **Citation Accuracy**: > 85%
- **Cache Hit Rate**: ~40%
- **Evaluation Pass Rate**: > 90%

## Cost Estimate

| Service | Free Tier | Typical Usage | Monthly Cost |
|---------|-----------|---------------|--------------|
| Vercel | 100GB | Hosting + Functions | $0-20 |
| Upstash Vector | 10k req/day | Semantic search | $0-10 |
| Upstash Redis | 10k req/day | Caching | $0-5 |
| Algolia | 10k searches/mo | Keyword search | $0-50 |
| OpenAI | Pay-per-use | Embeddings + GPT-4 | $10-30 |
| Sentry | 5k events/mo | Error tracking | $0 |
| **Total** | | | **$10-50/mo** |

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── chat/          # Streaming chat endpoint
│   │   ├── search/        # Hybrid search (edge runtime)
│   │   ├── answer/        # Answer generation
│   │   ├── autocomplete/  # Query suggestions
│   │   ├── export/        # PDF export
│   │   └── admin/         # Admin stats
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   └── lib/
│       ├── services/     # Upstash, Algolia, Cohere clients
│       └── request-dedup.ts # Request deduplication
├── middleware.ts         # Rate limiting
└── vercel.json          # Deployment config

scripts/
├── crawl.py             # GitHub Actions crawler
├── index.py             # Indexing to Upstash/Algolia
└── cost-monitor.ts      # Cost tracking and alerts

evaluation/
├── golden-queries.json  # Test queries
└── run-evaluation.ts    # Evaluation harness

.github/
└── workflows/
    ├── index-docs.yml   # Daily indexing
    ├── evaluation.yml   # Quality testing
    └── cost-monitor.yml # Cost alerts
```

## Security

- Rate limiting on all endpoints
- API keys in environment variables
- No user data stored
- Queries cached anonymously
- DDoS protection via Vercel + Upstash
- Request deduplication
- Admin authentication
- Sentry error filtering (no PII)

## Troubleshooting

### "No results found"
- Check if indexing completed in GitHub Actions
- Verify API keys in Vercel dashboard
- Check Algolia and Upstash dashboards for data

### Rate limit errors
- Default: 30 requests/minute per IP
- Adjust in `middleware.ts` if needed
- Monitor in Upstash Redis dashboard

### Slow responses  
- Ensure Redis is connected for caching
- Check if Cohere reranking is timing out
- Verify edge runtime is enabled for `/api/search`
- Review request deduplication stats

### High costs
- Check cost monitor: `npx tsx scripts/cost-monitor.ts`
- Review cache hit rate in admin dashboard
- Consider increasing cache TTL
- Enable request deduplication

## Contributing

Pull requests welcome! Please:
1. Keep citations accurate
2. Maintain version separation  
3. Add tests for new features
4. Update evaluation queries
5. Run `npm run eval` before submitting

## License

MIT

---

Built for lighting programmers who need accurate documentation, not creative writing.