# Swarm Execution Guide

## Overview

The Mechanic Helper Swarm is a distributed data collection system that gathers automotive repair data from 160+ sources across the internet. It uses 158 AI agents organized into 5 waves to collect, normalize, deduplicate, and validate repair records.

## Architecture

### 5-Wave Execution Plan

| Wave | Name | Agents | Sources | Records | Time | Cost |
|------|------|--------|---------|---------|------|------|
| 1 | Forum Collectors | 30 | 50 | 10,200 | 6h | $1.02 |
| 2 | Reddit + Manuals | 45 | 35 | 7,225 | 4h | $0.72 |
| 3 | Blogs + Videos | 40 | 50 | 5,100 | 5h | $0.51 |
| 4 | OBD + Discovery | 43 | 510 | 3,400 | 3h | $0.34 |
| 5 | Normalize + Dedup | 28 | - | 22,525 | 4h | $2.25 |
| **TOTAL** | | **158** | **160+** | **22,525+** | **22h** | **$2.25** |

### 5-Layer Pipeline

Each record flows through a 5-layer pipeline:

1. **Layer 1: Collection** - Raw data extracted from sources
2. **Layer 2: Normalization** - Standardize format, extract key fields
3. **Layer 3: Deduplication** - Remove duplicate records using content hash
4. **Layer 4: Validation** - Check data quality, confidence scoring
5. **Layer 5: Writing** - Batch insert into database (20 records per batch)

### Agent Teams

| Team | Type | Count | Responsibility |
|------|------|-------|-----------------|
| Team A | Forum Collectors | 30 | Extract repair discussions from automotive forums |
| Team B | Reddit Miners | 25 | Mine r/Cartalk, r/MechanicAdvice, brand-specific subreddits |
| Team C | Manual Extractors | 20 | Extract from service manuals and technical documentation |
| Team D | OBD Collectors | 25 | Collect from OBD databases and diagnostic tools |
| Team E | Blog Miners | 20 | Extract from automotive blogs and repair guides |
| Team F | Video Extractors | 20 | Transcribe and extract from YouTube repair videos |
| Team SD | Source Discovery | 18 | Discover new sources and validate existing ones |

## Data Sources (160+)

### Forums (50+)
- BMW Forums (BimmerPost, E46 Fanatics, F30 Post, M3 Post)
- VW/Audi Forums (VW Vortex, Golf MK7, AudiWorld, A4.net)
- Ford Forums (Ford Muscle, F150 Forum, Focus ST, Mustang 6G)
- Honda/Acura Forums (Civic Forums, Accord Forums, CRX Civic, Acura World)
- Toyota Forums (Corolla Forum, Camry Forum, RAV4 World)
- Nissan Forums (Altima Forum, Maxima Forum, 350Z Forum)
- Mazda Forums (Mazda3 Forum, CX-5 Forum)
- And 20+ more brand-specific forums

### Reddit Communities (35+)
- r/Cartalk (general automotive)
- r/MechanicAdvice (professional mechanics)
- r/BMW, r/Audi, r/Ford, r/Honda, r/Toyota, r/Nissan, r/Mazda
- r/Jeep, r/Subaru, r/Volvo, r/Volkswagen
- r/Trucks, r/Cars, r/Motorcycles
- And 20+ more specialized communities

### Service Manuals & Databases (30+)
- OEM service manuals (PDF archives)
- RepairPal database
- YourMechanic knowledge base
- AllData service manuals
- Mitchell 1 repair procedures
- And 25+ more technical resources

### Automotive Blogs (25+)
- Popular Mechanics
- Car Talk
- Edmunds
- Jalopnik
- Road & Track
- Motor Trend
- And 19+ more automotive blogs

### YouTube Channels (20+)
- ChrisFix
- Scotty Kilmer
- Tavarish
- Hoovies Garage
- And 16+ more repair channels

### OBD Databases (10+)
- NHTSA OBD database
- OBD-II code databases
- Diagnostic trouble code repositories
- And 7+ more technical databases

## Execution Instructions

### Prerequisites

1. **Database**: Supabase MySQL connection (configured in `.env`)
2. **Kimi API**: Access token (configured in `.env`)
3. **Memory**: 8GB RAM available
4. **Disk Space**: 100GB available
5. **Network**: Stable internet connection

