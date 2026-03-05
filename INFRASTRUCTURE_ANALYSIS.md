# Infrastructure Analysis - Mechanic Helper Swarm Data Collection

**Date:** March 5, 2026  
**Purpose:** Assess storage, database, and compute resources for autonomous swarm data collection

---

## 1. SANDBOX DISK SPACE

### Current Usage
```
Filesystem: /dev/root
Total:      42 GB
Used:       13 GB (31%)
Available:  29 GB (69%)
Inodes:     1,055,920 total
Used:       332,676 (32%)
Free:       723,244 (68%)
```

### Current Project Size
```
/home/ubuntu/mechanic-helper:  932 MB
├─ knowledge-base/             153 MB
│  └─ knowledge-base-structured.jsonl  153 MB (102,433 records)
├─ node_modules/               ~600 MB
├─ .next/                       ~100 MB
└─ other files/                 ~79 MB
```

### Storage Capacity Assessment

**Available for new data:** 29 GB

**Projected needs for swarm:**
```
Collectors output (raw HTML/JSON):
├─ Forum posts (100k pages × 50KB avg)      = 5 GB
├─ Reddit threads (50k threads × 30KB avg)  = 1.5 GB
├─ Service manuals (10k docs × 200KB avg)   = 2 GB
├─ OBD databases (5k pages × 20KB avg)      = 100 MB
├─ Blog articles (20k articles × 40KB avg)  = 800 MB
└─ Video transcripts (1k videos × 100KB avg)= 100 MB
   TOTAL RAW DATA:                          ~9.5 GB

Normalized JSONL (deduplicated):
├─ Repair cases (200k records × 2KB)        = 400 MB
├─ Service procedures (100k × 3KB)          = 300 MB
├─ Torque specs (10k × 1KB)                 = 10 MB
├─ Tools (50k × 0.5KB)                      = 25 MB
└─ OBD codes (5k × 2KB)                     = 10 MB
   TOTAL NORMALIZED:                        ~745 MB

Cache files:
├─ URL hashes                               = 50 MB
├─ Content hashes                           = 50 MB
├─ Embeddings (if used)                     = 500 MB
   TOTAL CACHE:                             ~600 MB

TOTAL PROJECTED:                            ~10.8 GB
```

**✅ VERDICT: SUFFICIENT SPACE**
- Available: 29 GB
- Needed: 10.8 GB
- Safety margin: 18.2 GB (62% remaining)

---

## 2. SUPABASE MYSQL DATABASE

### Current Tables & Size
```
knowledgeBase:           25.64 MB (100,000 rows)
knowledgeBase_raw:       0.02 MB (477 rows) ← needs fixing
models:                  0.03 MB (700 rows)
vehicleMotorizations:    0.01 MB (206 rows)
manufacturers:           0.00 MB (20 rows)
vehicles:                0.00 MB (13 rows)
diagnostics:             0.00 MB (11 rows)
notifications:           0.00 MB (11 rows)
[other empty tables]:    0.00 MB

TOTAL CURRENT:           ~26 MB
```

### Database Limits (TiDB Serverless)
```
Storage:     Default 5 GB free tier
            Can scale to 100+ GB with paid plan
Connections: 100 concurrent connections
QPS:         10,000 requests/second
```

### Projected Database Growth

**New tables needed:**
```
repair_cases:
├─ 200,000 records × 2 KB per record = 400 MB
├─ Indexes (make, model, error_code) = 50 MB
└─ Total: 450 MB

service_procedures:
├─ 100,000 records × 3 KB = 300 MB
├─ Indexes = 30 MB
└─ Total: 330 MB

torque_specifications:
├─ 10,000 records × 1 KB = 10 MB
├─ Indexes = 5 MB
└─ Total: 15 MB

tools_required:
├─ 50,000 records × 0.5 KB = 25 MB
├─ Indexes = 5 MB
└─ Total: 30 MB

source_registry:
├─ 500 sources × 2 KB = 1 MB
├─ Indexes = 0.5 MB
└─ Total: 1.5 MB

repair_outcomes (RSI):
├─ 500,000 records × 1 KB = 500 MB
├─ Indexes (make, model, code, action) = 100 MB
└─ Total: 600 MB

repair_feedback:
├─ 100,000 records × 1 KB = 100 MB
├─ Indexes = 20 MB
└─ Total: 120 MB

TOTAL NEW TABLES:        ~1.5 GB
TOTAL WITH EXISTING:     ~1.53 GB
```

