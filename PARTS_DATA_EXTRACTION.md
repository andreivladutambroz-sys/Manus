# Parts Supplier Data Extraction Strategy

## 🎯 CONCEPT: Build Real-Time Parts Intelligence

Idea: Extract data from **parts supplier websites** (ePiesa.ro, Autodoc.ro, etc.) para construi o bază de date cu piese reale, prețuri, disponibilitate, și compatibilitate.

---

## 📦 PARTS SUPPLIERS (Romania + EU)

### Romania
| Site | Data Quality | Coverage | API | Value |
|------|--------------|----------|-----|-------|
| **ePiesa.ro** | ⭐⭐⭐⭐⭐ | Complet | No | ⭐⭐⭐⭐⭐ |
| **Autodoc.ro** | ⭐⭐⭐⭐⭐ | Complet | Yes* | ⭐⭐⭐⭐⭐ |
| **Autopartist.ro** | ⭐⭐⭐⭐ | Bun | No | ⭐⭐⭐⭐ |
| **Emag.ro** (Auto section) | ⭐⭐⭐ | Parțial | No | ⭐⭐⭐ |
| **OLX.ro** (Parts) | ⭐⭐ | Variabil | No | ⭐⭐ |

### EU
| Site | Country | Data | API | Value |
|------|---------|------|-----|-------|
| **Autodoc.eu** | Multi | Complet | Yes | ⭐⭐⭐⭐⭐ |
| **AliExpress** | China | Piese | API | ⭐⭐⭐ |
| **eBay Motors** | Multi | Piese | API | ⭐⭐⭐⭐ |
| **Amazon.de** | Germany | Piese | API | ⭐⭐⭐ |

---

## 💾 DATA TO EXTRACT FROM PARTS SITES

### 1. **OEM CODES & COMPATIBILITY**
```
From ePiesa.ro listing:
├─ OEM Code: 11127646050
├─ Part Name: Valve Cover Gasket
├─ Compatible Vehicles:
│  ├─ BMW 320i (2010-2015)
│  ├─ BMW 325i (2006-2012)
│  └─ BMW 330i (2012-2019)
├─ Manufacturer: Elring
├─ Quantity: 1 piece
└─ Warranty: 24 months
```

**Value:** Know exactly which parts fit which vehicles

---

### 2. **PRICING DATA**
```
From ePiesa.ro:
├─ Price (RO): 45 RON
├─ Price (EUR): 9.50 EUR
├─ Stock Status: In stock (127 pieces)
├─ Shipping: Free over 100 RON
├─ Delivery Time: 1-2 days
└─ Price History: [45 RON, 48 RON, 42 RON] (last 3 months)

From Autodoc.ro:
├─ Price (RO): 8.99 EUR
├─ Stock: Available
├─ Supplier Rating: 4.8/5
└─ Delivery: 2-3 days
```

**Value:** Real-time pricing, stock availability, delivery times

---

### 3. **ALTERNATIVE PARTS**
```
From ePiesa.ro "Similar Products":
├─ OEM: 11127646050 (Elring) - 45 RON ⭐⭐⭐⭐⭐
├─ OEM: 11127646050 (Corteco) - 38 RON ⭐⭐⭐⭐
├─ OEM: 11127646050 (Ajusa) - 32 RON ⭐⭐⭐⭐
└─ OEM: 11127646050 (Payen) - 28 RON ⭐⭐⭐
```

**Value:** Show users cheaper alternatives with quality ratings

---

### 4. **SUPPLIER INFORMATION**
```
From ePiesa.ro:
├─ Supplier: ePiesa Romania
├─ Rating: 4.9/5 (2,847 reviews)
├─ Response Time: <2 hours
├─ Warranty: 24 months
├─ Return Policy: 30 days
└─ Contact: +40 XXX XXX XXX
```

**Value:** Trust metrics, warranty info, support contact

---

