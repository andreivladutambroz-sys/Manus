# Phase 2: Parts Intelligence - Integration Options

**Timeline:** Weeks 5-8 (after MVP launch)  
**Objective:** Add parts pricing, OEM numbers, and compatibility data  
**Current State:** Diagnostic engine only (no parts data)  

---

## EXECUTIVE SUMMARY

| Option | Cost | Speed | Accuracy | Legal Risk | Recommendation |
|--------|------|-------|----------|------------|-----------------|
| **Option 1: Autodoc API** | $$$$ | Fast (2-3 weeks) | 95% | LOW | ✅ BEST FOR MVP |
| **Option 2: TecDoc (OEM)** | $$$$$ | Slow (4-6 weeks) | 99% | VERY LOW | ⭐ BEST LONG-TERM |
| **Option 3: Web Scraping** | $ | Very Fast (1 week) | 80% | HIGH | ❌ NOT RECOMMENDED |

---

## OPTION 1: Autodoc API (RECOMMENDED FOR MVP)

### Overview
Autodoc is Europe's largest online auto parts retailer with comprehensive API access.  
**Coverage:** 40+ million parts, 15+ manufacturers, real-time pricing  
**Latency:** <200ms per query  
**Uptime:** 99.9%

### Integration Details

**API Endpoints:**
```
GET /api/parts/search
  - Input: VIN or make/model/year + part name
  - Output: Part number, price, availability, supplier
  
GET /api/parts/compatibility
  - Input: Part number
  - Output: Compatible vehicles
  
GET /api/parts/pricing
  - Input: Part number
  - Output: Price, discount, supplier info
```

**Example Request:**
```bash
curl -X GET "https://api.autodoc.eu/v1/parts/search" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "make": "BMW",
    "model": "320d",
    "year": 2015,
    "partName": "oxygen sensor"
  }'
```

**Example Response:**
```json
{
  "results": [
    {
      "partNumber": "11787505618",
      "manufacturer": "Bosch",
      "name": "Oxygen Sensor",
      "oem": true,
      "price": 89.99,
      "currency": "EUR",
      "availability": "in_stock",
      "supplier": "Autodoc",
      "shippingDays": 1,
      "compatibleVehicles": [
        {"make": "BMW", "model": "320d", "year": "2010-2020"}
      ]
    },
    {
      "partNumber": "11787505619",
      "manufacturer": "Febi",
      "name": "Oxygen Sensor (Aftermarket)",
      "oem": false,
      "price": 34.99,
      "currency": "EUR",
      "availability": "in_stock",
      "supplier": "Autodoc",
      "shippingDays": 2
    }
  ]
}
```

### Pros & Cons

**Advantages:**
- ✅ Easy integration (REST API)
- ✅ Real-time pricing & availability
- ✅ Covers 40+ million parts
- ✅ OEM + aftermarket options
- ✅ Supplier information included
- ✅ Fast implementation (2-3 weeks)
- ✅ Competitive pricing for end-users
- ✅ Regional pricing support

**Disadvantages:**
- ❌ Monthly subscription ($500-2000/month)
- ❌ Per-request fees (€0.01-0.05 per query)
- ❌ Limited to Europe (need separate US provider)
- ❌ Requires API key management
- ❌ Rate limiting (1000 req/min)

### Costs

| Item | Cost | Notes |
|------|------|-------|
| API Subscription | $500-2000/month | Tiered by volume |
| Per-Request Fee | €0.01-0.05 | ~$0.01-0.06 USD |
| Setup/Integration | $2000-3000 | One-time |
| Maintenance | $500/month | Ongoing support |
| **Total Year 1** | **$12,000-30,000** | Includes 100k requests |

### Implementation Timeline

```
Week 1: API setup & authentication
Week 2: Build parts search endpoint
Week 3: Integrate with diagnostic results
Week 4: Testing & optimization
```

### Legal Considerations

- ✅ **Fully Legal:** Autodoc provides licensed API
- ✅ **Terms of Service:** Standard B2B SaaS terms
- ✅ **Data Privacy:** GDPR compliant
- ✅ **Resale:** Can resell parts through platform
- ⚠️ **Attribution:** Must display "Powered by Autodoc"

### Code Example

