# Source Tracking & Verification Guide

## Overview

The Mechanic Helper application implements **transparent source tracking** to ensure all diagnostic recommendations and pricing information comes from **verified, traceable sources** rather than AI approximations.

## Source Confidence Hierarchy

All sources are ranked by confidence level:

| Confidence | Type | Examples | Trust Level |
|-----------|------|----------|------------|
| **98%** | OEM Database | Autodata, manufacturer specs | 🟢 Verified |
| **90%** | Technical Manuals | Service manuals, repair guides | 🟢 Verified |
| **85%** | Parts APIs | Autodoc, eBay Motors, Emag | 🟢 Verified |
| **85%** | Community (20+ upvotes) | VWVortex, BenzWorld forums | 🟢 Verified |
| **60%** | AI Analysis | Kimi AI responses | 🟡 Supplementary |
| **50%** | User Input | Symptoms, error codes | 🔴 Context Only |

## How It Works

### 1. Diagnostic Analysis Flow

```
User Input (Symptoms, Vehicle)
    ↓
[OEM Database Lookup] → 98% confidence
[Technical Manual Search] → 90% confidence
[Kimi AI Analysis] → 60% confidence (supplementary)
[Community Forum Search] → 85% confidence (if 20+ upvotes)
    ↓
[Source Validation]
    - Minimum 3 verified sources OR
    - Average confidence ≥75%
    ↓
[Trust Score Calculation]
    - 0-100% based on source quality
    - Displayed to user
    ↓
[Results with Attribution]
    - Each recommendation includes source links
    - Trust badge (🟢 Very Sure / 🟡 Sure / 🔴 Unverified)
```

### 2. Parts Pricing Flow

```
User searches for part (e.g., "Oxygen Sensor")
    ↓
[Parallel API Calls]
├─ Autodoc API → Price + Link + Availability
├─ Autodata API → OEM Price + Link
├─ eBay Motors API → Market Price + Link
└─ Local Markets (Emag, OLX) → Regional Price + Link
    ↓
[Price Aggregation]
    - Min/Max/Average calculated
    - Best source selected (highest confidence)
    - All sources displayed with links
    ↓
[24-Hour Cache]
    - Avoid repeated API calls
    - Automatic refresh after 24h
    ↓
[User Result]
    - Verified pricing from multiple sources
    - Direct links to purchase
    - Availability status
```

## Source Types

### OEM Database (98% Confidence)
**What:** Official manufacturer specifications and data
**Sources:** Autodata, manufacturer websites
**Example:** "VW Golf 2015 oxygen sensor specifications"
**Link Format:** `https://www.autodata.com/Volkswagen/Golf/2015`

### Technical Manuals (90% Confidence)
**What:** Official service manuals and repair guides
**Sources:** Manufacturer service manuals, repair databases
**Example:** "VW Golf Service Manual - Engine Diagnostics Section"
**Link Format:** Direct to manual section

### Parts APIs (85% Confidence)
**What:** Real-time parts pricing and availability
**Sources:** Autodoc, Autodata, eBay Motors, Emag
**Example:** "Oxygen Sensor - €45.99 in stock at Autodoc"
**Link Format:** Direct to product page with live pricing

### Community Forums (85% Confidence)
**What:** Community discussions with community validation
**Sources:** VWVortex, BenzWorld, MBWorld, BMWForum
**Confidence Rule:** Only included if 20+ upvotes
**Example:** "VWVortex discussion on P0135 diagnosis (42 upvotes)"
**Link Format:** Direct to forum thread

### Kimi AI (60% Confidence)
**What:** AI-generated analysis (supplementary only)
**Role:** Provides initial hypothesis, NOT primary diagnosis
**Confidence:** Lower than verified sources
**Example:** "AI suggests: Check oxygen sensor wiring"
**Link Format:** `https://api.moonshot.ai`

### User Input (50% Confidence)
**What:** User-provided symptoms and vehicle info
**Role:** Context for analysis, not verification
**Example:** "User reported: Engine light on, rough idle"

## Trust Score Calculation

```
Trust Score = Base Confidence + Bonuses - Penalties

Base Confidence:
  = Average of all source confidences

Bonuses:
  + 15 points if 3+ verified sources (≥75% confidence)
  + 10 points if OEM + Technical Manual both present

Penalties:
  - 35 points if only AI sources
  - 20 points if only user input
  - 10 points if <50% sources verified

Final Score: Capped at 0-100%
```

### Trust Score Interpretation

| Score | Badge | Meaning |
|-------|-------|---------|
| 85-100% | 🟢 Foarte sigur | Multiple verified sources, high confidence |
| 70-84% | 🟡 Sigur | Good mix of sources, acceptable confidence |
| 50-69% | 🟠 Parțial verificat | Some verified sources, needs caution |
| <50% | 🔴 Neverificat | Mostly unverified, use with caution |

## API Response Format

```json
{
  "diagnosis": "Faulty oxygen sensor (O2 sensor) - needs replacement",
  "trustScore": 92,
  "sourcesSummary": {
    "totalSources": 8,
    "verifiedSources": 6,
    "averageConfidence": 87
  },
  "sources": [
    {
      "type": "oem_database",
      "name": "OEM Database - Volkswagen",
      "url": "https://www.autodata.com/Volkswagen/Golf/2015",
      "description": "Official OEM data for Volkswagen Golf (2015): Oxygen sensor specifications",
      "confidence": 98,
      "timestamp": "2026-03-05T10:47:38.469Z"
    },
    {
      "type": "parts_api",
      "name": "Parts API: Autodoc",
      "url": "https://www.autodoc.eu/parts/oxygen-sensor-vw-golf",
      "description": "Oxygen Sensor: €45.99 (in_stock)",
      "confidence": 85,
      "timestamp": "2026-03-05T10:47:38.469Z"
    },
    {
      "type": "kimi_ai",
      "name": "Kimi AI (kimi-latest)",
      "url": "https://api.moonshot.ai",
      "description": "AI-generated analysis using prompt: 'Diagnose oxygen sensor...'",
      "confidence": 60,
      "timestamp": "2026-03-05T10:47:38.469Z"
    }
  ]
}
```

