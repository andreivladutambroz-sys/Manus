# SOURCE SMOKE TEST PLAN

## Objective
Safely validate 68 candidate sources before full-scale data collection. Measure yield, acceptance rate, and traceability without aggressive crawling or ToS violations.

---

## Phase 1: Pre-Test Compliance Check (2 hours)

### 1.1 robots.txt Analysis
For each P0/P1 source:
- Fetch `/robots.txt`
- Check `Disallow:` rules
- Verify `User-Agent: *` allowances
- Document `Crawl-Delay` if present

### 1.2 ToS Review
- Confirm no explicit scraping prohibition
- Verify no login/paywall for target pages
- Check rate-limiting requirements

### 1.3 Source Categorization
```
Category         | Collector Type      | Fetch Method
─────────────────┼─────────────────────┼──────────────────────
forum            | forum_collector     | HTTP GET + Cheerio
blog             | blog_collector      | HTTP GET + Cheerio
dtc_database     | dtc_collector       | HTTP GET + Cheerio
community_QA     | reddit_api          | Reddit API v1
manual_library   | blog_collector      | HTTP GET (limited)
```

---

## Phase 2: Smoke Test Execution (6-8 hours)

### 2.1 Test Parameters
```
Max pages per domain:     10
Rate limit:               10 requests/min/domain
Timeout per request:      10 seconds
Retry on 429/503:         Yes (exponential backoff)
User-Agent:               Mozilla/5.0 (Windows NT 10.0; Win64; x64)
```

### 2.2 Test Sequence

For each P0 source (28 sources):

#### Step 1: Connectivity Test
```bash
curl -I -H "User-Agent: Mozilla/5.0" https://domain.com
→ Expected: 200-399 status
→ Record: response_time, status_code
```

#### Step 2: Fetch Sample Pages (3-5 pages per source)
```bash
curl -H "User-Agent: Mozilla/5.0" https://domain.com/sample-page
→ Store raw_html
→ Record: fetch_time, content_length, charset
```

#### Step 3: Extract Records
```
For each page:
  1. Parse HTML with Cheerio
  2. Extract: vehicle_make, vehicle_model, error_code, symptoms, repair_steps
  3. Count: raw_extracted, accepted, rejected
  4. Measure: extraction_confidence, field_completeness
```

#### Step 4: Validate Records
```
For each extracted record:
  1. Check: no "Unknown" values
  2. Check: valid OBD-II code (P0000-P9999)
  3. Check: 2+ symptoms
  4. Check: 3+ repair steps
  5. Count: validation_pass, validation_fail
```

#### Step 5: Traceability Check
```
For each accepted record:
  1. Store: source_url, page_title, extraction_timestamp
  2. Store: evidence_snippet (20-50 chars from page)
  3. Verify: can re-fetch and locate snippet
```

### 2.3 Metrics Collection

**Per-Domain Metrics:**
```json
{
  "domain": "bimmerfest.com",
  "test_date": "2026-03-06T23:00:00Z",
  "connectivity": {
    "status": "ok",
    "response_time_ms": 245,
    "http_status": 200
  },
  "pages_fetched": 5,
  "raw_records_extracted": 47,
  "records_validated": 45,
  "records_rejected": 2,
  "acceptance_rate": 0.957,
  "avg_extraction_confidence": 0.89,
  "avg_field_completeness": 0.94,
  "traceability_rate": 1.0,
  "avg_fetch_time_ms": 320,
  "rate_limit_hits": 0,
  "errors": [],
  "recommendation": "PROCEED"
}
```

**Aggregated Metrics:**
```json
{
  "test_run_id": "smoke-test-001",
  "test_date": "2026-03-06",
  "sources_tested": 28,
  "total_pages_fetched": 140,
  "total_raw_records": 1247,
  "total_validated": 1189,
  "total_rejected": 58,
  "overall_acceptance_rate": 0.953,
  "sources_ready_p0": 26,
  "sources_ready_p1": 22,
  "sources_blocked": 0,
  "sources_low_yield": 2,
  "estimated_full_run_yield": 35000,
  "estimated_full_run_duration_hours": 18
}
```

---

## Phase 3: Decision Criteria