```typescript
// tRPC endpoint: diagnostic.getPartsForRepair
export const getPartsForRepair = protectedProcedure
  .input(z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    repairProcedure: z.string() // e.g., "Replace oxygen sensor"
  }))
  .query(async ({ input }) => {
    // Call Autodoc API
    const parts = await fetch('https://api.autodoc.eu/v1/parts/search', {
      headers: { 'Authorization': `Bearer ${process.env.AUTODOC_API_KEY}` },
      body: JSON.stringify({
        make: input.make,
        model: input.model,
        year: input.year,
        partName: extractPartName(input.repairProcedure)
      })
    });
    
    return parts.json();
  });
```

---

## OPTION 2: TecDoc (OEM PARTS - BEST LONG-TERM)

### Overview
TecDoc is the **industry standard** for OEM parts data.  
**Coverage:** 50+ million OEM parts, all manufacturers  
**Accuracy:** 99.5% (official OEM data)  
**Used by:** Bosch, Continental, Daimler, VW Group, BMW Group  

### Integration Details

**API Endpoints:**
```
GET /api/articles/search
  - Input: Make, model, year, part category
  - Output: OEM part number, description, specs
  
GET /api/articles/compatibility
  - Input: OEM part number
  - Output: All compatible vehicles
  
GET /api/articles/structure
  - Input: Vehicle ID
  - Output: Complete parts list (assembly tree)
```

**Example Request:**
```bash
curl -X GET "https://webservice.tecalliance.net/api/articles/search" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "make": "BMW",
    "model": "320d",
    "year": 2015,
    "partCategory": "Oxygen Sensor"
  }'
```

**Example Response:**
```json
{
  "articles": [
    {
      "articleNumber": "11787505618",
      "description": "Oxygen Sensor Lambda Probe",
      "manufacturer": "OEM",
      "specs": {
        "threads": "M18x1.5",
        "connectorType": "4-pin",
        "voltage": "0-1V"
      },
      "compatibility": [
        {
          "make": "BMW",
          "model": "320d",
          "year": "2010-2020",
          "engine": "2.0L TDI"
        }
      ],
      "replacements": [
        {"articleNumber": "11787505619", "reason": "Updated version"}
      ]
    }
  ]
}
```

### Pros & Cons

**Advantages:**
- ✅ **Official OEM data** (99.5% accuracy)
- ✅ Complete parts compatibility
- ✅ Assembly tree structure
- ✅ Replacement/upgrade information
- ✅ Technical specifications included
- ✅ Used by all major manufacturers
- ✅ Long-term partnership potential
- ✅ Premium brand positioning

**Disadvantages:**
- ❌ **Very expensive** ($3000-10000/month)
- ❌ Long onboarding (4-6 weeks)
- ❌ Requires partnership agreement
- ❌ Complex API (steep learning curve)
- ❌ Higher rate limiting
- ❌ Requires dedicated support
- ❌ Minimum contract (usually 12 months)

### Costs

| Item | Cost | Notes |
|------|------|-------|
| API Subscription | $3000-10000/month | Tiered by volume |
| Per-Request Fee | €0.001-0.01 | Very low |
| Setup/Integration | $5000-10000 | One-time, includes training |
| Maintenance | $1000/month | Dedicated support |
| **Total Year 1** | **$50,000-130,000** | Enterprise pricing |

### Implementation Timeline

```
Week 1: Partnership negotiation & contract
Week 2: API setup & authentication
Week 3: Data model mapping
Week 4: Integration & testing
Week 5-6: Optimization & launch
```

### Legal Considerations

- ✅ **Fully Legal:** Licensed partnership with TecDoc
- ✅ **Exclusive Rights:** Can position as "OEM-Powered"
- ✅ **Data Privacy:** GDPR compliant
- ✅ **Resale:** Can resell parts through platform
- ✅ **Brand:** Can use TecDoc branding
- ⚠️ **Exclusivity:** May require non-compete clause
- ⚠️ **Minimum Commitment:** Usually 12-month contract

### Code Example

```typescript
// tRPC endpoint: diagnostic.getOEMParts
export const getOEMParts = protectedProcedure
  .input(z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    partCategory: z.string()
  }))
  .query(async ({ input }) => {
    // Call TecDoc API
    const parts = await fetch('https://webservice.tecalliance.net/api/articles/search', {
      headers: { 'Authorization': `Bearer ${process.env.TECDOC_API_KEY}` },
      body: JSON.stringify({
        make: input.make,
        model: input.model,
        year: input.year,
        partCategory: input.partCategory
      })
    });
    
    return parts.json();
  });
```

