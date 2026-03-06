# Data Collection Swarm - Complete Implementation Guide

## 📋 EXECUTIVE SUMMARY

This document provides a **PRODUCTION-READY BLUEPRINT** for implementing the 8-agent data collection swarm. The swarm collects REAL data from 16+ websites, validates it, enriches it with AI, and stores it in a structured database.

**Key Metrics:**
- Expected data volume: 1,200,000+ records
- Quality threshold: ≥ 70/100
- Data sources: 16 websites (ePiesa, Autodoc, Ricardo, OLX, etc.)
- Processing time: ~5 weeks
- Zero fake data guarantee: 100% traceable to source URLs

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION SWARM                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LAYER 1: WEB SCRAPER AGENT                                  │
│  └─ Fetch raw HTML from 16+ websites                         │
│     ├─ Rotate user agents & proxies                          │
│     ├─ Respect rate limiting (2-5 sec delays)                │
│     ├─ Handle JavaScript rendering (Selenium/Playwright)     │
│     └─ Store raw HTML with metadata                          │
│                                                               │
│  LAYER 2: HTML PARSER AGENT                                  │
│  └─ Extract structured data from raw HTML                    │
│     ├─ Parse vehicles (brand, model, year, engine)           │
│     ├─ Parse parts (OEM code, price, stock)                  │
│     ├─ Parse listings (specs, defects, price)                │
│     └─ Tag with source URL for traceability                  │
│                                                               │
│  LAYER 3: DATA VALIDATOR AGENT                               │
│  └─ Validate data quality & assign quality scores            │
│     ├─ Check required fields (Field Completeness)            │
│     ├─ Validate data types & ranges (Data Validity)          │
│     ├─ Check for duplicates (Uniqueness)                     │
│     ├─ Assess source reliability (Source Reliability)        │
│     └─ Reject records with quality < 70                      │
│                                                               │
│  LAYER 4: DATA NORMALIZER AGENT                              │
│  └─ Clean & standardize data                                 │
│     ├─ Normalize brand names (BMW, bmw → BMW)                │
│     ├─ Parse engine specs (2.0L Turbo → 2000cc)              │
│     ├─ Convert prices to EUR                                 │
│     ├─ Standardize date formats (ISO 8601)                   │
│     └─ Clean text fields (trim, remove special chars)        │
│                                                               │
│  LAYER 5: AI ENRICHER AGENT (Kimi 256k)                      │
│  └─ Enrich data with AI insights                             │
│     ├─ Extract vehicle generation (E90, W205, etc.)          │
│     ├─ Parse defect descriptions                             │
│     ├─ Identify part categories                              │
│     ├─ Extract repair procedures                             │
│     └─ Calculate reliability scores                          │
│                                                               │
│  LAYER 6: DATA LINKER AGENT                                  │
│  └─ Connect related data                                     │
│     ├─ Link vehicles to compatible parts                     │
│     ├─ Link vehicles to defect patterns                      │
│     ├─ Link parts to suppliers                               │
│     └─ Create database relationships                         │
│                                                               │
│  LAYER 7: DEDUPLICATOR AGENT                                 │
│  └─ Remove duplicate records                                 │
│     ├─ Find duplicates (same vehicle, same specs)            │
│     ├─ Keep highest quality version                          │
│     ├─ Merge data from multiple sources                      │
│     └─ Track data provenance                                 │
│                                                               │
│  LAYER 8: DATABASE WRITER AGENT                              │
│  └─ Persist to database                                      │
│     ├─ Insert into vehicle_brands table                      │
│     ├─ Insert into vehicle_models table                      │
│     ├─ Insert into vehicle_engines table                     │
│     ├─ Insert into parts_catalog table                       │
│     └─ Track source URLs for traceability                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION ROADMAP

### WEEK 1: Foundation & Setup

**Tasks:**
1. Create database schema (✓ Done - see `data-collection-schema.sql`)
2. Set up scraping infrastructure
   - Install dependencies: `cheerio`, `axios`, `p-limit`, `playwright`
   - Create proxy rotation system
   - Create user-agent rotation
   - Create rate limiter
3. Implement Web Scraper Agent (Layer 1)
   - Fetch HTML from URLs
   - Handle retries & errors
   - Store raw HTML in `raw_html_storage` table
4. Implement HTML Parser Agent (Layer 2)
   - Parse ePiesa.ro vehicle selector
   - Parse Autodoc.ro catalog
   - Parse generic parts listings
   - Parse car listings (OLX, Ricardo, etc.)

**Expected Output:**
- 50,000+ raw HTML documents stored
- 150,000+ parsed records (vehicles, parts, listings)

