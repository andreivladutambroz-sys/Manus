# Data Collection Swarm Architecture

## 🎯 VISION: Professional Real-Data Collection Pipeline

**Goal:** Build a **production-grade data collection system** that extracts REAL data from multiple sources, validates it, enriches it with AI, and stores it cleanly in database.

**Core Principle:** NO FAKE DATA. Every record must be traceable to a real source URL.

---

## 🏗️ SWARM ARCHITECTURE (8 Specialized Agents)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION SWARM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LAYER 1: HARVESTING (Raw Data Collection)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 1: Web Scraper                                    │   │
│  │ - Fetch HTML from target URLs                           │   │
│  │ - Handle JavaScript rendering (Selenium/Playwright)     │   │
│  │ - Rotate proxies & user agents                          │   │
│  │ - Respect rate limiting (2-5 sec delays)                │   │
│  │ - Store raw HTML with source URL & timestamp            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 2: PARSING (Extract Structured Data)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 2: HTML Parser                                    │   │
│  │ - Parse HTML using BeautifulSoup                        │   │
│  │ - Extract vehicle data (brand, model, year, engine)     │   │
│  │ - Extract parts data (OEM code, price, stock)           │   │
│  │ - Extract listing data (specs, defects, price)          │   │
│  │ - Handle multiple HTML structures (different sites)     │   │
│  │ - Tag data with source URL for traceability             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 3: VALIDATION (Ensure Data Quality)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 3: Data Validator                                 │   │
│  │ - Check for required fields                             │   │
│  │ - Validate data types (int, string, float, date)        │   │
│  │ - Validate ranges (year 1900-2030, price > 0)           │   │
│  │ - Check for duplicates (same URL, same data)            │   │
│  │ - Flag suspicious data (too cheap, too expensive)       │   │
│  │ - Assign quality score (0-100)                          │   │
│  │ - Reject records with quality < 70                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 4: NORMALIZATION (Clean & Standardize)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 4: Data Normalizer                                │   │
│  │ - Normalize brand names (BMW, bmw, B.M.W. → BMW)        │   │
│  │ - Normalize model names (3-Series, 3 Series → 3)        │   │
│  │ - Parse engine specs (2.0L Turbo → 2000cc, turbo)       │   │
│  │ - Convert prices to EUR (from RON, GBP, USD)            │   │
│  │ - Standardize date formats (ISO 8601)                   │   │
│  │ - Clean text fields (trim, remove special chars)        │   │
│  │ - Standardize units (km, miles → km)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 5: ENRICHMENT (AI-Powered Enhancement)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 5: AI Enricher (Kimi 256k)                         │   │
│  │ - Extract vehicle generation (E90, W205, etc.)          │   │
│  │ - Parse defect descriptions (extract symptoms)          │   │
│  │ - Identify part categories (engine, transmission, etc.) │   │
│  │ - Extract repair procedures from descriptions           │   │
│  │ - Calculate defect severity (critical, high, medium)    │   │
│  │ - Link OEM codes to part names                          │   │
│  │ - Identify alternative parts                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 6: LINKING (Connect Related Data)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 6: Data Linker                                    │   │
│  │ - Link vehicles to compatible parts                      │   │
│  │ - Link vehicles to defect patterns                       │   │
│  │ - Link parts to suppliers                               │   │
│  │ - Link listings to vehicle specs                         │   │
│  │ - Create relationships in database                       │   │
│  │ - Calculate compatibility scores                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 7: DEDUPLICATION (Remove Duplicates)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 7: Deduplicator                                   │   │
│  │ - Find duplicate records (same vehicle, same specs)      │   │
│  │ - Keep highest quality version                          │   │
│  │ - Merge data from multiple sources                      │   │
│  │ - Track data provenance (which sources)                 │   │
│  │ - Calculate confidence score                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  LAYER 8: STORAGE (Persist to Database)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent 8: Database Writer                                │   │
│  │ - Insert into vehicle_brands table                       │   │
│  │ - Insert into vehicle_models table                       │   │
│  │ - Insert into vehicle_engines table                      │   │
│  │ - Insert into parts_catalog table                        │   │
│  │ - Insert into parts_pricing table                        │   │
│  │ - Insert into defect_patterns table                      │   │
│  │ - Track source URLs for traceability                     │   │
│  │ - Log all transactions                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 DATA QUALITY ASSURANCE

### Quality Scoring System (0-100)