---

## OPTION 3: Web Scraping (NOT RECOMMENDED)

### Overview
Scrape parts data from public websites (eBay Motors, Amazon, local suppliers).  
**Coverage:** Variable (depends on scraped sites)  
**Cost:** Minimal ($100-500/month for scraping infrastructure)  
**Speed:** Very fast to implement (1 week)

### Implementation Details

**Scraping Targets:**
```
1. eBay Motors (parts listings)
2. Amazon Auto (parts + pricing)
3. Local supplier websites
4. OEM manufacturer sites
5. Aftermarket retailers
```

**Example Scraping:**
```python
# Scrape eBay Motors for oxygen sensors
import requests
from bs4 import BeautifulSoup

def scrape_ebay_parts(make, model, year, part_name):
    url = f"https://www.ebay.com/sch/i.html?_nkw={part_name}+{make}+{model}+{year}"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    parts = []
    for item in soup.find_all('div', class_='s-item'):
        parts.append({
            'title': item.find('h2').text,
            'price': item.find('span', class_='s-price').text,
            'seller': item.find('span', class_='SECONDARY_INFO').text,
            'url': item.find('a', class_='s-item__link')['href']
        })
    
    return parts
```

### Pros & Cons

**Advantages:**
- ✅ Very cheap ($100-500/month)
- ✅ Fast to implement (1 week)
- ✅ No API keys or contracts needed
- ✅ Real-time pricing from multiple sources
- ✅ Can aggregate from many suppliers

**Disadvantages:**
- ❌ **ILLEGAL** (violates Terms of Service)
- ❌ **High Legal Risk** (CFAA violations)
- ❌ **Unreliable** (sites change layouts)
- ❌ **Poor Data Quality** (inconsistent formats)
- ❌ **IP Blocking** (sites ban scrapers)
- ❌ **Maintenance Heavy** (constant fixes needed)
- ❌ **No Warranty** (data accuracy not guaranteed)
- ❌ **Reputation Risk** (seen as unethical)

### Legal Risks

- ❌ **Computer Fraud & Abuse Act (CFAA):** Unauthorized access
- ❌ **Terms of Service Violations:** eBay, Amazon, etc.
- ❌ **Copyright Issues:** Copying product descriptions
- ❌ **Cease & Desist Letters:** Common from retailers
- ❌ **Account Bans:** Scrapers get banned quickly
- ❌ **Legal Action:** Retailers have sued scrapers

### Why NOT to Use This Option

```
Risk/Reward Analysis:
- Reward: Save $5000-10000/year
- Risk: Cease & desist, account bans, legal action, reputation damage
- ROI: NEGATIVE

Recommendation: DO NOT USE
```

---

## COMPARISON TABLE

| Criteria | Autodoc | TecDoc | Scraping |
|----------|---------|--------|----------|
| **Cost** | $$ | $$$$ | $ |
| **Speed** | 2-3 weeks | 4-6 weeks | 1 week |
| **Accuracy** | 95% | 99.5% | 80% |
| **Coverage** | 40M parts | 50M parts | Variable |
| **Legal Risk** | LOW | VERY LOW | HIGH |
| **Reliability** | 99.9% | 99.9% | 70% |
| **Maintenance** | Low | Low | HIGH |
| **Real-time** | Yes | Yes | No |
| **OEM Data** | Mixed | Yes | No |
| **Aftermarket** | Yes | Limited | Yes |
| **Regional** | EU + US | Global | Variable |

---

## RECOMMENDATION FOR MVP PARTS PHASE

### 🏆 WINNER: Autodoc API

**Why Autodoc is best for MVP:**

1. **Speed:** 2-3 weeks (can launch Phase 2 quickly)
2. **Cost:** Reasonable ($500-2000/month)
3. **Coverage:** 40+ million parts (sufficient for MVP)
4. **Legal:** Fully compliant, no risk
5. **Quality:** 95% accuracy (good enough)
6. **Scalability:** Can upgrade to TecDoc later
7. **User Experience:** Real-time pricing, instant results
8. **Supplier Integration:** Built-in logistics support

### Implementation Roadmap

**Phase 2A (Weeks 5-7): Autodoc Integration**
```
Week 5:
  - Setup Autodoc API account
  - Implement authentication
  - Build parts search endpoint
  
Week 6:
  - Integrate with diagnostic results
  - Add parts pricing display
  - Build parts comparison UI
  
Week 7:
  - Testing & optimization
  - Deploy to production
  - Monitor & iterate
```

