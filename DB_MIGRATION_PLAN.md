# Database Migration Plan - Preserve Full JSONL Structure

**Objective:** Maintain diagnostic accuracy while preserving complete data structure  
**Timeline:** 1 week  
**Risk Level:** LOW (non-breaking, additive changes)  
**Rollback Plan:** Keep existing knowledgeBase table intact

---

## 1. CURRENT STATE

### Existing Table: knowledgeBase (116,594 records)
```sql
CREATE TABLE knowledgeBase (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand VARCHAR(50) NOT NULL,
  engine VARCHAR(100),
  errorCode VARCHAR(20),
  problem TEXT,
  probableCause TEXT,
  solution TEXT,
  repairTime VARCHAR(50),
  frequency VARCHAR(20),
  estimatedCost DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Limitations:**
- ❌ Symptoms stored as text (not queryable)
- ❌ Repair procedures stored as text (not structured)
- ❌ Tools stored as text (not indexed)
- ❌ Torque specs stored as text (not structured)
- ❌ No JSON fields for complex data
- ❌ No full JSONL preservation

**Current Use:**
- ✅ Bayesian model training
- ✅ Basic search by error code
- ✅ Basic search by vehicle

---

## 2. NEW TABLE: knowledgeBase_raw

### Schema Design
```sql
CREATE TABLE knowledgeBase_raw (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_key VARCHAR(100) UNIQUE,
  
  -- Vehicle Information (searchable)
  make VARCHAR(50),
  model VARCHAR(100),
  year INT,
  engine VARCHAR(100),
  engine_code VARCHAR(50),
  
  -- Error Code Information (searchable)
  error_code VARCHAR(20),
  system VARCHAR(100),
  description TEXT,
  
  -- Structured JSON Fields (queryable)
  symptoms_json LONGTEXT,
  repair_procedures_json LONGTEXT,
  tools_json LONGTEXT,
  torque_json LONGTEXT,
  
  -- Metadata
  confidence DECIMAL(3,2),
  source_url TEXT,
  
  -- Complete Record (for archival)
  raw_json LONGTEXT,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_error_code (error_code),
  INDEX idx_make_model (make, model),
  INDEX idx_year (year),
  UNIQUE KEY record_key (record_key)
);
```

**Advantages:**
- ✅ Preserves complete JSONL structure in raw_json
- ✅ Denormalized searchable fields (make, model, year, error_code)
- ✅ Structured JSON fields for complex queries
- ✅ Unique record_key prevents duplicates
- ✅ Backward compatible (doesn't affect knowledgeBase)
- ✅ Supports advanced filtering and aggregation

---

## 3. MIGRATION STEPS

### Step 1: Create New Table (DONE ✅)
```bash
# Already executed
mysql> CREATE TABLE knowledgeBase_raw (...)
```

**Status:** ✅ COMPLETE

---

### Step 2: Import JSONL to knowledgeBase_raw (IN PROGRESS)

**Script:** `scripts/import-jsonl-to-raw.mjs`

**Process:**
```
1. Read knowledge-base/knowledge-base-structured.jsonl
2. For each record:
   - Generate unique record_key (MD5 hash of vehicle + error code)
   - Extract vehicle fields (make, model, year, engine, engine_code)
   - Extract error code fields (code, system, description)
   - Convert arrays to JSON (symptoms, procedures, tools, torque)
   - Preserve confidence score
   - Store complete record in raw_json
3. Batch insert (100 records/batch)
4. Handle duplicates (ON DUPLICATE KEY UPDATE)
```

**Expected Results:**
- Input: 102,433 JSONL records
- Output: ~100,000 unique records (after deduplication)
- Duration: ~80-100 seconds
- Throughput: 1,000-1,300 records/sec

**Current Status:**
```
✅ 9,700+ records imported (running)
⏱️  Estimated completion: 80-100 seconds total
```

---

### Step 3: Verify Data Integrity

**Queries to run after import:**

```sql
-- Check total records
SELECT COUNT(*) as total_records FROM knowledgeBase_raw;
-- Expected: ~100,000

-- Check unique error codes
SELECT COUNT(DISTINCT error_code) as unique_codes FROM knowledgeBase_raw;
-- Expected: 61-62

-- Check unique vehicles
SELECT COUNT(DISTINCT CONCAT(make, model, year)) as unique_vehicles 
FROM knowledgeBase_raw;
-- Expected: 700+