```
Quality Score = (Field Completeness × 30) + (Data Validity × 40) + (Uniqueness × 20) + (Source Reliability × 10)

Field Completeness (30 points):
├─ All required fields present: 30 pts
├─ 80-99% fields present: 20 pts
├─ 60-79% fields present: 10 pts
└─ <60% fields present: 0 pts

Data Validity (40 points):
├─ All fields valid type & range: 40 pts
├─ 90-99% valid: 30 pts
├─ 80-89% valid: 20 pts
├─ 70-79% valid: 10 pts
└─ <70% valid: 0 pts

Uniqueness (20 points):
├─ No duplicates found: 20 pts
├─ 1 duplicate found: 10 pts
├─ 2+ duplicates found: 0 pts

Source Reliability (10 points):
├─ Tier 1 source (ePiesa, Autodoc): 10 pts
├─ Tier 2 source (Ricardo, OLX): 7 pts
├─ Tier 3 source (Wikipedia, eBay): 5 pts
└─ Tier 4 source (other): 3 pts

THRESHOLD: Accept only records with score ≥ 70
```

### Data Validation Rules

```
Vehicle Data:
├─ Brand: Non-empty string, 2-50 chars
├─ Model: Non-empty string, 2-50 chars
├─ Year: Integer, 1900 ≤ year ≤ 2030
├─ Engine: Non-empty string, 5-100 chars
├─ Power: Integer, 20 ≤ hp ≤ 1500
├─ Displacement: Integer, 50 ≤ cc ≤ 10000
└─ Source URL: Valid HTTP(S) URL

Parts Data:
├─ OEM Code: Non-empty string, 5-50 chars (alphanumeric + dash)
├─ Part Name: Non-empty string, 5-200 chars
├─ Price: Float, 0.01 ≤ price ≤ 100000
├─ Stock: Integer, 0 ≤ stock ≤ 999999
├─ Supplier: Non-empty string, 2-100 chars
└─ Source URL: Valid HTTP(S) URL

Listing Data:
├─ Brand: Non-empty string, 2-50 chars
├─ Model: Non-empty string, 2-50 chars
├─ Year: Integer, 1900 ≤ year ≤ 2030
├─ Mileage: Integer, 0 ≤ mileage ≤ 2000000
├─ Price: Float, 100 ≤ price ≤ 500000
├─ Condition: ENUM('new', 'excellent', 'good', 'fair', 'poor')
└─ Source URL: Valid HTTP(S) URL
```

### Traceability & Audit Trail

Every record includes:
```
{
  "data": { ... },
  "metadata": {
    "source_url": "https://www.epiesa.ro/...",
    "source_site": "epiesa.ro",
    "scraped_at": "2026-03-06T15:30:00Z",
    "parsed_at": "2026-03-06T15:31:00Z",
    "validated_at": "2026-03-06T15:32:00Z",
    "quality_score": 92,
    "validation_status": "APPROVED",
    "enrichment_status": "COMPLETE",
    "hash": "sha256:abc123...",  // For deduplication
    "confidence": 0.95
  }
}
```

---

## 🔧 AGENT SPECIFICATIONS

### Agent 1: Web Scraper
```python
class WebScraper:
    """
    Fetches raw HTML from target URLs
    """
    def __init__(self):
        self.proxies = RotatingProxyPool()
        self.user_agents = UserAgentRotator()
        self.rate_limiter = RateLimiter(min_delay=2, max_delay=5)
    
    def scrape(self, url: str) -> dict:
        """
        Returns:
        {
            "url": "https://...",
            "html": "<html>...",
            "status_code": 200,
            "timestamp": "2026-03-06T15:30:00Z",
            "headers": {...},
            "error": None
        }
        """
        pass
```

### Agent 2: HTML Parser
```python
class HTMLParser:
    """
    Parses HTML and extracts structured data
    """
    def parse_vehicle(self, html: str, source: str) -> list[dict]:
        """
        Returns:
        [
            {
                "brand": "BMW",
                "model": "3 Series",
                "year": 2010,
                "engine": "2.0L Turbo",
                "source_url": "https://...",
                "raw_data": {...}
            }
        ]
        """
        pass
```

### Agent 3: Data Validator
```python
class DataValidator:
    """
    Validates data quality and assigns quality scores
    """
    def validate(self, record: dict) -> dict:
        """
        Returns:
        {
            "valid": True,
            "quality_score": 92,
            "errors": [],
            "warnings": [],
            "field_completeness": 0.95,
            "data_validity": 0.98
        }
        """
        pass
```

### Agent 4: Data Normalizer
```python
class DataNormalizer:
    """
    Cleans and standardizes data
    """
    def normalize(self, record: dict) -> dict:
        """
        Returns cleaned record with normalized values
        """
        pass
```

### Agent 5: AI Enricher (Kimi 256k)
```python
class AIEnricher:
    """
    Uses Kimi 256k to enrich data with AI insights
    """
    def enrich(self, record: dict) -> dict:
        """
        Returns:
        {
            "original": {...},
            "enriched": {
                "generation": "E90",
                "defect_severity": "high",
                "part_category": "engine",
                "repair_procedures": [...],
                "alternative_parts": [...]
            }
        }
        """
        pass
```

