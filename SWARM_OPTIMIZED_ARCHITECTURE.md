# Optimized Swarm Architecture - Scaled for Speed

**Goal:** Maximize throughput + minimize cost using Kimi's cheap tokens + parallel agent scaling

---

## OPTIMIZATION STRATEGY

### **Key Insights:**
1. **Kimi tokens are cheap** → Use aggressively for batching
2. **Parallel execution** → Run 60+ agents simultaneously
3. **LLM-only-when-needed** → HTML parsing first, Kimi only for ambiguous cases
4. **Batch processing** → 50-100 records per Kimi call (not 1 per call)
5. **Caching everywhere** → Hash-based dedup before any processing

---

## SCALED AGENT COUNTS

### **Original Plan:**
```
Team A (Forums):     10 agents
Team B (Reddit):     10 agents
Team C (Manuals):    10 agents
Team D (OBD):        10 agents
Team E (Blogs):      10 agents
Team F (Videos):     10 agents
─────────────────────────────
Total:               60 agents
```

### **OPTIMIZED PLAN (3x Faster):**
```
Team A (Forums):     30 agents (3x parallel crawlers)
Team B (Reddit):     25 agents (2.5x parallel miners)
Team C (Manuals):    20 agents (2x parallel extractors)
Team D (OBD):        15 agents (1.5x parallel collectors)
Team E (Blogs):      20 agents (2x parallel miners)
Team F (Videos):     20 agents (2x parallel extractors)
─────────────────────────────
Total:               130 agents (2.2x original)

Plus:
Team SD1 (Discovery): 15 agents
Team SD2 (Scoring):   10 agents
Team SD3 (Manager):   3 agents
─────────────────────────────
GRAND TOTAL:         158 agents
```

---

## EXECUTION WAVES (Sequential to Manage Memory)

### **Wave 1: Forums + Reddit (55 agents)**
```
Duration: 4-6 hours
Memory: 1.2 GB
Output: 15,000 repair cases
Dedup rate: ~20%
Final: 12,000 unique records
```

### **Wave 2: Manuals + OBD (35 agents)**
```
Duration: 3-4 hours
Memory: 0.8 GB
Output: 8,000 procedures + 2,000 codes
Dedup rate: ~15%
Final: 8,500 unique records
```

### **Wave 3: Blogs + Videos (40 agents)**
```
Duration: 4-5 hours
Memory: 0.9 GB
Output: 6,000 guides + 2,000 transcripts
Dedup rate: ~25%
Final: 6,400 unique records
```

### **Wave 4: Source Discovery (28 agents)**
```
Duration: 2-3 hours
Memory: 0.5 GB
Output: 500+ new candidate sources
Scoring: Filter to top 100
```

---

## KIMI BATCHING OPTIMIZATION

### **Current Approach (SLOW):**
```
Per record: 1 API call to Kimi
1,000 records = 1,000 API calls
Cost: High
Speed: Slow
```

### **OPTIMIZED Approach (FAST + CHEAP):**
```
Batch 50 records per call:
1,000 records = 20 API calls
Cost: 50x cheaper (per token)
Speed: 50x faster (per record)

Batch format:
{
  "batch": [
    { "id": 1, "html": "...", "target": "torque_specs" },
    { "id": 2, "html": "...", "target": "repair_steps" },
    ...
    { "id": 50, "html": "...", "target": "tools" }
  ]
}

Response:
{
  "results": [
    { "id": 1, "torque_specs": [...], "confidence": 0.92 },
    { "id": 2, "repair_steps": [...], "confidence": 0.88 },
    ...
  ]
}
```

### **Kimi Batching Rules:**
```
1. Batch size: 50 records per call
2. Timeout: 30 seconds per batch
3. Retry: 3x with exponential backoff
4. Fallback: If batch fails, split to 25 + retry
5. Cost tracking: Log tokens per batch
6. Rate limit: 5 batches/min (safe)
```

---

## MEMORY OPTIMIZATION

### **Problem:**
```
130 agents × 10MB each = 1.3 GB
Available: 3.8 GB
Margin: 2.5 GB (safe)
```

### **Solution: Wave-Based Execution**
```
Wave 1: 55 agents (550 MB) + buffers (200 MB) = 750 MB ✅
Wave 2: 35 agents (350 MB) + buffers (150 MB) = 500 MB ✅
Wave 3: 40 agents (400 MB) + buffers (200 MB) = 600 MB ✅
Wave 4: 28 agents (280 MB) + buffers (150 MB) = 430 MB ✅

Max concurrent: 750 MB < 3.8 GB ✅ SAFE
```

---

## PROCESSING PIPELINE (5 LAYERS)