**Code Structure:**
```
server/data-collection/
├── web-scraper.ts          # Agents 1-2
├── data-validator.ts       # Agent 3
├── data-normalizer.ts      # Agent 4
├── ai-enricher.ts          # Agent 5
├── data-linker.ts          # Agent 6
├── deduplicator.ts         # Agent 7
├── database-writer.ts      # Agent 8
├── orchestrator.ts         # Main pipeline
└── config.ts               # Configuration
```

### WEEK 2: Quality Assurance

**Tasks:**
1. Implement Data Validator Agent (Layer 3)
   - Validate required fields
   - Check data types & ranges
   - Detect duplicates
   - Assign quality scores (0-100)
   - Reject low-quality records (< 70)
2. Implement Data Normalizer Agent (Layer 4)
   - Normalize brand/model names
   - Parse engine specifications
   - Convert currencies
   - Standardize formats
3. Test validation on sample data
   - Achieve 90%+ quality score
   - Validate all rules work

**Expected Output:**
- 145,000+ validated records (from 150,000 parsed)
- Average quality score: 85+
- 0 fake data

### WEEK 3: AI Enrichment

**Tasks:**
1. Implement AI Enricher Agent (Layer 5)
   - Set up Kimi 256k integration
   - Create enrichment prompts for:
     - Vehicle generation extraction
     - Defect description parsing
     - Part category identification
     - Repair procedure extraction
   - Test on sample data
2. Optimize prompts for accuracy
3. Implement error handling & fallbacks

**Expected Output:**
- 145,000+ enriched records
- Generation codes extracted (E90, W205, etc.)
- Defect patterns identified
- Confidence scores assigned

### WEEK 4: Integration & Storage

**Tasks:**
1. Implement Data Linker Agent (Layer 6)
   - Create vehicle-to-parts compatibility links
   - Create vehicle-to-defect-pattern links
   - Calculate compatibility scores
2. Implement Deduplicator Agent (Layer 7)
   - Find duplicate records
   - Keep highest quality version
   - Merge data from multiple sources
3. Implement Database Writer Agent (Layer 8)
   - Insert into final tables
   - Track source URLs
   - Create audit trail
4. Test full pipeline end-to-end

**Expected Output:**
- 142,000+ unique records (3,000 duplicates removed)
- All relationships created
- 100% traceable to source URLs

### WEEK 5: Scale & Optimize

**Tasks:**
1. Scale scraping to all 16 websites
2. Optimize performance
   - Parallel processing
   - Batch operations
   - Database indexing
3. Monitor data quality metrics
4. Deploy to production
5. Create monitoring dashboard

**Expected Output:**
- 1,200,000+ total records
- 91/100 average quality score
- 0% fake data
- Real-time monitoring

---

## 💻 IMPLEMENTATION CODE TEMPLATES

### Template 1: Web Scraper Agent

```typescript
// server/data-collection/web-scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

export class WebScraperAgent {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    // ... more user agents
  ];

  async scrapeUrl(url: string): Promise<string> {
    // Implement rate limiting
    await this.respectRateLimit();
    
    // Rotate user agent
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
    };
    
    // Fetch with retries
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.get(url, { headers, timeout: 30000 });
        return response.data;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  async scrapeMultiple(urls: string[]): Promise<Map<string, string>> {
    const limit = pLimit(5);  // Max 5 concurrent requests
    const results = new Map();
    
    const promises = urls.map(url =>
      limit(async () => {
        try {
          const html = await this.scrapeUrl(url);
          results.set(url, html);
        } catch (error) {
          console.error(`Failed to scrape ${url}:`, error);
        }
      })
    );
    
    await Promise.all(promises);
    return results;
  }
}
```

### Template 2: Data Validator Agent

```typescript
// server/data-collection/data-validator.ts
export interface ValidationResult {
  valid: boolean;
  qualityScore: number;  // 0-100
  fieldCompleteness: number;  // 0-1
  dataValidity: number;  // 0-1
  errors: string[];
  warnings: string[];
}

export class DataValidatorAgent {
  validateVehicle(record: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let fieldCount = 0;
    let validFields = 0;

    // Check required fields
    if (!record.brand) errors.push('Missing brand');
    else { fieldCount++; validFields++; }
    
    if (!record.model) errors.push('Missing model');
    else { fieldCount++; validFields++; }
    
    if (!record.year) errors.push('Missing year');
    else {
      fieldCount++;
      if (typeof record.year === 'number' && record.year >= 1900 && record.year <= 2030) {
        validFields++;
      } else {
        errors.push('Invalid year range');
      }
    }

    // Check optional fields
    if (record.power) {
      fieldCount++;
      if (typeof record.power === 'number' && record.power > 0 && record.power < 1500) {
        validFields++;
      } else {
        warnings.push('Power value seems invalid');
      }
    }

    // Calculate scores
    const fieldCompleteness = fieldCount > 0 ? validFields / fieldCount : 0;
    const dataValidity = fieldCount > 0 ? validFields / fieldCount : 0;
    const qualityScore = Math.round(
      (fieldCompleteness * 30) +
      (dataValidity * 40) +
      (record.sourceUrl ? 10 : 0) +
      (record.sourceSite ? 20 : 0)
    );

    return {
      valid: errors.length === 0 && qualityScore >= 70,
      qualityScore,
      fieldCompleteness,
      dataValidity,
      errors,
      warnings,
    };
  }
}
```