### Quick Start

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Launch production swarm
npx tsx server/swarm/launch-production.ts --auto
```

### Monitoring

During execution, monitor progress via:

1. **Monitoring Dashboard** - Real-time metrics at `/api/swarm/dashboard`
2. **Database** - Check `repairCases` table for new records
3. **Logs** - Server logs show wave progress
4. **Metrics Endpoint** - `/api/swarm/metrics` for detailed stats

### Expected Output

After 22 hours of execution:

```
✅ SWARM EXECUTION COMPLETE
- 158 agents deployed across 5 waves
- 160+ sources crawled
- 22,525+ production-ready records collected
- All data validated and deduplicated
- Database updated with new records
- Monitoring dashboard active
- Ready for MVP launch
```

## Data Quality Metrics

### Validation Checks

- **Content Hash**: Detect exact duplicates
- **Normalized Hash**: Detect semantic duplicates
- **Confidence Scoring**: 0-1 score for record reliability
- **Evidence Quality**: 0-1 score for supporting evidence
- **Source Reliability**: 0-1 score for source trustworthiness

### Expected Quality

- **Success Rate**: 95%+
- **Average Confidence**: 0.85+
- **Deduplication Rate**: 15-20%
- **Validation Pass Rate**: 98%+

## Database Schema

### repairCases Table

```sql
CREATE TABLE repairCases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vehicleMake VARCHAR(50) NOT NULL,
  vehicleModel VARCHAR(100) NOT NULL,
  vehicleYear INT,
  engine VARCHAR(100),
  engineCode VARCHAR(50),
  errorCode VARCHAR(20),
  errorSystem VARCHAR(50),
  errorDescription TEXT,
  symptoms JSON,
  repairAction VARCHAR(255),
  repairPerformed TEXT,
  repairTimeHours DECIMAL(5,2),
  repairCostEstimate DECIMAL(10,2),
  repairCostActual DECIMAL(10,2),
  toolsUsed JSON,
  partsNeeded JSON,
  repairOutcome ENUM('success', 'partial', 'failed', 'unknown'),
  confidence DECIMAL(3,2),
  sourceUrl VARCHAR(500),
  sourceDomain VARCHAR(100),
  sourceType ENUM('forum', 'reddit', 'manual', 'obd', 'blog', 'video'),
  evidenceSnippets JSON,
  evidenceQuality DECIMAL(3,2),
  language VARCHAR(10),
  canonicalKey VARCHAR(255) UNIQUE,
  clusterId VARCHAR(100),
  mergedCount INT DEFAULT 1,
  sourceCount INT DEFAULT 1,
  rawJson TEXT,
  contentHash VARCHAR(64),
  normalizedHash VARCHAR(64),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Issue: Swarm hangs during execution

**Solution**: Check database connection and Kimi API access. Review server logs for errors.

### Issue: High error rate (>5%)

**Solution**: Check source availability. Some sources may be blocked or rate-limited. Errors are automatically retried.

### Issue: Database writes failing

**Solution**: Verify database has sufficient space and connections. Check `max_allowed_packet` setting.

### Issue: Memory usage increasing

**Solution**: Batch size is already optimized (20 records). Monitor system resources.

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Kimi API (22,525 records ÷ 50 per call × $0.005) | $2.25 |
| Database (included in Supabase) | $0.00 |
| Compute (included in Manus Pro) | $0.00 |
| **Total** | **$2.25** |

## Next Steps After Execution

1. **Verify Data**: Query repairCases table to confirm records
2. **Test Diagnostics**: Run diagnostic tests with new data
3. **Validate Quality**: Check confidence scores and evidence quality
4. **Deploy MVP**: Push to production
5. **Monitor Performance**: Track diagnostic accuracy

## Support

For issues or questions:

1. Check monitoring dashboard for real-time metrics
2. Review server logs in `.manus-logs/` directory
3. Verify database connectivity
4. Check Kimi API access and rate limits
5. Contact support if issues persist

## Files

- `server/swarm/swarm-launcher-fixed.ts` - Main orchestrator
- `server/swarm/agent-pool.ts` - Agent lifecycle management
- `server/swarm/wave-executor.ts` - Wave execution logic
- `server/swarm/kimi-batch-processor.ts` - Batch processing
- `server/swarm/pipeline/` - 5-layer pipeline
- `server/swarm/collectors/` - Data collectors
- `server/swarm/source-discovery-expanded.ts` - Source registry
- `server/swarm/launch-production.ts` - Production launcher

---

**Status**: ✅ Ready for Production Deployment
**Last Updated**: 2026-03-05
**Version**: 1.0.0