**✅ VERDICT: SUFFICIENT DATABASE SPACE**
- Current usage: 26 MB
- Projected: 1.53 GB
- Free tier limit: 5 GB
- Safety margin: 3.47 GB (68% remaining)
- **If needed: Can upgrade to paid plan for 100+ GB**

---

## 3. COMPUTE RESOURCES

### Available CPU & Memory
```
CPUs:        6 cores available
Memory:      3.8 GB total
             1.6 GB used
             2.0 GB available
Swap:        2.0 GB (867 MB used)
```

### Swarm Parallel Execution

**Recommended configuration:**
```
Collectors (6 teams × 10-20 agents):
├─ Team A (Forums):       15 agents × 50MB each = 750 MB
├─ Team B (Reddit):       10 agents × 40MB each = 400 MB
├─ Team C (Manuals):      12 agents × 60MB each = 720 MB
├─ Team D (OBD):          8 agents × 30MB each  = 240 MB
├─ Team E (Blogs):        10 agents × 35MB each = 350 MB
└─ Team F (Videos):       8 agents × 45MB each  = 360 MB
   TOTAL COLLECTORS:      63 agents = ~2.8 GB

Normalizers:             5 agents × 30MB = 150 MB
Deduplicators:           3 agents × 50MB = 150 MB
Validators:              3 agents × 40MB = 120 MB
DB Writers:              2 agents × 30MB = 60 MB
Monitoring/Control:      1 agent × 20MB  = 20 MB

TOTAL MEMORY NEEDED:     ~3.3 GB
AVAILABLE:               ~2.0 GB
```

**⚠️ VERDICT: MEMORY TIGHT - NEED OPTIMIZATION**

### Memory Optimization Strategy

**Option 1: Sequential Processing (Recommended for MVP)**
```
Run collectors in waves:
├─ Wave 1: Teams A, B (25 agents) = 1.2 GB
├─ Wave 2: Teams C, D (20 agents) = 1.0 GB
├─ Wave 3: Teams E, F (18 agents) = 0.8 GB
├─ Normalizers/Dedup (sequential) = 0.3 GB
└─ Total concurrent: ~1.5 GB (safe)
```

**Option 2: Streaming Processing**
```
Process data in chunks:
├─ Collect 100 pages
├─ Normalize + Dedup
├─ Write to DB
├─ Repeat
└─ Memory: ~500 MB constant
```

**Option 3: Upgrade Sandbox**
```
Request larger sandbox:
├─ 8+ GB RAM
├─ 8+ CPU cores
└─ Cost: TBD
```

**Recommendation:** Use **Option 1 (Sequential Waves)** for MVP
- Safe memory usage
- Predictable performance
- Easy to monitor
- Can scale to Option 3 later

---

## 4. NETWORK & API RATE LIMITS

### Outbound Connectivity
```
Status:      ✅ Working
API access:  ✅ Manus API reachable
Database:    ✅ TiDB Cloud reachable
Web access:  ✅ Can fetch external pages
```

### Rate Limiting Strategy

**Per-source limits (to avoid blocking):**
```
Forums (Bimmerpost, etc):
├─ Requests/min: 10
├─ Delay between requests: 6 seconds
├─ Concurrent connections: 2

Reddit:
├─ Requests/min: 30 (within Reddit limits)
├─ Delay: 2 seconds
├─ Concurrent: 3
├─ User-Agent: Required

Service Manuals:
├─ Requests/min: 5
├─ Delay: 12 seconds
├─ Concurrent: 1

OBD Databases:
├─ Requests/min: 20
├─ Delay: 3 seconds
├─ Concurrent: 2

Blogs:
├─ Requests/min: 15
├─ Delay: 4 seconds
├─ Concurrent: 2

YouTube Transcripts:
├─ Requests/min: 10
├─ Delay: 6 seconds
├─ Concurrent: 1
```

**Total safe throughput:**
```
Conservative: 90 requests/min = 1.5 req/sec
Normal:       150 requests/min = 2.5 req/sec
Aggressive:   250 requests/min = 4.2 req/sec
```