### Agent 6: Data Linker
```python
class DataLinker:
    """
    Links related data together
    """
    def link(self, record: dict, database: Database) -> dict:
        """
        Links vehicles to parts, defects, suppliers, etc.
        """
        pass
```

### Agent 7: Deduplicator
```python
class Deduplicator:
    """
    Removes duplicate records
    """
    def deduplicate(self, records: list[dict]) -> list[dict]:
        """
        Keeps highest quality version of duplicates
        """
        pass
```

### Agent 8: Database Writer
```python
class DatabaseWriter:
    """
    Persists data to database
    """
    def write(self, record: dict, table: str) -> dict:
        """
        Returns:
        {
            "success": True,
            "record_id": 12345,
            "table": "vehicle_brands",
            "source_url": "https://..."
        }
        """
        pass
```

---

## 📊 WORKFLOW EXAMPLE: Scraping ePiesa.ro

```
1. WEB SCRAPER
   Input: "https://www.epiesa.ro/vehicles"
   Output: Raw HTML (2MB)
   ↓

2. HTML PARSER
   Input: Raw HTML
   Output: 150 vehicle records (brand, model, year, engine)
   ↓

3. DATA VALIDATOR
   Input: 150 records
   Output: 145 approved (quality ≥ 70), 5 rejected
   ↓

4. DATA NORMALIZER
   Input: 145 records
   Output: 145 cleaned records (BMW vs bmw → BMW)
   ↓

5. AI ENRICHER (Kimi 256k)
   Input: 145 records
   Output: 145 enriched records (generation E90, power 184 HP, etc.)
   ↓

6. DATA LINKER
   Input: 145 enriched records
   Output: 145 linked records (connected to parts, defects, etc.)
   ↓

7. DEDUPLICATOR
   Input: 145 linked records
   Output: 142 unique records (3 duplicates removed)
   ↓

8. DATABASE WRITER
   Input: 142 unique records
   Output: 142 records inserted into database
   
   Final Result:
   ├─ 142 new vehicle records
   ├─ 0 duplicates
   ├─ 0 fake data
   ├─ 100% traceable to source URLs
   └─ Average quality score: 91/100
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 1: Foundation
- [ ] Set up scraping infrastructure (proxies, user agents, rate limiting)
- [ ] Implement Web Scraper agent
- [ ] Implement HTML Parser agent
- [ ] Test on ePiesa.ro (small sample)

### Week 2: Quality Assurance
- [ ] Implement Data Validator agent
- [ ] Implement Data Normalizer agent
- [ ] Test validation rules
- [ ] Achieve 90%+ quality score on test data

### Week 3: AI Enrichment
- [ ] Implement AI Enricher agent (Kimi 256k)
- [ ] Test enrichment on sample data
- [ ] Validate enriched data quality
- [ ] Optimize prompts for accuracy

### Week 4: Integration & Storage
- [ ] Implement Data Linker agent
- [ ] Implement Deduplicator agent
- [ ] Implement Database Writer agent
- [ ] Test full pipeline end-to-end

### Week 5: Scale & Optimize
- [ ] Scale scraping to multiple sites
- [ ] Optimize performance (parallel processing)
- [ ] Monitor data quality metrics
- [ ] Deploy to production

---

## 📈 EXPECTED RESULTS (After 5 Weeks)

| Metric | Target | Expected |
|--------|--------|----------|
| Total Records Collected | 1,000,000+ | 1,200,000 |
| Quality Score (avg) | ≥ 85 | 91 |
| Duplicate Rate | < 2% | 1.2% |
| Validation Pass Rate | ≥ 95% | 96.5% |
| Data Completeness | ≥ 90% | 94% |
| Traceable Records | 100% | 100% |
| Fake Data | 0% | 0% |

---

## 🎯 KEY PRINCIPLES

1. **NO FAKE DATA** - Every record must be from a real source URL
2. **QUALITY FIRST** - Reject low-quality data (score < 70)
3. **TRACEABILITY** - Every record includes source URL and timestamp
4. **VALIDATION** - Multiple validation layers ensure data integrity
5. **ENRICHMENT** - AI adds value without fabricating data
6. **DEDUPLICATION** - Remove duplicates, keep highest quality version
7. **AUDIT TRAIL** - Complete history of data processing
8. **SCALABILITY** - Designed to handle millions of records

---

## 💡 COMPETITIVE ADVANTAGE

**vs ChatGPT:**
- ChatGPT: Generates plausible but potentially fake data
- Our Swarm: REAL data from real sources, 100% traceable

**vs Manual Collection:**
- Manual: Slow, expensive, error-prone
- Our Swarm: Fast, automated, high-quality

**vs Other Scrapers:**
- Basic Scrapers: Extract raw data, no validation
- Our Swarm: Extract + Validate + Normalize + Enrich + Deduplicate + Store

This is **PRODUCTION-GRADE data infrastructure**.
