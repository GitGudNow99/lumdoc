# Vercel Deployment Guide

Deploy the entire grandMA3 Documentation Search system on Vercel with managed services. No backend servers needed!

## Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│    Vercel    │────▶│  Vercel Edge    │────▶│   Managed    │
│   (Next.js)  │     │   Functions     │     │   Services   │
└──────────────┘     └─────────────────┘     └──────────────┘
                            │                        │
                            │                  ├── Upstash Vector
                            │                  ├── Upstash Redis
                            └──────────────────┤── Algolia Search
                                              
                     ┌─────────────────┐
                     │  GitHub Actions │ (Daily crawl & index)
                     └─────────────────┘
```

## Production Features

- **Request Deduplication** - Prevents duplicate API calls  
- **Query Autocomplete** - Algolia-powered suggestions  
- **Search History** - Local storage of recent searches  
- **Keyboard Shortcuts** - Full keyboard navigation (/, Esc, Cmd+K)  
- **Export to PDF** - Download chat conversations  
- **Admin Dashboard** - Real-time metrics at /admin  
- **Evaluation Testing** - Automated quality assurance  
- **Cost Monitoring** - Spending alerts via GitHub Actions  
- **Rate Limiting** - IP-based sliding window  
- **Error Tracking** - Sentry integration  
- **Incident Runbook** - Step-by-step recovery guide  

## Quick Start (15 minutes)

### 1. Set Up Managed Services

#### Upstash Vector (2 min)
1. Create account at https://console.upstash.com
2. Create Vector Index:
   - Name: `ma3-docs`
   - Dimension: `1536`
   - Metric: `COSINE`
3. Copy `REST URL` and `REST Token`

#### Upstash Redis (1 min)
1. In Upstash console, create Redis database
2. Name: `ma3-cache`
3. Copy `REST URL` and `REST Token`

#### Algolia (3 min)
1. Create account at https://www.algolia.com
2. Create new application
3. Create index: `grandma3-docs`
4. Copy `Application ID` and `Admin API Key`

#### Cohere (Optional, 2 min)
1. Create account at https://cohere.com
2. Copy API key from dashboard
3. (Skip if you don't want reranking)

#### Sentry (Optional, 2 min)
1. Create account at https://sentry.io
2. Create new project (Next.js)
3. Copy DSN from project settings

### 2. Deploy to Vercel (5 min)

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GitGudNow99/lumdoc&env=OPENAI_API_KEY,UPSTASH_VECTOR_REST_URL,UPSTASH_VECTOR_REST_TOKEN,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,ALGOLIA_APP_ID,ALGOLIA_API_KEY,ALGOLIA_INDEX_NAME,COHERE_API_KEY,SENTRY_DSN,ADMIN_TOKEN)

#### Option B: CLI Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts and add environment variables
```

#### Option C: GitHub Integration
1. Push code to GitHub
2. Import project at https://vercel.com/new
3. Select `frontend` as root directory
4. Add environment variables (see below)

### 3. Environment Variables

#### Required
```env
# OpenAI - for embeddings and synthesis
OPENAI_API_KEY=sk-proj-...

# Upstash Vector - for semantic search
UPSTASH_VECTOR_REST_URL=https://example-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=AX...

# Upstash Redis - for caching and rate limiting
UPSTASH_REDIS_REST_URL=https://example-redis.upstash.io  
UPSTASH_REDIS_REST_TOKEN=AX...

# Algolia - for keyword search
ALGOLIA_APP_ID=YourAppID
ALGOLIA_API_KEY=YourAdminKey
ALGOLIA_INDEX_NAME=grandma3-docs
```

#### Optional but Recommended
```env
# Cohere - for reranking (improves accuracy)
COHERE_API_KEY=...

# Sentry - for error tracking
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Admin Dashboard - choose a secure token
ADMIN_TOKEN=your-secret-admin-token-here

# Cost Monitoring
COST_THRESHOLD_DAILY=10
COST_THRESHOLD_WEEKLY=50
COST_THRESHOLD_MONTHLY=150
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 4. Set Up GitHub Actions (2 min)

1. Go to your GitHub repo settings
2. Navigate to `Settings > Secrets and variables > Actions`
3. Add these secrets:
   - `OPENAI_API_KEY`
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ALGOLIA_APP_ID`
   - `ALGOLIA_API_KEY`
   - `ALGOLIA_INDEX_NAME`
   - `SLACK_WEBHOOK_URL` (optional)
   - `ADMIN_TOKEN` (optional)

4. Trigger first indexing:
```bash
# Go to Actions tab in GitHub
# Run "Index Documentation" workflow manually
# Or wait for daily 2 AM UTC run
```

## Initial Data Load

After deployment, trigger the indexing:

### Via GitHub Actions
1. Go to your repo's Actions tab
2. Click "Index Documentation" workflow
3. Click "Run workflow"
4. Set version (default: 2.3)
5. Set max pages (default: 500)
6. Click "Run workflow"

### Monitor Progress
- Check Actions tab for progress
- Takes ~15-20 minutes for 500 pages
- Includes crawling, embedding, and indexing

## Verify Deployment

1. **Check Frontend:**
   - Visit your Vercel URL
   - Should see chat interface

2. **Test Search:**
   - Type "Store command"
   - Should get results within 1-2 seconds
   - Try autocomplete suggestions

3. **Test Chat:**
   - Ask "How do I use MAtricks?"
   - Should get streaming response with citations

4. **Check Admin Dashboard:**
   - Visit `/admin` with Bearer token
   - View real-time metrics

5. **Run Evaluation:**
   ```bash
   cd frontend
   npm run eval:prod
   ```

## Monitoring & Operations