**Estimated collection time:**
```
For 200k repair cases:
├─ Conservative: 200,000 / 90 = 2,222 minutes = 37 hours
├─ Normal:       200,000 / 150 = 1,333 minutes = 22 hours
└─ Aggressive:   200,000 / 250 = 800 minutes = 13 hours

Recommended: Run 24/7 for 2-3 days in normal mode
```

---

## 5. STORAGE ARCHITECTURE RECOMMENDATION

### Local Sandbox Storage (for processing)
```
/home/ubuntu/mechanic-helper/
├─ knowledge-base/
│  ├─ raw/                    ← Raw HTML/JSON from collectors
│  ├─ normalized/             ← Normalized JSONL
│  ├─ deduplicated/           ← After dedup
│  ├─ validated/              ← After validation
│  ├─ sources/
│  │  ├─ seeds.json           ← Source list
│  │  ├─ blacklist.json       ← Blocked sources
│  │  └─ cooldown.json        ← Rate-limited sources
│  └─ cache/
│     ├─ url_hashes/          ← URL dedup cache
│     ├─ content_hashes/      ← Content dedup cache
│     └─ embeddings/          ← Semantic embeddings (if used)
├─ logs/
│  ├─ collector-logs/
│  ├─ dedup-logs/
│  ├─ validation-logs/
│  └─ daily-reports/
└─ checkpoints/               ← Resume points
```

### Database Storage (Supabase MySQL)
```
Production tables:
├─ repair_cases              ← 200k records
├─ service_procedures        ← 100k records
├─ torque_specifications     ← 10k records
├─ tools_required            ← 50k records
├─ source_registry           ← 500 sources
├─ repair_outcomes (RSI)     ← 500k records
└─ repair_feedback           ← 100k records

Metadata tables:
├─ import_status             ← Track imports
├─ deduplication_log         ← Dedup decisions
├─ validation_log            ← Quality checks
└─ source_metrics            ← Yield scores
```

### External Storage (Optional - for long-term archive)
```
S3 / Cloud Storage (for backup):
├─ Daily snapshots of JSONL
├─ Compressed archives
└─ Cost: ~$1-5/month for 100 GB
```

---

## 6. FINAL CAPACITY SUMMARY

| Resource | Current | Needed | Available | Status |
|----------|---------|--------|-----------|--------|
| **Disk Space** | 13 GB | 10.8 GB | 29 GB | ✅ OK |
| **Database** | 26 MB | 1.53 GB | 5 GB | ✅ OK |
| **Memory** | 1.6 GB | 1.5 GB (waves) | 2.0 GB | ✅ OK |
| **CPU** | 6 cores | 6 cores (parallel) | 6 cores | ✅ OK |
| **Network** | Active | 2.5 req/sec | Unlimited | ✅ OK |

---

## 7. RECOMMENDATIONS

### ✅ PROCEED WITH SWARM - Infrastructure is ready

**Configuration:**
1. **Use sequential wave processing** (Option 1) to stay within memory limits
2. **Store raw data locally** during collection, then archive to S3 after processing
3. **Use MySQL for production data**, local cache for dedup
4. **Run 24/7 collection** for 2-3 days to gather 200k+ records
5. **Monitor daily** with automated reports

### Scaling Path (if needed later)
```
Phase 1 (MVP):        Current sandbox (3.8 GB RAM)
Phase 2 (Scale):      Upgrade to 8 GB RAM sandbox
Phase 3 (Production): Dedicated VM (32+ GB RAM, 8+ CPUs)
```

### Cost Estimate
```
Current:  Free (Manus sandbox)
Phase 2:  ~$10-20/month (upgraded sandbox)
Phase 3:  ~$50-100/month (dedicated VM)
Database: Free tier (5 GB) → Paid tier (~$20-50/month for 100 GB)
```

---

## 8. NEXT STEPS

1. ✅ **Create database schema** (7 tables)
2. ✅ **Setup source discovery** (seeds.json, scoring)
3. ✅ **Implement collectors** (6 teams, 60+ agents)
4. ✅ **Implement normalizer** (unified JSON)
5. ✅ **Implement deduplicator** (2-pass)
6. ✅ **Implement validator** (quality checks)
7. ✅ **Implement DB writer** (idempotent upserts)
8. ✅ **Launch swarm** (24/7 collection)
9. ✅ **Monitor & report** (daily metrics)

**Estimated time:** 8-12 hours to implement, 48-72 hours to collect 200k+ records

---

**Status: ✅ READY TO PROCEED**
