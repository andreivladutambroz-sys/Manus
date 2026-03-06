# 🚀 Vercel Deployment Guide: 200-Agent Swarm

## Overview

This guide explains how to deploy the 200-agent automotive data collection swarm on Vercel with FlareSolverr for real Cloudflare bypass.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes (Serverless Functions)              │   │
│  │  - /api/flaresolverr-proxy                       │   │
│  │  - /api/launch-swarm                             │   │
│  │  - /api/cron/collect-data (Daily @ 2 AM UTC)    │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  200-Agent Orchestrator                          │   │
│  │  - Batch execution (5 agents at a time)          │   │
│  │  - Parallel scraping                             │   │
│  │  - Data aggregation                              │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  FlareSolverr (External or Self-Hosted)          │   │
│  │  - Cloudflare bypass                             │   │
│  │  - Browser automation                            │   │
│  │  - Session management                            │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Real Suppliers (30+ Romanian websites)          │   │
│  │  - epiesa.ro                                     │   │
│  │  - autodoc.ro                                    │   │
│  │  - emag.ro, dedeman.ro, altex.ro, etc.          │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Database (Supabase)                             │   │
│  │  - scraped_parts (OEM codes, prices)             │   │
│  │  - scraped_vehicles (brands, models)             │   │
│  │  - scraping_stats (metrics)                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Vercel Account** (free tier available)
2. **FlareSolverr Instance** (external or self-hosted)
3. **Supabase Project** (for data storage)
4. **Git Repository** (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up FlareSolverr

### Option A: Self-Hosted on Render/Railway (Recommended)

```bash
# Deploy to Render
# 1. Go to https://render.com
# 2. Create new "Web Service"
# 3. Connect GitHub repo with FlareSolverr
# 4. Set build command: pip install -r requirements.txt
# 5. Set start command: python src/flaresolverr.py
# 6. Get public URL: https://your-flaresolverr.onrender.com
```

### Option B: Docker on VPS

```bash
docker run -d \
  --name=flaresolverr \
  -p 8191:8191 \
  -e LOG_LEVEL=info \
  ghcr.io/flaresolverr/flaresolverr:latest
```

## Step 2: Deploy to Vercel

### 1. Push code to GitHub

```bash
git add .
git commit -m "Add 200-agent swarm for Vercel"
git push origin main
```

### 2. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
FLARESOLVERR_API=https://your-flaresolverr.onrender.com/v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secret-key-here
```

## Step 3: Configure Cron Jobs

Vercel automatically runs cron jobs defined in `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/collect-data",
    "schedule": "0 2 * * *"
  }
]
```

This runs daily at 2 AM UTC.

## Step 4: Test the Deployment

### Test FlareSolverr Proxy

```bash
curl -X POST https://your-vercel-app.vercel.app/api/flaresolverr-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "request.get",
    "url": "https://www.epiesa.ro/catalog",
    "maxTimeout": 30000
  }'
```

### Launch Swarm

```bash
curl -X POST https://your-vercel-app.vercel.app/api/launch-swarm \
  -H "Content-Type: application/json" \
  -d '{
    "agents": 30,
    "batchSize": 5
  }'
```

## Step 5: Monitor Execution

### Vercel Logs

```bash
vercel logs --follow
```

### Database Queries

```sql
-- Check collected parts
SELECT COUNT(*) FROM scraped_parts;

-- Check latest data
SELECT * FROM scraped_parts ORDER BY scraped_at DESC LIMIT 10;

-- Check scraping stats
SELECT * FROM scraping_stats ORDER BY executed_at DESC;
```

## Performance Optimization

### Batch Execution

- **Batch Size**: 5 agents per batch
- **Batch Interval**: 2 seconds
- **Total Agents**: 30-200
- **Estimated Time**: 30-120 minutes

### Memory Management

- Vercel function memory: 3008 MB
- Max duration: 900 seconds (15 minutes)
- Parallel workers: 5

### Cost Estimation

| Metric | Cost |
|--------|------|
| Vercel (free tier) | $0 |
| FlareSolverr (self-hosted) | $0 |
| Supabase (free tier) | $0 |
| **Total Monthly** | **$0** |

## Troubleshooting

### FlareSolverr Connection Error

```
Error: ECONNREFUSED 127.0.0.1:8191
```

**Solution**: Check FlareSolverr is running and FLARESOLVERR_API env var is correct.

### Timeout Errors

```
Error: Task timed out after 900 seconds
```

**Solution**: Increase batch size or reduce number of agents per batch.

### Database Connection Error

```
Error: ENOTFOUND your-project.supabase.co
```

**Solution**: Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct.

## API Documentation

### POST /api/flaresolverr-proxy

Forward requests to FlareSolverr.

**Request:**
```json
{
  "cmd": "request.get",
  "url": "https://www.epiesa.ro/catalog",
  "maxTimeout": 30000
}
```

**Response:**
```json
{
  "success": true,
  "solution": {
    "url": "https://www.epiesa.ro/catalog",
    "status": 200,
    "response": "<!DOCTYPE html>..."
  }
}
```

### POST /api/launch-swarm

Launch the 200-agent swarm.

**Request:**
```json
{
  "agents": 30,
  "batchSize": 5
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAgents": 30,
    "successfulAgents": 28,
    "failedAgents": 2,
    "totalRecords": 5432
  },
  "totalRecords": 5432,
  "data": [...]
}
```

### GET /api/cron/collect-data

Cron job for scheduled execution (runs daily).

**Headers:**
```
Authorization: Bearer your-cron-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Data collection completed",
  "stats": {...},
  "totalRecords": 5432,
  "timestamp": "2026-03-06T02:00:00Z"
}
```

## Database Schema

### scraped_parts

```sql
CREATE TABLE scraped_parts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RON',
  part_number TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT,
  source_url TEXT NOT NULL,
  source TEXT NOT NULL,
  oem_code_valid BOOLEAN DEFAULT FALSE,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scraped_parts_brand_model ON scraped_parts(brand, model);
CREATE INDEX idx_scraped_parts_source ON scraped_parts(source);
CREATE INDEX idx_scraped_parts_scraped_at ON scraped_parts(scraped_at);
```

### scraped_vehicles

```sql
CREATE TABLE scraped_vehicles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand, model, source)
);
```

### scraping_stats

```sql
CREATE TABLE scraping_stats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_name TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  status TEXT,
  records_collected INT DEFAULT 0,
  duration_seconds INT,
  executed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure FlareSolverr
3. ✅ Set environment variables
4. ✅ Test API endpoints
5. ✅ Monitor cron jobs
6. ✅ Analyze collected data
7. ✅ Scale to 200 agents

## Support

For issues or questions:
- Check Vercel logs: `vercel logs --follow`
- Check FlareSolverr logs
- Verify database connection
- Test API endpoints manually

---

**Status**: ✅ Ready for Production
**Last Updated**: 2026-03-06
