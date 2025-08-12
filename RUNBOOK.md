# grandMA3 Docs Search - Incident Runbook

## Quick Links
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Upstash Console](https://console.upstash.com)
- [Algolia Dashboard](https://dashboard.algolia.com)
- [Sentry Issues](https://sentry.io)
- [Admin Dashboard](/admin)

## Common Incidents & Solutions

### 1. High Response Times (>3s)

**Symptoms:**
- User reports of slow searches
- P95 response time > 3000ms
- Sentry alerts for timeout errors

**Diagnosis:**
```bash
# Check Vercel function logs
vercel logs --prod --since 1h

# Check Redis latency
curl -X GET https://api.upstash.com/v2/redis/stats \
  -H "Authorization: Bearer $UPSTASH_API_KEY"

# Check Algolia status
curl https://status.algolia.com/api/v2/status.json
```

**Solutions:**
1. **Cache miss storm:**
   - Clear and warm cache: `npm run cache:warm`
   - Increase cache TTL in `/lib/cache.ts`

2. **OpenAI API slowdown:**
   - Switch to fallback model in env vars
   - Reduce `max_tokens` in answer generation

3. **Vector search timeout:**
   - Reduce `topK` parameter
   - Check Upstash Vector index health

### 2. Rate Limiting Issues

**Symptoms:**
- 429 errors in logs
- "Too many requests" user messages

**Diagnosis:**
```bash
# Check current rate limit usage
redis-cli --eval check_ratelimits.lua

# Find top requesters
redis-cli ZREVRANGE ratelimit:ips 0 10 WITHSCORES
```

**Solutions:**
1. **Legitimate traffic spike:**
   - Temporarily increase limits in middleware
   - Scale Vercel functions: `vercel scale 10`

2. **Bot/abuse traffic:**
   - Add IP to blocklist
   - Enable Cloudflare protection

### 3. Search Quality Degradation

**Symptoms:**
- User reports of irrelevant results
- Low confidence scores in evaluation
- Increased "no results" responses

**Diagnosis:**
```bash
# Run evaluation harness
npm run eval:prod

# Check index freshness
curl -X GET https://algolia.com/1/indexes/grandma3-docs/settings \
  -H "X-Algolia-API-Key: $ALGOLIA_API_KEY"
```

**Solutions:**
1. **Stale index:**
   - Trigger reindexing: `npm run index:rebuild`
   - Check crawler last run in GitHub Actions

2. **Embedding drift:**
   - Regenerate embeddings with latest model
   - Increase reranking threshold

### 4. Complete Service Outage

**Symptoms:**
- Site returns 500/503 errors
- All API calls failing
- Vercel deployment stuck

**Diagnosis:**
```bash
# Check all service statuses
./scripts/health-check.sh

# Check environment variables
vercel env pull
```

**Solutions:**
1. **Rollback to last working version:**
   ```bash
   vercel rollback
   ```

2. **Service-specific recovery:**
   - **Upstash down:** Switch to backup Redis
   - **Algolia down:** Use vector-only search
   - **OpenAI down:** Use cached responses only

### 5. Memory/Cost Spike

**Symptoms:**
- Vercel usage alerts
- Unexpected API costs
- Function timeout increases

**Diagnosis:**
```bash
# Check function metrics
vercel inspect [deployment-id]

# Check API usage
curl https://api.openai.com/v1/usage
```

**Solutions:**
1. **Reduce costs:**
   - Enable aggressive caching
   - Reduce embedding dimensions
   - Implement request deduplication

2. **Memory optimization:**
   - Reduce batch sizes
   - Stream responses
   - Clear unused caches

## Monitoring Checklist

### Every 15 minutes (automated):
- [ ] Synthetic search test
- [ ] API endpoint health
- [ ] Cache hit rate > 60%

### Hourly:
- [ ] Check error rate < 1%
- [ ] Verify P95 latency < 2s
- [ ] Review top queries

### Daily:
- [ ] Run evaluation suite
- [ ] Check crawler status
- [ ] Review Sentry issues
- [ ] Verify backup status

## Emergency Contacts

- **On-call Engineer:** Check PagerDuty
- **Vercel Support:** support@vercel.com
- **Upstash Support:** support@upstash.com
- **Algolia Support:** support@algolia.com

## Recovery Procedures

### Full System Recovery
1. Verify all environment variables are set
2. Redeploy from main branch
3. Clear all caches
4. Run health checks
5. Trigger reindexing if needed
6. Run evaluation suite
7. Monitor for 30 minutes

### Data Recovery
1. Restore from latest backup (S3)
2. Reindex documents
3. Regenerate embeddings
4. Verify search quality
5. Clear and warm caches

## Useful Commands

```bash
# Emergency cache clear
redis-cli FLUSHDB

# Force reindex
npm run crawl && npm run index

# Check all services
curl http://localhost:3000/api/health

# Export logs
vercel logs --prod --since 24h > incident.log

# Scale functions
vercel scale 20 --duration 1h
```

## Post-Incident

1. Create incident report
2. Update this runbook
3. Add monitoring for root cause
4. Schedule post-mortem meeting
5. Update alerts/thresholds
6. Test recovery procedure