### 5. **RELATED PARTS & KITS**
```
From ePiesa.ro "Customers Also Bought":
├─ Valve Cover Gasket (main part)
├─ Valve Cover Bolts (often needed)
├─ Gasket Sealant (recommended)
├─ Spark Plugs (while you're in there)
└─ Air Filter (maintenance)
```

**Value:** Upsell related parts, complete repair kits

---

### 6. **REVIEWS & FEEDBACK**
```
From ePiesa.ro Reviews:
├─ "Works perfectly on my BMW 320i" ⭐⭐⭐⭐⭐
├─ "Arrived fast, good quality" ⭐⭐⭐⭐⭐
├─ "Fits perfectly, no issues" ⭐⭐⭐⭐⭐
├─ "Slightly different than OEM" ⭐⭐⭐⭐
└─ "Broke after 6 months" ⭐⭐
```

**Value:** Real user feedback, quality validation

---

## 🔄 ARCHITECTURE: Parts Intelligence Pipeline

```
┌─────────────────────────────────────────────────────┐
│ LAYER 1: WEB SCRAPING (Real-Time)                   │
├─────────────────────────────────────────────────────┤
│ • ePiesa.ro - All parts listings                    │
│ • Autodoc.ro - EU pricing + stock                   │
│ • AliExpress - OEM codes + cheap alternatives       │
│ • eBay Motors - Used parts + reviews                │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LAYER 2: DATA PARSING & NORMALIZATION               │
├─────────────────────────────────────────────────────┤
│ Extract:                                            │
│ • OEM codes (normalize format)                      │
│ • Prices (convert to EUR)                           │
│ • Stock levels                                      │
│ • Compatibility (vehicle matching)                  │
│ • Ratings & reviews                                 │
│ • Supplier info                                     │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LAYER 3: AI ENRICHMENT (Kimi 256k)                  │
├─────────────────────────────────────────────────────┤
│ • Link OEM codes to part names                      │
│ • Extract vehicle compatibility                     │
│ • Parse reviews for quality insights                │
│ • Identify part categories                          │
│ • Find alternative parts                            │
│ • Calculate quality scores                          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LAYER 4: DATABASE STORAGE                           │
├─────────────────────────────────────────────────────┤
│ Tables:                                             │
│ • parts_catalog (OEM code → part info)              │
│ • parts_pricing (price by supplier/region)          │
│ • parts_compatibility (OEM → vehicles)              │
│ • parts_reviews (quality ratings)                   │
│ • parts_alternatives (cheaper options)              │
│ • supplier_info (ratings, contact, warranty)        │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ LAYER 5: DIAGNOSTIC INTEGRATION                     │
├─────────────────────────────────────────────────────┤
│ When diagnostic recommends part:                    │
│ 1. Look up OEM code in database                     │
│ 2. Show 3 best suppliers (price/rating)             │
│ 3. Show alternatives (cheaper + quality)            │
│ 4. Show stock availability                          │
│ 5. Show delivery time                               │
│ 6. Show related parts to buy together               │
│ 7. Link to buy (affiliate commission)               │
└─────────────────────────────────────────────────────┘
```

---

## 💾 NEW DATABASE TABLES