### **Layer 1: Collectors (Parallel Waves)**
```
Input: Seeds from seeds.json
Process:
├─ Fetch URL (with retry + timeout)
├─ Parse HTML (regex + DOM)
├─ Extract targets (heuristics first)
├─ If incomplete → batch for Kimi
└─ Output: raw_records.jsonl

Throughput: 100-200 records/agent/hour
Total: 15,000-30,000 records/wave
```

### **Layer 2: Normalizers (Streaming)**
```
Input: raw_records.jsonl
Process:
├─ Map to unified schema
├─ Validate fields
├─ Calculate confidence (rules-based)
├─ Add metadata (source_domain, timestamp)
└─ Output: normalized_records.jsonl

Throughput: 500-1000 records/sec
Total: 27,000 records in ~30 seconds
```

### **Layer 3: Deduplicators (2-Pass)**
```
Pass 1 (Hash-based, no LLM):
├─ Hash by content
├─ Hash by normalized fields
├─ Exact match dedup
└─ Output: deduplicated_pass1.jsonl

Pass 2 (Semantic, batch Kimi):
├─ Group by (make, model, engine, error_code)
├─ Batch similar candidates (50 per call)
├─ Kimi compares: "Are these duplicates?"
├─ Merge clusters
└─ Output: deduplicated_final.jsonl

Dedup rate: 20-30% (expected)
Final count: 18,900-21,600 records
```

### **Layer 4: Validators (Streaming)**
```
Input: deduplicated_final.jsonl
Process:
├─ Check required fields
├─ Validate torque specs (evidence-based)
├─ Detect contradictions (batch Kimi)
├─ Mark outliers
├─ Output: production_ready.jsonl + contradictions.jsonl

Validation rate: 85-95% pass
Final count: 16,065-20,520 records
```

### **Layer 5: DB Writers (Idempotent Upserts)**
```
Input: production_ready.jsonl
Process:
├─ Batch insert (100 records/batch)
├─ Upsert by canonical_key
├─ Update RSI aggregation
├─ Log metrics
└─ Output: import_report.md

Throughput: 1000-2000 records/sec
Total: 16,065-20,520 records in 10-20 seconds
```

---

## KIMI USAGE STRATEGY

