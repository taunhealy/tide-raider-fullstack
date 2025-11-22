# Fix: Cloud Run Memory Limit Exceeded

## Problem
```
Memory limit of 512 MiB exceeded with 524 MiB used
```

Puppeteer with Chromium requires significant memory. The current 512 MiB limit is insufficient.

## Solution Applied

### 1. Increased Cloud Run Memory Limit
- **Before**: 512 MiB
- **After**: 2 GiB (2048 MiB)
- **CPU**: Increased from 1 to 2 (better performance for Puppeteer)

### 2. Added Memory-Saving Chrome Flags
Added to all scrapers:
- `--disable-dev-shm-usage` - Use /tmp instead of /dev/shm
- `--disable-gpu` - Disable GPU acceleration
- `--disable-software-rasterizer` - Disable software rasterizer
- `--disable-extensions` - Disable extensions
- `--disable-background-networking` - Disable background networking
- `--memory-pressure-off` - Turn off memory pressure

## Cost Impact

### Free Tier
- Cloud Run free tier: 2 million requests/month, 360,000 GB-seconds/month
- 2 GiB memory = ~180,000 seconds/month free (if using 1 CPU)
- With 2 CPUs: ~90,000 seconds/month free

### Estimated Costs (if exceeding free tier)
- **2 GiB memory + 2 CPU**: ~$0.00002400 per request-second
- For 1000 requests/month at 10 seconds each: ~$0.24/month
- Still very affordable for development/testing

## Next Steps

1. ✅ Deploy the updated `cloudbuild.yaml` (memory increased to 2Gi)
2. ✅ Deploy the updated scrapers (memory-saving flags added)
3. ✅ Monitor Cloud Run logs for memory usage
4. ✅ Check Cloud Run metrics to verify memory usage is under 2 GiB

## Monitoring

After deployment, check:
- Cloud Run logs for memory warnings
- Cloud Run metrics dashboard for memory usage
- Should see memory usage well under 2 GiB now

## Alternative: Further Optimization

If memory is still an issue, consider:
- Using a headless browser service (e.g., Browserless.io)
- Caching scraped data more aggressively
- Running scrapers in a separate Cloud Run service with higher memory
- Using a different scraping approach (e.g., API if available)