## Validation Rules

### Diagnostic Validation

A diagnostic is **valid** if:
- ✅ Has at least 3 sources, OR
- ✅ Has at least 1 OEM source + 1 Technical Manual, OR
- ✅ Average confidence ≥75%

A diagnostic is **invalid** if:
- ❌ Has 0 sources
- ❌ Has only unverified sources (<75% confidence)
- ❌ Trust score <50%
- ❌ >70% of sources are AI-generated

### Parts Pricing Validation

Parts pricing is **verified** if:
- ✅ Found on 2+ different platforms
- ✅ All sources are from parts APIs (85%+ confidence)
- ✅ Prices within 20% of each other

## Implementation Details

### Service Files

```
server/services/diagnostic-sources.ts
  ├─ trackKimiResponse()
  ├─ trackOEMSource()
  ├─ trackTechnicalManualSource()
  ├─ trackForumSource()
  ├─ trackPartsAPISource()
  ├─ trackUserInput()
  ├─ createSourcedResult()
  ├─ validateDiagnosticSources()
  ├─ formatSourcesForDisplay()
  └─ exportSourcesAsJSON()

server/services/parts-pricing.ts
  ├─ fetchFromAutodoc()
  ├─ fetchFromAutodata()
  ├─ fetchFromEBayMotors()
  ├─ fetchFromLocalMarkets()
  ├─ getPartsPricing()
  ├─ getCachedPartsPricing()
  └─ formatPricingResult()
```

### Router Endpoints

```typescript
// Analyze symptoms with source tracing
POST /api/trpc/diagnostic.analyzeWithSources
Input: { brand, model, year, engine, symptomsText, symptomsSelected }
Output: { diagnosis, sources, trustScore, validation }

// Get parts pricing with sources
GET /api/trpc/diagnostic.getPartsPricingWithSources
Input: { brand, model, year, partName, oemCode }
Output: { pricing, sources, trustScore }

// Comprehensive diagnostic with parts
POST /api/trpc/diagnostic.getComprehensiveDiagnostic
Input: { brand, model, year, symptoms, parts[] }
Output: { diagnosis, partsPricing[], sources, trustScore }
```

## Usage Examples

### Example 1: VW Golf Check Engine Light

**Input:**
```
Vehicle: Volkswagen Golf (2015)
Symptoms: Engine light on, rough idle, poor acceleration
```

**Process:**
1. OEM lookup → "1.6 TDI engine specs" (98%)
2. Technical manual search → "Engine diagnostics section" (90%)
3. Kimi AI analysis → "Possible oxygen sensor issue" (60%)
4. Forum search → "P0135 diagnosis thread" (42 upvotes = 85%)
5. Parts API → "Oxygen sensor €45.99 at Autodoc" (85%)

**Output:**
```
Diagnosis: Faulty oxygen sensor
Trust Score: 92% 🟢 Foarte sigur

Sources:
✅ OEM Database (98%) - Volkswagen Golf 2015 specs
✅ Technical Manual (90%) - Engine diagnostics
✅ Community Forum (85%) - P0135 diagnosis (42 upvotes)
✅ Parts API (85%) - Autodoc €45.99
⚠️  Kimi AI (60%) - Initial hypothesis
```

### Example 2: Parts Pricing

**Input:**
```
Part: Oxygen Sensor for VW Golf 2015
```

**Process:**
1. Autodoc API → €45.99, in stock
2. Autodata API → €48.50, in stock
3. eBay Motors → €42.50, in stock
4. Emag → €52.00, in stock

**Output:**
```
Oxygen Sensor Pricing
Average: €47.25
Range: €42.50 - €52.00

Sources:
✔️  Autodoc: €45.99 [Link]
✔️  Autodata: €48.50 [Link]
✔️  eBay Motors: €42.50 [Link]
✔️  Emag: €52.00 [Link]

Best Price: eBay Motors €42.50
```

## Audit Trail

All diagnostics are logged with:
- Timestamp
- Diagnostic ID
- All sources used
- Trust score
- User who requested it

Logs are stored in database for compliance and debugging.

## Future Enhancements

1. **Machine Learning Confidence Adjustment** - Adjust confidence based on historical accuracy
2. **User Feedback Loop** - Users can mark sources as helpful/unhelpful
3. **Real-time Source Updates** - Refresh sources automatically when new data available
4. **Competitor Price Tracking** - Monitor price changes across suppliers
5. **Source Quality Metrics** - Track which sources have highest accuracy over time

## FAQ

**Q: Why is Kimi AI only 60% confidence?**
A: AI can hallucinate or make mistakes. It's useful for initial hypothesis but needs verification from official sources.

**Q: What if a diagnostic has no OEM sources?**
A: It's still valid if it has 3+ other verified sources (technical manuals, forums, parts APIs) with average confidence ≥75%.

**Q: How often are parts prices updated?**
A: Every 24 hours automatically. Manual refresh available on demand.

**Q: Can I trust forum sources?**
A: Only if they have 20+ community upvotes, indicating consensus validation.

**Q: What if I disagree with the trust score?**
A: You can see exactly which sources contributed and their confidence levels. You can verify independently using the provided links.

---

**Last Updated:** March 5, 2026
**Version:** 1.0