-- Check for NULL values
SELECT 
  SUM(IF(make IS NULL, 1, 0)) as null_make,
  SUM(IF(error_code IS NULL, 1, 0)) as null_error_code,
  SUM(IF(raw_json IS NULL, 1, 0)) as null_raw_json
FROM knowledgeBase_raw;
-- Expected: All zeros

-- Check JSON validity
SELECT COUNT(*) as valid_json 
FROM knowledgeBase_raw 
WHERE JSON_VALID(raw_json) = 1;
-- Expected: ~100,000

-- Check confidence distribution
SELECT 
  MIN(confidence) as min_conf,
  MAX(confidence) as max_conf,
  AVG(confidence) as avg_conf,
  STDDEV(confidence) as stddev_conf
FROM knowledgeBase_raw;
-- Expected: min=0.78, max=0.99, avg=0.91, stddev=0.02
```

---

### Step 4: Create Indexes for Performance

```sql
-- Already created during table creation
CREATE INDEX idx_error_code ON knowledgeBase_raw(error_code);
CREATE INDEX idx_make_model ON knowledgeBase_raw(make, model);
CREATE INDEX idx_year ON knowledgeBase_raw(year);
CREATE UNIQUE INDEX idx_record_key ON knowledgeBase_raw(record_key);

-- Optional: Full-text search index
ALTER TABLE knowledgeBase_raw ADD FULLTEXT INDEX ft_description (description);
ALTER TABLE knowledgeBase_raw ADD FULLTEXT INDEX ft_system (system);
```

---

### Step 5: Update Search Queries

**Old queries (knowledgeBase):**
```sql
SELECT * FROM knowledgeBase WHERE errorCode = 'P0420';
```

**New queries (knowledgeBase_raw):**
```sql
-- Search by error code
SELECT * FROM knowledgeBase_raw WHERE error_code = 'P0420';

-- Search by vehicle
SELECT * FROM knowledgeBase_raw 
WHERE make = 'BMW' AND model = '320d' AND year = 2015;

-- Search by error code + vehicle
SELECT * FROM knowledgeBase_raw 
WHERE error_code = 'P0171' AND make = 'BMW' AND model = '320d';

-- Full-text search
SELECT * FROM knowledgeBase_raw 
WHERE MATCH(description) AGAINST('catalyst' IN BOOLEAN MODE);

-- Query JSON fields
SELECT 
  make, model, error_code,
  JSON_EXTRACT(symptoms_json, '$[0]') as first_symptom,
  JSON_EXTRACT(torque_json, '$[0].value_nm') as torque_value
FROM knowledgeBase_raw 
WHERE error_code = 'P0420'
LIMIT 10;
```

---

### Step 6: Update Application Code

**tRPC procedures to update:**

```typescript
// OLD: Using knowledgeBase
export const diagnosticRouter = router({
  diagnose: publicProcedure
    .input(z.object({ errorCode: z.string() }))
    .query(async ({ input }) => {
      const result = await db.query(
        'SELECT * FROM knowledgeBase WHERE errorCode = ?',
        [input.errorCode]
      );
      return result;
    }),
});

// NEW: Using knowledgeBase_raw
export const diagnosticRouter = router({
  diagnose: publicProcedure
    .input(z.object({ 
      make: z.string(),
      model: z.string(),
      year: z.number(),
      errorCode: z.string(),
      symptoms: z.array(z.string())
    }))
    .query(async ({ input }) => {
      const result = await db.query(
        `SELECT * FROM knowledgeBase_raw 
         WHERE error_code = ? AND make = ? AND model = ? AND year = ?`,
        [input.errorCode, input.make, input.model, input.year]
      );
      
      // Parse JSON fields
      return result.map(row => ({
        ...row,
        symptoms: JSON.parse(row.symptoms_json),
        procedures: JSON.parse(row.repair_procedures_json),
        tools: JSON.parse(row.tools_json),
        torque: JSON.parse(row.torque_json),
        raw: JSON.parse(row.raw_json)
      }));
    }),
});
```

---

## 4. DUAL-TABLE STRATEGY

### Why Keep Both Tables?

**knowledgeBase (existing):**
- ✅ Simple, flat structure
- ✅ Fast for basic searches
- ✅ Used by Bayesian model
- ✅ No breaking changes
- ✅ Backup/fallback option

**knowledgeBase_raw (new):**
- ✅ Preserves complete JSONL structure
- ✅ Enables advanced queries
- ✅ Supports JSON field queries
- ✅ Better for Phase 2 (parts integration)
- ✅ Enables complex filtering

### Query Strategy

```
User Input: BMW 320d 2015, P0171, symptoms=[...]
  ↓