```sql
-- All parts with OEM codes
CREATE TABLE parts_catalog (
  id INT PRIMARY KEY,
  oem_code VARCHAR(50) UNIQUE,
  part_name VARCHAR(200),
  part_category VARCHAR(100),
  manufacturer VARCHAR(100),
  description TEXT,
  quantity_per_unit INT,
  warranty_months INT,
  weight_kg DECIMAL,
  dimensions VARCHAR(100),
  created_at TIMESTAMP
);

-- Real-time pricing from multiple suppliers
CREATE TABLE parts_pricing (
  id INT PRIMARY KEY,
  oem_code VARCHAR(50),
  supplier_name VARCHAR(100),
  supplier_country VARCHAR(50),
  price_eur DECIMAL,
  price_gbp DECIMAL,
  price_ron DECIMAL,
  currency VARCHAR(3),
  stock_level INT,
  stock_status ENUM('in_stock', 'low_stock', 'out_of_stock'),
  delivery_days INT,
  shipping_cost_eur DECIMAL,
  free_shipping_threshold DECIMAL,
  last_updated TIMESTAMP,
  supplier_url VARCHAR(500),
  UNIQUE(oem_code, supplier_name)
);

-- Which vehicles use which parts
CREATE TABLE parts_compatibility (
  id INT PRIMARY KEY,
  oem_code VARCHAR(50),
  vehicle_brand VARCHAR(50),
  vehicle_model VARCHAR(50),
  year_from INT,
  year_to INT,
  engine_type VARCHAR(100),
  notes TEXT,
  UNIQUE(oem_code, vehicle_brand, vehicle_model, year_from)
);

-- Quality ratings from reviews
CREATE TABLE parts_reviews (
  id INT PRIMARY KEY,
  oem_code VARCHAR(50),
  supplier_name VARCHAR(100),
  rating FLOAT,
  review_count INT,
  avg_rating FLOAT,
  quality_score FLOAT,
  reliability_score FLOAT,
  delivery_score FLOAT,
  last_updated TIMESTAMP
);

-- Cheaper alternatives
CREATE TABLE parts_alternatives (
  id INT PRIMARY KEY,
  primary_oem VARCHAR(50),
  alternative_oem VARCHAR(50),
  alternative_brand VARCHAR(100),
  price_difference_percent FLOAT,
  quality_rating FLOAT,
  compatibility_notes TEXT,
  user_reviews_count INT,
  avg_user_rating FLOAT
);

-- Supplier information
CREATE TABLE suppliers_info (
  id INT PRIMARY KEY,
  supplier_name VARCHAR(100) UNIQUE,
  supplier_country VARCHAR(50),
  website_url VARCHAR(500),
  rating FLOAT,
  review_count INT,
  response_time_hours INT,
  warranty_policy TEXT,
  return_policy TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  established_year INT,
  payment_methods TEXT,
  shipping_countries TEXT,
  last_updated TIMESTAMP
);

-- Parts that should be bought together
CREATE TABLE parts_bundles (
  id INT PRIMARY KEY,
  primary_oem VARCHAR(50),
  bundle_name VARCHAR(200),
  bundle_description TEXT,
  parts_in_bundle TEXT,  -- JSON: [oem1, oem2, oem3]
  bundle_price_eur DECIMAL,
  savings_percent FLOAT,
  frequency_bought_together INT
);
```

---

## 🎯 USE CASES

### Use Case 1: Smart Parts Recommendation
```
Diagnostic: "Replace valve cover gasket"

System Response:
┌─────────────────────────────────────────┐
│ VALVE COVER GASKET - 11127646050        │
├─────────────────────────────────────────┤
│ BEST PRICE:                             │
│ ✓ ePiesa.ro: 45 RON (€9.50)             │
│   Stock: 127 | Delivery: 1-2 days       │
│   Rating: 4.9/5 (2,847 reviews)         │
│                                         │
│ CHEAPER ALTERNATIVE:                    │
│ • Corteco (same OEM): 38 RON (€8)       │
│   Rating: 4.8/5 | Save 15%              │
│                                         │
│ RELATED PARTS TO BUY:                   │
│ • Valve cover bolts: 12 RON              │
│ • Gasket sealant: 18 RON                 │
│ • Spark plugs: 45 RON                    │
│ BUNDLE PRICE: 115 RON (Save 8%)         │
│                                         │
│ [BUY NOW] [COMPARE PRICES] [REVIEWS]    │
└─────────────────────────────────────────┘
```

### Use Case 2: Regional Price Comparison
```
Same part, different countries:
┌──────────────────────────────────────┐
│ VALVE COVER GASKET PRICES             │
├──────────────────────────────────────┤
│ Romania:  45 RON (€9.50)              │
│ Germany:  €8.99 (cheaper!)            │
│ UK:       £7.50 (€8.80)               │
│ Austria:  €10.50                      │
│                                      │
│ Best Deal: Germany (Autodoc.de)      │
│ Shipping: Free over €50               │
│ Total with shipping: €8.99            │
│ Savings vs Romania: €0.51             │
└──────────────────────────────────────┘
```