### Admin Dashboard
Access at `https://your-app.vercel.app/admin`
- Requires Bearer token authentication
- Real-time query metrics
- System health monitoring
- Error logs

### Evaluation Testing
```bash
# Run locally against production
cd frontend
npm run eval:prod

# Automated via GitHub Actions
# Runs on push to main, PRs, and daily
```

### Cost Monitoring
```bash
# Check current costs
cd frontend
npx tsx ../scripts/cost-monitor.ts

# Automated alerts every 6 hours via GitHub Actions
# Sends Slack alerts when thresholds exceeded
```

### Incident Response
See `RUNBOOK.md` for:
- Common incident procedures
- Recovery steps
- Monitoring checklist
- Emergency contacts

## Performance Optimization

### Edge Functions
The search API runs on Edge for fastest response:
```typescript
// Already configured in api/search/route.ts
export const runtime = 'edge';
```

### Caching Strategy
- Search results cached for 15 minutes
- Automatic cache invalidation on new indexing
- Redis handles ~10k requests/day on free tier

### Request Deduplication
- Prevents duplicate in-flight requests
- Reduces API costs
- Improves response times

### Regional Deployment
```json
// vercel.json
{
  "regions": ["iad1", "sfo1", "fra1"] // Multi-region for global users
}
```

## Rate Limiting

All API routes are protected with rate limiting:

### Default Limits
- **Search API**: 30 requests/minute per IP
- **Answer API**: 10 requests/minute per IP
- **Chat API**: 30 requests/minute per IP
- **Autocomplete**: 60 requests/minute per IP
- **Global**: 1000 total requests/minute

### Configuration
Rate limits in `middleware.ts`:
```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
});
```

### Monitoring
- View rate limit analytics in Upstash Console
- Track 429 responses in Vercel Analytics
- Headers include rate limit info

## Scaling

### Traffic Tiers

#### Hobby (Free)
- 100k requests/month
- Perfect for testing

#### Pro ($20/month)
- Unlimited requests
- Analytics included
- Team collaboration

#### Enterprise
- Custom limits
- SLA guarantees
- Priority support

### Service Limits & Costs

| Service | Free Tier | Paid Tier | Est. Cost |
|---------|-----------|-----------|-----------|
| Vercel | 100GB bandwidth | Unlimited | $20/mo |
| Upstash Vector | 10k req/day | Pay-per-use | ~$10/mo |
| Upstash Redis | 10k req/day | Pay-per-use | ~$5/mo |
| Algolia | 10k searches/mo | 1M searches | $50/mo |
| OpenAI | Pay-per-use | - | ~$20/mo |
| Sentry | 5k events/mo | 50k events | $0-26/mo |

**Estimated monthly cost**: $30-50 for moderate traffic

## Updating Documentation

### Manual Trigger
```bash
# Via GitHub UI
Actions > Index Documentation > Run workflow

# Via GitHub CLI
gh workflow run index-docs.yml -f version=2.3 -f max_pages=500
```

### Automatic Updates
- Daily at 2 AM UTC
- On-demand via GitHub Actions
- Evaluation tests run after indexing

## Troubleshooting

### "No results found"
1. Check if indexing completed in GitHub Actions
2. Verify API keys in Vercel dashboard
3. Check Algolia and Upstash dashboards for data

### Slow responses
1. Check cache hit rate in admin dashboard
2. Verify Edge runtime is enabled
3. Review request deduplication stats
4. Check Cohere reranking timeout

### High costs
1. Run cost monitor: `npx tsx scripts/cost-monitor.ts`
2. Review cache hit rate (target >60%)
3. Check request deduplication effectiveness
4. Consider increasing cache TTL

### Rate limit errors
1. Default: 30 requests/minute per IP
2. Adjust in `middleware.ts` if needed
3. Monitor in Upstash Redis dashboard

## Advanced Configuration

### Custom Domain
```bash
# In Vercel dashboard
Settings > Domains > Add
# Enter: search.yourdomain.com
# Add CNAME record to your DNS
```

### A/B Testing
```typescript
// Use Vercel Edge Config for feature flags
import { get } from "@vercel/edge-config";

const useReranking = await get("use-reranking");
```

### Authentication (Coming Soon)
- Clerk integration ready
- NextAuth.js compatible
- Private deployment support

## Security Best Practices

1. **API Key Rotation:**
   - Rotate keys every 90 days
   - Use Vercel environment variables
   - Never commit keys to git

2. **Access Control:**
   - Rate limiting enabled by default
   - IP-based throttling
   - Admin dashboard requires auth token

3. **Data Privacy:**
   - No user data stored
   - Search queries cached anonymously
   - Comply with GDPR if in EU

4. **DDoS Protection:**
   - Vercel's built-in DDoS protection
   - Upstash rate limiting
   - Request deduplication

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Initial indexing completed
- [ ] Evaluation tests passing (>90%)
- [ ] Admin dashboard accessible
- [ ] Cost monitoring configured
- [ ] Rate limits tested
- [ ] Custom domain configured (optional)
- [ ] Sentry error tracking enabled
- [ ] Slack alerts configured
- [ ] Runbook reviewed with team

## Support

- **Vercel**: https://vercel.com/support
- **Upstash**: https://upstash.com/docs
- **Algolia**: https://www.algolia.com/doc
- **GitHub Actions**: Check workflow logs
- **Runbook**: See RUNBOOK.md for incidents

## Next Steps

1. Deploy to Vercel
2. Set up managed services
3. Run initial indexing
4. Test all features
5. Configure monitoring
6. Share with your lighting team!

---

**Total setup time: ~15 minutes**  
**Monthly cost: $30-50**  
**Maintenance: Automatic with monitoring**