### 3.1 Per-Source Thresholds

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| **Acceptance Rate** | > 85% | 70-85% | < 70% |
| **Extraction Confidence** | > 0.80 | 0.65-0.80 | < 0.65 |
| **Traceability Rate** | 100% | 90-99% | < 90% |
| **Avg Fetch Time** | < 500ms | 500-1000ms | > 1000ms |
| **Rate Limit Hits** | 0 | 1-3 | > 3 |

### 3.2 Source Status
```
PROCEED:          All metrics pass
PROCEED_CAUTION:  1-2 metrics in warn zone
INVESTIGATE:      1+ metrics fail, but not critical
BLOCK:            Multiple failures or ToS violation
```

### 3.3 Aggregated Go/No-Go Decision
```
GO if:
  - Overall acceptance rate > 90%
  - Blocked sources = 0
  - Low-yield sources < 3
  - Estimated yield > 30,000 records

NO-GO if:
  - Overall acceptance rate < 80%
  - Blocked sources > 2
  - Low-yield sources > 5
```

---

## Phase 4: Adjustment & Rollout (2 hours)

### 4.1 Tuning
If acceptance rate 80-90%:
- Adjust extraction regex for top 5 sources
- Re-test with new regex
- Document changes

### 4.2 Collector Optimization
For each source:
- Set `rate_limit_ms` = avg_fetch_time * 2
- Set `retry_count` = 2 if rate_limit_hits > 0
- Set `timeout_ms` = avg_fetch_time + 2000

### 4.3 Full-Scale Rollout
```
Timeline:
  Wave 1 (P0 sources):  Start immediately
  Wave 2 (P1 sources):  After Wave 1 completes
  Wave 3 (P2 sources):  Optional, low priority
```

---

## Phase 5: Monitoring & Abort Criteria

### 5.1 Real-Time Monitoring
```
Check every 30 minutes:
  - HTTP error rate (target: < 5%)
  - Acceptance rate (target: > 85%)
  - Rate limit hits (target: 0)
  - Average extraction confidence (target: > 0.80)
```

### 5.2 Abort Conditions
```
STOP if:
  - 3+ consecutive domains return 0 records
  - HTTP error rate > 20%
  - Rate limit hits > 10 per domain
  - Acceptance rate drops below 70%
  - ToS violation detected
```

### 5.3 Recovery
```
On abort:
  1. Stop all collectors
  2. Wait 1 hour
  3. Reduce rate limit by 50%
  4. Restart with reduced batch size
  5. Monitor for 2 hours before resuming
```

---

## Deliverables

### 5.1 Smoke Test Report
```
/home/ubuntu/mechanic-helper/SMOKE_TEST_RESULTS.json
- Per-domain metrics
- Aggregated metrics
- Go/No-Go decision
- Tuning recommendations
```

### 5.2 Collector Configuration
```
/home/ubuntu/mechanic-helper/COLLECTOR_CONFIG_V1.json
- Rate limits per domain
- Retry policies
- Timeout values
- Extraction regex patterns
```

### 5.3 Execution Log
```
/tmp/smoke-test-execution.log
- Timestamp, domain, pages, records, acceptance_rate
- Errors and warnings
- Rate limit events
```

---

## Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Pre-Test | 2h | 23:00 | 01:00 |
| Smoke Test (P0) | 4h | 01:00 | 05:00 |
| Smoke Test (P1) | 3h | 05:00 | 08:00 |
| Analysis | 1h | 08:00 | 09:00 |
| **TOTAL** | **10h** | **23:00** | **09:00** |

---

## Success Criteria

✅ **Smoke test passes if:**
1. ≥ 26/28 P0 sources ready to proceed
2. Overall acceptance rate ≥ 90%
3. Zero ToS violations detected
4. Estimated full-run yield ≥ 30,000 records
5. All metrics documented and reviewed

✅ **Ready for full-scale collection if all criteria met**

---

## Notes

- **Rate Limiting:** Respect `Crawl-Delay` in robots.txt
- **User-Agent:** Always identify as bot: `MechanicHelper-Bot/1.0`
- **Caching:** Store raw HTML for 24h to avoid re-fetching
- **Logging:** Log every request for audit trail
- **Escalation:** Notify on any 403/429 responses