### Use Case 3: Quality vs Price
```
┌────────────────────────────────────────┐
│ VALVE COVER GASKET - QUALITY MATRIX    │
├────────────────────────────────────────┤
│ Brand      | Price  | Rating | Reviews │
├────────────────────────────────────────┤
│ Elring     | €9.50  | 4.9/5  | 2,847  │ ⭐ OEM
│ Corteco    | €8.00  | 4.8/5  | 1,256  │ ✓ Best value
│ Ajusa      | €7.20  | 4.6/5  | 892    │
│ Payen      | €6.50  | 4.2/5  | 345    │ Budget
│ Generic    | €4.50  | 3.1/5  | 67     │ ⚠️ Risk
└────────────────────────────────────────┘
```

---

## 🔌 INTEGRATION WITH DIAGNOSTICS

### Current Flow
```
Diagnostic → "Replace valve cover gasket" → User searches for part
```

### New Flow
```
Diagnostic → "Replace valve cover gasket (11127646050)"
           ↓
         [Auto-lookup in parts database]
           ↓
         [Show 3 best suppliers with prices]
           ↓
         [Show alternatives + quality ratings]
           ↓
         [Show related parts to buy together]
           ↓
         [Direct links to buy (affiliate commission)]
           ↓
         User gets best deal + quality assurance
```

---

## 💰 MONETIZATION OPPORTUNITIES

### 1. Affiliate Commissions
- Link to ePiesa.ro, Autodoc.ro, AliExpress
- Earn 3-5% commission per sale
- Estimated: 100 users × 5 parts/year × €50 avg = €25,000/year revenue

### 2. Premium Features
- "Price Alert" - Notify when part price drops
- "Stock Alert" - Notify when part back in stock
- "Comparison Tool" - Advanced price/quality analysis
- Subscription: €2-5/month

### 3. Supplier Partnerships
- Featured listings for suppliers
- Sponsored parts recommendations
- Direct supplier integration (API)
- Revenue: €500-2,000/month per supplier

### 4. Data Licensing
- Sell parts intelligence to repair shops
- Sell pricing data to mechanics
- Sell compatibility data to auto retailers

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Data Collection (2 weeks)
- [ ] Build scrapers for ePiesa.ro, Autodoc.ro
- [ ] Extract OEM codes, prices, stock
- [ ] Store in database
- [ ] Schedule daily updates

### Phase 2: Data Enrichment (1 week)
- [ ] Parse compatibility from listings
- [ ] Extract reviews & ratings
- [ ] Identify alternatives
- [ ] Calculate quality scores

### Phase 3: Integration (1 week)
- [ ] Add parts lookup to diagnostic
- [ ] Show supplier options
- [ ] Add affiliate links
- [ ] Test end-to-end

### Phase 4: Optimization (1 week)
- [ ] Add price comparison
- [ ] Add stock alerts
- [ ] Add bundle recommendations
- [ ] Performance tuning

---

## 📊 EXPECTED IMPACT

| Metric | Before | After |
|--------|--------|-------|
| User can find parts | Manual search | Auto-lookup |
| Price transparency | Unknown | Real-time from 5+ suppliers |
| Time to buy | 30 min search | 2 min click |
| Quality assurance | Unknown | Ratings from 1000s reviews |
| Cost savings | None | 10-20% via alternatives |
| Related sales | None | +30% via bundles |
| User retention | Low | High (one-stop solution) |

---

## 🎯 COMPETITIVE ADVANTAGE

**vs Generic Diagnostic Tools:**
- They show "replace part X"
- We show "replace part X, here's 3 suppliers, prices, reviews, alternatives"

**vs Repair Shops:**
- They use manual catalogs
- We use real-time data from 10+ suppliers

**vs Parts Retailers:**
- They sell parts
- We help users find best deal + quality

This makes **Mechanic Helper** the **complete solution** for car repairs.