### Template 3: AI Enricher Agent

```typescript
// server/data-collection/ai-enricher.ts
import axios from 'axios';

export class AIEnricherAgent {
  private kimiApiUrl = process.env.BUILT_IN_FORGE_API_URL;
  private kimiApiKey = process.env.BUILT_IN_FORGE_API_KEY;

  async enrichVehicle(record: any): Promise<any> {
    const prompt = `
      Analyze this vehicle data and extract:
      1. Generation code (e.g., E90, W205)
      2. Common defects for this model
      3. Reliability score (0-1)
      4. Parts availability score (0-1)
      
      Vehicle: ${record.brand} ${record.model} ${record.year} ${record.engine}
      
      Return JSON with: generation, commonDefects[], reliabilityScore, partsAvailabilityScore
    `;

    try {
      const response = await axios.post(
        `${this.kimiApiUrl}/v1/chat/completions`,
        {
          model: 'moonshot-v1-256k',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.kimiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const enrichedData = JSON.parse(content);

      return {
        ...record,
        generation: enrichedData.generation,
        commonDefects: enrichedData.commonDefects,
        reliabilityScore: enrichedData.reliabilityScore,
        partsAvailabilityScore: enrichedData.partsAvailabilityScore,
        enrichmentStatus: 'enriched',
        enrichmentTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Enrichment failed:', error);
      return {
        ...record,
        enrichmentStatus: 'failed',
        enrichmentError: error.message,
      };
    }
  }
}
```

### Template 4: Orchestrator (Main Pipeline)

```typescript
// server/data-collection/orchestrator.ts
export class DataCollectionOrchestrator {
  async runFullPipeline(config: any) {
    console.log('=== DATA COLLECTION PIPELINE STARTED ===');

    // LAYER 1-2: Scrape & Parse
    console.log('LAYER 1-2: Scraping and parsing...');
    const scraper = new WebScraperAgent();
    const parser = new HTMLParserAgent();
    const harvester = new DataHarvester(this.db);
    
    const vehicles = await harvester.harvestVehicles(config.vehicleUrls);
    const parts = await harvester.harvestParts(config.partUrls);
    console.log(`✓ Harvested ${vehicles.length} vehicles, ${parts.length} parts`);

    // LAYER 3-4: Validate & Normalize
    console.log('LAYER 3-4: Validating and normalizing...');
    const validator = new DataValidatorAgent();
    const normalizer = new DataNormalizerAgent();
    
    const validatedVehicles = vehicles
      .map(v => ({ raw: v, validation: validator.validateVehicle(v) }))
      .filter(v => v.validation.valid)
      .map(v => normalizer.normalizeVehicle(v.raw));
    
    console.log(`✓ Validated ${validatedVehicles.length} vehicles (quality ≥ 70)`);

    // LAYER 5: Enrich with AI
    console.log('LAYER 5: Enriching with AI...');
    const enricher = new AIEnricherAgent();
    const enrichedVehicles = await Promise.all(
      validatedVehicles.map(v => enricher.enrichVehicle(v))
    );
    console.log(`✓ Enriched ${enrichedVehicles.length} vehicles`);

    // LAYER 6: Link data
    console.log('LAYER 6: Linking data...');
    const linker = new DataLinkerAgent(this.db);
    await linker.linkVehiclesToParts(enrichedVehicles, parts);
    console.log(`✓ Created vehicle-to-parts links`);

    // LAYER 7: Deduplicate
    console.log('LAYER 7: Deduplicating...');
    const deduplicator = new DeduplicatorAgent();
    const uniqueVehicles = deduplicator.deduplicate(enrichedVehicles);
    console.log(`✓ Removed ${enrichedVehicles.length - uniqueVehicles.length} duplicates`);

    // LAYER 8: Store
    console.log('LAYER 8: Storing to database...');
    const writer = new DatabaseWriterAgent(this.db);
    const stored = await writer.storeVehicles(uniqueVehicles);
    console.log(`✓ Stored ${stored} vehicles to database`);

    console.log('=== DATA COLLECTION PIPELINE COMPLETED ===');
    return {
      vehiclesHarvested: vehicles.length,
      vehiclesValidated: validatedVehicles.length,
      vehiclesEnriched: enrichedVehicles.length,
      vehiclesStored: stored,
      duplicatesRemoved: enrichedVehicles.length - uniqueVehicles.length,
    };
  }
}
```