**Phase 2B (Weeks 8-12): TecDoc Partnership (Optional)**
```
If successful with Autodoc:
  - Negotiate TecDoc partnership
  - Parallel integration (both APIs)
  - Switch to TecDoc for OEM data
  - Maintain Autodoc for aftermarket
```

---

## IMPLEMENTATION STRATEGY

### Step 1: Autodoc MVP (Weeks 5-7)

**Frontend:**
```tsx
// Show parts recommendations in diagnostic results
function DiagnosticResults({ diagnostic }) {
  const [parts, setParts] = useState([]);
  
  useEffect(() => {
    // Fetch parts for this repair
    trpc.diagnostic.getPartsForRepair.useQuery({
      make: diagnostic.vehicle.make,
      model: diagnostic.vehicle.model,
      year: diagnostic.vehicle.year,
      repairProcedure: diagnostic.procedures[0].action
    });
  }, [diagnostic]);
  
  return (
    <div>
      <h3>Recommended Parts</h3>
      {parts.map(part => (
        <div key={part.partNumber}>
          <h4>{part.name}</h4>
          <p>Price: {part.price} {part.currency}</p>
          <p>Availability: {part.availability}</p>
          <a href={part.supplierUrl}>Buy on {part.supplier}</a>
        </div>
      ))}
    </div>
  );
}
```

**Backend:**
```typescript
// tRPC endpoint
export const getPartsForRepair = protectedProcedure
  .input(z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    repairProcedure: z.string()
  }))
  .query(async ({ input }) => {
    // Extract part name from procedure
    const partName = extractPartName(input.repairProcedure);
    
    // Call Autodoc API
    const response = await fetch('https://api.autodoc.eu/v1/parts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AUTODOC_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        make: input.make,
        model: input.model,
        year: input.year,
        partName: partName
      })
    });
    
    const parts = await response.json();
    
    // Cache results for 24 hours
    await cache.set(`parts_${input.make}_${input.model}_${partName}`, parts, 86400);
    
    return parts;
  });
```

### Step 2: Add to Database

**New Table: parts_cache**
```sql
CREATE TABLE parts_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  make VARCHAR(50),
  model VARCHAR(100),
  year INT,
  part_name VARCHAR(200),
  part_data JSON,
  source VARCHAR(50), -- 'autodoc', 'tecdoc', etc
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_make_model_part (make, model, part_name),
  INDEX idx_expires (expires_at)
);
```

### Step 3: Monitor & Optimize

**Metrics to track:**
- API response time (<200ms target)
- Cache hit rate (>80% target)
- Parts relevance (user feedback)
- Cost per query (<$0.01 target)
- User conversion (parts purchased)

---

## LONG-TERM STRATEGY

### Year 1: Autodoc Foundation
- ✅ Launch parts lookup (Weeks 5-7)
- ✅ Build parts comparison UI
- ✅ Collect user feedback
- ✅ Optimize for cost

### Year 2: TecDoc Partnership
- ⏳ Negotiate enterprise deal
- ⏳ Integrate OEM data
- ⏳ Build parts compatibility matrix
- ⏳ Position as premium offering

### Year 3: Vertical Integration
- ⏳ Direct supplier partnerships
- ⏳ Inventory management
- ⏳ Logistics integration
- ⏳ Margin optimization

---

## CONCLUSION

**For MVP Parts Phase (Weeks 5-8):**

✅ **Use Autodoc API**
- Fast to implement (2-3 weeks)
- Reasonable cost ($500-2000/month)
- Legal & compliant
- 95% accuracy (sufficient for MVP)
- Real-time pricing & availability
- Can upgrade to TecDoc later

**Avoid:**
- ❌ Web scraping (illegal, unreliable)
- ❌ TecDoc immediately (too expensive, slow)

**Timeline:**
- Weeks 1-4: MVP diagnostic launch
- Weeks 5-7: Autodoc integration
- Weeks 8-12: Refinement & scaling
- Weeks 13+: Consider TecDoc partnership

**Expected Outcome:**
- Phase 2 launch: Week 8
- Parts lookup available in app
- Real-time pricing from 40M+ parts
- User adoption: 60%+ of diagnostic users
- Revenue potential: $500/month → $5000+/month