Search knowledgeBase_raw (new)
  - Filter by make, model, year, error_code
  - Parse JSON fields
  - Return structured results
  ↓
Fallback to knowledgeBase (old)
  - If no results in knowledgeBase_raw
  - Simple text search
  ↓
Bayesian Model
  - Uses both tables
  - Calculates probabilities
  - Returns ranked causes
```

---

## 5. MIGRATION TIMELINE

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Create knowledgeBase_raw table | 1 min | ✅ DONE |
| 2 | Import JSONL to knowledgeBase_raw | 90 sec | 🔄 IN PROGRESS |
| 3 | Verify data integrity | 5 min | ⏳ PENDING |
| 4 | Create indexes | 2 min | ⏳ PENDING |
| 5 | Update application code | 30 min | ⏳ PENDING |
| 6 | Test queries & performance | 30 min | ⏳ PENDING |
| 7 | Deploy to production | 10 min | ⏳ PENDING |
| 8 | Monitor & optimize | Ongoing | ⏳ PENDING |

**Total Time:** ~3 hours

---

## 6. PERFORMANCE EXPECTATIONS

### Query Performance (knowledgeBase_raw)

| Query Type | Expected Time | Index Used |
|------------|---------------|-----------|
| By error code | <10ms | idx_error_code |
| By vehicle (make+model+year) | <20ms | idx_make_model, idx_year |
| By error code + vehicle | <15ms | idx_error_code, idx_make_model |
| Full-text search | <50ms | ft_description |
| JSON extraction | <30ms | idx_error_code |

### Storage Requirements

```
knowledgeBase: ~50 MB (116,594 records)
knowledgeBase_raw: ~200 MB (100,000 records + JSON fields)
Total: ~250 MB

Indexes: ~30 MB
Total with indexes: ~280 MB
```

---

## 7. ROLLBACK PLAN

If issues occur, rollback is simple:

```sql
-- Option 1: Drop new table (revert to old)
DROP TABLE knowledgeBase_raw;

-- Option 2: Truncate and reimport
TRUNCATE TABLE knowledgeBase_raw;

-- Option 3: Use old queries
-- Just switch back to knowledgeBase in application code
```

**Estimated Rollback Time:** <5 minutes

---

## 8. PHASE 2 PREPARATION

### Why This Structure Matters for Phase 2

**knowledgeBase_raw enables:**

1. **Parts Integration:**
   - Store OEM part numbers in raw_json
   - Link parts to repair procedures
   - Query parts by error code + vehicle

2. **Compatibility Matrix:**
   - Store part compatibility data
   - Query which parts work with which vehicles
   - Build cross-reference tables

3. **Advanced Analytics:**
   - Aggregate repair success rates
   - Track which procedures are most effective
   - Identify regional variations

4. **Community Features:**
   - Store user feedback in raw_json
   - Track repair outcomes
   - Build reputation system

---

## 9. CHECKLIST

- [ ] Create knowledgeBase_raw table
- [ ] Import JSONL data (102,433 records)
- [ ] Verify data integrity (all records imported)
- [ ] Create indexes for performance
- [ ] Update tRPC procedures
- [ ] Update frontend queries
- [ ] Test all diagnostic endpoints
- [ ] Performance testing (response times <100ms)
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] Archive old queries (keep for reference)

---

## 10. SUCCESS CRITERIA

✅ **Migration successful when:**
- All 102,433 JSONL records imported to knowledgeBase_raw
- 100% data integrity (no NULL values in critical fields)
- All JSON fields valid and queryable
- Query performance <100ms for all searches
- Zero breaking changes to existing knowledgeBase
- All tRPC endpoints working with new table
- Bayesian model accuracy maintained (>91%)

---

## CONCLUSION

This migration plan:
- ✅ Preserves complete JSONL structure
- ✅ Enables advanced queries for Phase 2
- ✅ Maintains backward compatibility
- ✅ Adds zero risk (non-breaking changes)
- ✅ Improves query performance
- ✅ Prepares for parts integration

**Ready to execute. No blocking issues.**