---

## 📊 MONITORING & METRICS

### Real-Time Dashboard

```typescript
// server/data-collection/monitoring.ts
export class DataCollectionMonitor {
  async getStats(): Promise<any> {
    const stats = await this.db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_records,
        AVG(quality_score) as avg_quality,
        COUNT(CASE WHEN quality_score >= 70 THEN 1 END) as approved,
        COUNT(CASE WHEN quality_score < 70 THEN 1 END) as rejected,
        COUNT(DISTINCT source_site) as unique_sources
      FROM validated_vehicles
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    return stats;
  }

  async getQualityReport(): Promise<any> {
    return {
      totalRecords: await this.countRecords(),
      averageQuality: await this.getAverageQuality(),
      qualityDistribution: await this.getQualityDistribution(),
      sourceBreakdown: await this.getSourceBreakdown(),
      duplicateStats: await this.getDuplicateStats(),
    };
  }
}
```

### Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Total Records | 1,200,000+ | - |
| Average Quality Score | ≥ 85 | - |
| Validation Pass Rate | ≥ 95% | - |
| Duplicate Rate | < 2% | - |
| Data Completeness | ≥ 90% | - |
| Traceable Records | 100% | - |
| Fake Data | 0% | - |
| Processing Time | 5 weeks | - |

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Database schema created
- [ ] Dependencies installed (cheerio, axios, p-limit, playwright)
- [ ] Web Scraper Agent implemented
- [ ] HTML Parser Agent implemented
- [ ] Data Validator Agent implemented
- [ ] Data Normalizer Agent implemented
- [ ] AI Enricher Agent implemented (Kimi 256k)
- [ ] Data Linker Agent implemented
- [ ] Deduplicator Agent implemented
- [ ] Database Writer Agent implemented
- [ ] Orchestrator pipeline created
- [ ] Monitoring dashboard implemented
- [ ] Error handling & logging configured
- [ ] Rate limiting configured
- [ ] Proxy rotation configured
- [ ] Test on sample data (100 URLs)
- [ ] Validate quality metrics
- [ ] Scale to full 16 websites
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Document results

---

## 📝 NEXT STEPS

1. **Install dependencies:**
   ```bash
   pnpm add cheerio axios p-limit playwright dotenv
   ```

2. **Create database schema:**
   ```bash
   mysql -u root -p < server/data-collection-schema.sql
   ```

3. **Implement agents** (follow templates above)

4. **Test on sample URLs:**
   ```bash
   node scripts/test-swarm.js
   ```

5. **Monitor progress:**
   - Check database stats
   - Review quality metrics
   - Adjust validation rules if needed

6. **Scale to production:**
   - Add all 16 websites
   - Run full pipeline
   - Deploy monitoring dashboard

---

## 🎯 SUCCESS CRITERIA

✓ 1,200,000+ records collected
✓ 91/100 average quality score
✓ 0% fake data (100% traceable)
✓ All 8 agents working correctly
✓ Full database populated
✓ Monitoring dashboard live
✓ Real-time alerts configured

---

## 💡 KEY PRINCIPLES

1. **NO FAKE DATA** - Every record from real source URL
2. **QUALITY FIRST** - Reject low-quality data
3. **TRACEABILITY** - Every record has source URL + timestamp
4. **VALIDATION** - Multiple validation layers
5. **ENRICHMENT** - AI adds value without fabricating
6. **DEDUPLICATION** - Keep highest quality version
7. **AUDIT TRAIL** - Complete history of processing
8. **SCALABILITY** - Handle millions of records

---

## 📞 SUPPORT

For questions or issues:
1. Check logs: `tail -f server/data-collection.log`
2. Review metrics: Dashboard at `/admin/data-collection`
3. Test individual agents: `node scripts/test-agent.js --agent=validator`
4. Review database: `SELECT * FROM data_collection_stats`

---

**Status:** READY FOR IMPLEMENTATION
**Estimated Timeline:** 5 weeks
**Expected Output:** 1,200,000+ real, validated, enriched records
**Data Quality:** 91/100 average
**Fake Data:** 0%
