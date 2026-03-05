# ARCHITECTURE DECISION: Vector Search + Product-Orchestrator

## OPTION ANALYSIS

### OPTION A: Separate PostgreSQL + pgvector (Recommended ✅)
**Setup:** Keep MySQL app DB + add managed PostgreSQL with pgvector
- **Risk:** Low (isolated, no app changes)
- **Engineering:** Medium (new DB, ingestion worker, API layer)
- **Cost:** $15-30/month (managed Postgres)
- **Scalability:** Excellent (pgvector is production-ready)
- **Time-to-MVP:** 1-2 days
- **Verdict:** BEST for your constraints

### OPTION B: Vector Search as Service (Pinecone/Weaviate)
**Setup:** Keep MySQL + use external vector DB
- **Risk:** Medium (vendor lock-in, API dependency)
- **Engineering:** Low (API integration only)
- **Cost:** $20-100/month (pay-per-query)
- **Scalability:** Good (but vendor-dependent)
- **Time-to-MVP:** 1 day
- **Verdict:** Simpler but less control, higher long-term cost

### OPTION C: In-Memory Vector Search (Milvus/Qdrant)
**Setup:** Self-hosted vector DB on VPS
- **Risk:** High (operational overhead, self-managed)
- **Engineering:** High (deployment, monitoring, backups)
- **Cost:** $5-10/month (but requires DevOps)
- **Scalability:** Good (but requires scaling expertise)
- **Time-to-MVP:** 2-3 days
- **Verdict:** Overkill for MVP, adds complexity

---

## 🏆 CHOSEN: OPTION A (Separate PostgreSQL + pgvector)

### JUSTIFICATION
1. **Lowest Risk:** Completely isolated from MySQL app DB
2. **Fastest MVP:** Proven stack (pgvector is battle-tested)
3. **Best ROI:** Managed Postgres = no DevOps burden
4. **Future-Proof:** Can migrate app DB later without pressure
5. **Cost-Effective:** $15-30/month vs. $100+/month for SaaS

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    100-Agent Kimi Swarm                 │
│                  (Running NON-STOP)                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                    JSONL Files (append-only)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
   ┌─────────────┐                  ┌──────────────────┐
   │  MySQL DB   │                  │ PostgreSQL + pgvector
   │  (App Data) │                  │ (Knowledge Base)
   │             │                  │                  │
   │ - users     │                  │ - vehicles       │
   │ - cases     │                  │ - dtc_codes      │
   │ - feedback  │                  │ - procedures     │
   │ - telemetry │                  │ - embeddings     │
   └─────────────┘                  │ - evidence       │
        ▲                            │ - sources        │
        │                            └──────────────────┘
        │                                     ▲
        │                                     │
        │            ┌────────────────────────┘
        │            │
        │      ┌─────────────────────────┐
        │      │ Ingestion Worker        │
        │      │ (tails JSONL, upserts)  │
        │      └─────────────────────────┘
        │                 │
        │      ┌──────────┴──────────┐
        │      │                     │
        ▼      ▼                     ▼
   ┌──────────────────────────────────────────┐
   │   Product-Orchestrator API (Node/TS)     │
   │                                          │
   │  POST /diagnose   (semantic search)      │
   │  POST /parts      (supplier lookup)      │
   │  POST /estimate   (time + cost)          │
   │  POST /case       (store outcomes)       │
   │                                          │
   │  + Redis + BullMQ (rate limiting, jobs)  │
   └──────────────────────────────────────────┘
```

---

## IMPLEMENTATION CHECKLIST

- [ ] 1. Provision managed PostgreSQL + enable pgvector
- [ ] 2. Create KB schema (vehicles, dtc, procedures, embeddings)
- [ ] 3. Build ingestion worker (JSONL → Postgres)
- [ ] 4. Setup Redis + BullMQ (rate limiting)
- [ ] 5. Build Product-Orchestrator API (4 endpoints)
- [ ] 6. Add vector search service (OpenAI embeddings)
- [ ] 7. Docker-compose for worker + API + Redis
- [ ] 8. Deployment runbook (VPS setup)
- [ ] 9. Demo end-to-end with sample data
- [ ] 10. Monitor + log token usage

---

## DEPLOYMENT TIMELINE

**Day 1 (4-6 hours):**
- Provision PostgreSQL + apply schema
- Build ingestion worker
- Setup Redis + BullMQ
- Build Product-Orchestrator API

**Day 2 (2-4 hours):**
- Docker-compose + deployment
- End-to-end testing
- Monitoring setup
- Go live

---

## RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Swarm stops | Ingestion worker is independent; won't affect swarm |
| App breaks | MySQL untouched; API is new service |
| Vector search fails | Fallback to keyword search (no embeddings) |
| Rate limiting bugs | BullMQ has built-in retry + dead-letter queue |
| Postgres goes down | Managed service = automatic backups + failover |

---

## COST BREAKDOWN (Monthly)

| Component | Cost | Notes |
|-----------|------|-------|
| PostgreSQL (managed) | $15-30 | 2GB RAM, 10GB storage |
| Redis (managed) | $5-10 | 128MB, basic tier |
| OpenAI embeddings | $0.02/1K tokens | ~$5-10 for 250K procedures |
| VPS (optional) | $5-20 | If self-hosting worker |
| **TOTAL** | **$25-70** | Scales linearly with data |

---

## SUCCESS METRICS

- ✅ Swarm continues running (no interruption)
- ✅ App continues working (no downtime)
- ✅ /diagnose returns results in <500ms
- ✅ Vector search accuracy >80% (relevance)
- ✅ Rate limiter enforces 5 req/min (no burst)
- ✅ Token usage logged (cost tracking)
- ✅ Deploy in <2 days