### **When to Use Kimi (Batch):**
1. **Incomplete extraction** (missing critical fields after heuristics)
2. **Ambiguous dedup** (borderline similarity, need semantic comparison)
3. **Contradiction detection** (conflicting torque values, repair actions)
4. **Language translation** (normalize non-English fields)
5. **Confidence scoring** (when rules can't determine)

### **When NOT to Use Kimi:**
1. ✅ HTML parsing (regex + DOM)
2. ✅ Field extraction (heuristics + rules)
3. ✅ Hash dedup (exact matches)
4. ✅ Schema validation (format checks)
5. ✅ Database operations (SQL)

### **Kimi Batching Example:**
```
Batch 50 incomplete records:
{
  "batch": [
    {
      "id": 1,
      "html": "<div>Replace spark plugs...</div>",
      "target": "repair_steps",
      "context": "2020 Honda Civic P0300"
    },
    ...
  ]
}

Kimi Response (50 results in 1 call):
{
  "results": [
    {
      "id": 1,
      "repair_steps": [
        "Remove engine cover",
        "Locate spark plugs",
        "Replace with OEM parts",
        "Test engine"
      ],
      "confidence": 0.92
    },
    ...
  ]
}

Cost: ~5000 tokens for 50 records = 100 tokens/record
Speed: 50 records in 3 seconds = 16.7 records/sec
```

---

## DAILY TARGETS (With Optimization)

### **Day 1: Forums + Reddit**
```
Collectors: 55 agents
Duration: 6 hours
Raw output: 15,000 records
After dedup: 12,000 unique
After validation: 10,200 production-ready
Kimi calls: 50 (for incomplete/ambiguous)
Kimi tokens: ~250,000 (cheap!)
```

### **Day 2: Manuals + OBD**
```
Collectors: 35 agents
Duration: 4 hours
Raw output: 10,000 records
After dedup: 8,500 unique
After validation: 7,225 production-ready
Kimi calls: 30
Kimi tokens: ~150,000
```

### **Day 3: Blogs + Videos**
```
Collectors: 40 agents
Duration: 5 hours
Raw output: 8,000 records
After dedup: 6,000 unique
After validation: 5,100 production-ready
Kimi calls: 25
Kimi tokens: ~125,000
```

### **Day 4: Source Discovery**
```
Discovery: 28 agents
Duration: 3 hours
Candidates found: 500+
Scored: 100 new sources
Added to seeds.json
```

### **Day 5: Normalization + Dedup + Validation**
```
Process all collected data
Total input: 33,000 records
After dedup: 26,500 unique
After validation: 22,525 production-ready
Kimi calls: 100 (semantic dedup + contradictions)
Kimi tokens: ~500,000
```

### **TOTAL (5 Days):**
```
Raw records collected: 33,000
Unique records: 26,500
Production-ready: 22,525
Kimi calls: 205
Kimi tokens: ~1,025,000 (very cheap!)
Cost: ~$2-3 (Kimi is cheap!)
```

---

## AGENT ORCHESTRATION

### **Agent Pool Manager:**
```
Manages:
├─ Agent lifecycle (spawn, monitor, kill)
├─ Task queue (FIFO)
├─ Retry logic (exponential backoff)
├─ Memory monitoring (kill if > 100MB)
├─ Timeout handling (30s per task)
└─ Metrics collection

Spawning:
├─ Wave 1: Spawn 55 agents, wait for completion
├─ Wave 2: Spawn 35 agents, wait for completion
├─ Wave 3: Spawn 40 agents, wait for completion
├─ Wave 4: Spawn 28 agents, wait for completion
└─ Normalizers: Run sequentially (streaming)
```

### **Checkpoint System:**
```
Save state every:
├─ 1000 records processed
├─ Every hour
├─ On error (for resume)

Resume capability:
├─ Skip already processed URLs
├─ Skip already deduplicated records
├─ Continue from last checkpoint
└─ No data loss
```

---

## MONITORING & METRICS

### **Real-Time Dashboard:**
```
Per wave:
├─ Agents running: 55/55
├─ Records processed: 12,450/15,000
├─ Throughput: 2,075 rec/min
├─ Dedup rate: 22%
├─ Memory usage: 750 MB / 3.8 GB
├─ Kimi calls: 45/50 (daily budget)
├─ ETA: 3.2 hours remaining

Cumulative:
├─ Total records: 22,525
├─ Total unique: 18,900
├─ Total Kimi tokens: 625,000
├─ Total cost: ~$1.50
└─ Uptime: 99.8%
```

### **Daily Report:**
```
Date: 2026-03-05
Wave: 1 (Forums + Reddit)

Summary:
├─ Records collected: 15,000
├─ Records unique: 12,000
├─ Records valid: 10,200
├─ Dedup rate: 20%
├─ Validation pass rate: 85%
├─ Kimi calls: 50
├─ Kimi tokens: 250,000
├─ Cost: $0.50
├─ Duration: 6 hours
├─ Throughput: 2,500 rec/hour

Top sources:
├─ Bimmerpost: 2,500 records
├─ VWVortex: 2,200 records
├─ r/MechanicAdvice: 1,800 records
├─ r/Cartalk: 1,500 records
└─ ...

Errors:
├─ Timeouts: 2 (0.01%)
├─ Parse errors: 5 (0.03%)
├─ Network errors: 1 (0.01%)
└─ Total errors: 8 (0.05%)

Next steps:
├─ Continue Wave 2 tomorrow
├─ Add 2 new sources from discovery
└─ Optimize parser for Bimmerpost
```

---

## COST ANALYSIS

### **Kimi Tokens (5 Days):**
```
Day 1: 250,000 tokens = $0.50
Day 2: 150,000 tokens = $0.30
Day 3: 125,000 tokens = $0.25
Day 4: 100,000 tokens = $0.20
Day 5: 500,000 tokens = $1.00
─────────────────────────────
Total: 1,125,000 tokens = $2.25

Per record: $2.25 / 22,525 = $0.0001/record
```

### **Comparison:**
```
Without batching:
├─ 22,525 records × 1 API call each
├─ Cost: ~$50-100
└─ Speed: 6-12 hours

With batching (50 per call):
├─ 450 API calls
├─ Cost: ~$2.25
└─ Speed: 5 hours

Savings: 95% cost reduction! 🎉
```

---

## NEXT STEPS

1. **Implement Agent Pool Manager** (spawn/monitor/kill)
2. **Implement Wave-Based Execution** (sequential waves)
3. **Implement Kimi Batch Processor** (50 records per call)
4. **Implement Checkpoint System** (resume capability)
5. **Implement Monitoring Dashboard** (real-time metrics)
6. **Deploy 158 agents** (start Wave 1)
7. **Monitor & optimize** (daily reports)

---

## EXPECTED RESULTS (5 Days)

```
✅ 22,525 production-ready records
✅ 26,500 unique records
✅ 95% cost reduction
✅ 5x speed improvement
✅ 99.8% uptime
✅ Full traceability (source + evidence)
✅ RSI metrics calculated
✅ Ready for MVP launch
```

---

**Ready to deploy 158 agents? 🚀**
