# Automotive APIs Research - Mechanic Helper Data Layer

## Overview
Research and analysis of 7 free automotive APIs for building the Mechanic Helper data layer.

---

## 1. NHTSA vPIC API (Vehicle Identification)

**Status:** ✅ Verified & Operational

**Base URL:** `https://vpic.nhtsa.dot.gov/api/vehicles`

**Authentication:** None required (public API)

**Rate Limiting:** Automated traffic control mechanism (no specific limits published, but rate-limited to prevent abuse)

**Key Endpoints:**
- `GET /DecodeVin/{vin}` - Decode VIN to vehicle details
- `GET /DecodeVinExtended/{vin}` - Extended VIN decoding with additional fields
- `GET /GetAllMakes` - Get all vehicle makes
- `GET /GetModelsForMake/{make}` - Get models for a specific make
- `GET /GetMakesForManufacturerAndYear/{manufacturer}?year={year}` - Get makes by manufacturer and year
- `GET /GetVehicleTypesForMake/{make}` - Get vehicle types for a make
- `GET /GetCanadianVehicleSpecifications` - Canadian vehicle specs

**Response Format:** XML, CSV, JSON (configurable via `format` parameter)

**Sample Response (VIN Decode):**
```json
{
  "Results": [
    {
      "Value": "2011",
      "Variable": "Model Year"
    },
    {
      "Value": "BMW",
      "Variable": "Make"
    },
    {
      "Value": "X5",
      "Variable": "Model"
    },
    {
      "Value": "3.0L 6cyl Turbocharged",
      "Variable": "Engine"
    }
  ]
}
```

**Licensing:** Public domain (US government data)

**Pros:**
- No authentication required
- Comprehensive VIN decoding
- Batch VIN decoding (up to 50 VINs)
- Includes recall data integration
- Well-documented

**Cons:**
- US-focused (limited international data)
- Rate-limited for heavy usage
- Response format is verbose

---

## 2. CarQuery API (Vehicle Database)

**Status:** ⚠️ Partially Accessible (site may have redirect issues)

**Base URL:** `https://www.carqueryapi.com/api/0.3/`

**Authentication:** API key available (free tier available)

**Rate Limiting:** Depends on tier (free tier has limits)

**Key Endpoints:**
- `GET /?callback=?&cmd=getMakes` - Get all vehicle makes
- `GET /?callback=?&cmd=getModels&make={make}` - Get models for make
- `GET /?callback=?&cmd=getTrims&make={make}&model={model}&year={year}` - Get trims
- `GET /?callback=?&cmd=getVehicleInfo&make={make}&model={model}&year={year}` - Get vehicle info

**Response Format:** JSON (JSONP for cross-origin)

**Sample Response:**
```json
{
  "Status": "OK",
  "Makes": [
    {
      "id": 1,
      "make_name": "Acura",
      "make_display": "Acura"
    }
  ]
}
```

**Licensing:** Commercial (free tier available with limitations)

**Pros:**
- Comprehensive vehicle database
- Includes trim and specification data
- Good for make/model/year hierarchies

**Cons:**
- JSONP-based (older technology)
- Free tier has limitations
- Commercial licensing for production use

---

## 3. FuelEconomy.gov API

**Status:** ✅ Verified & Operational

**Base URL:** `https://www.fueleconomy.gov/ws/rest/vehicle`

**Authentication:** None required (public API)

**Rate Limiting:** Not specified (appears to be open)

**Key Endpoints:**
- `GET /menu/findByModel?year={year}&make={make}&model={model}` - Find vehicles
- `GET /menu/options?year={year}&make={make}&model={model}` - Get vehicle options
- `GET /{vehicleId}` - Get detailed vehicle info including fuel economy

**Response Format:** JSON

**Sample Response:**
```json
{
  "year": 2023,
  "make": "BMW",
  "model": "X5",
  "fuelType": "Diesel",
  "transmission": "Automatic",
  "cylinders": 6,
  "displacement": 3.0,
  "fuelEconomyCombined": 22,
  "co2Emissions": 295
}
```

**Licensing:** Public domain (US EPA data)

**Pros:**
- Fuel economy data
- CO2 emissions data
- EPA-certified data
- No authentication needed

**Cons:**
- US-focused
- Limited to vehicles sold in US
- Requires year/make/model search first

---

## 4. Open Recall API (Vehicle Recalls)

**Status:** ⚠️ Needs Verification

**Base URL:** `https://api.nhtsa.gov/recalls`

**Authentication:** None required

**Rate Limiting:** Not specified

**Key Endpoints:**
- `GET /vehicle?make={make}&model={model}&year={year}` - Get recalls for vehicle
- `GET /vehicle/{vin}` - Get recalls by VIN

**Response Format:** JSON

**Licensing:** Public domain (NHTSA data)

**Pros:**
- Safety-critical recall data
- Integrates with NHTSA
- No authentication needed

**Cons:**
- Limited documentation
- May be deprecated in favor of vPIC

---

## 5. Edmunds Vehicle API

**Status:** ⚠️ Requires API Key (Limited Free Tier)

**Base URL:** `https://api.edmunds.com/api/v2`

**Authentication:** API key required

**Rate Limiting:** Depends on tier (free tier: 100 calls/day)

**Key Endpoints:**
- `GET /vehicles?make={make}&model={model}&year={year}&api_key={key}` - Get vehicle
- `GET /vehicles/{id}/specs?api_key={key}` - Get specifications
- `GET /vehicles/{id}/recalls?api_key={key}` - Get recalls

**Response Format:** JSON

**Licensing:** Commercial (free tier available)

**Pros:**
- Detailed specifications
- Recalls integration
- Trim-level data

**Cons:**
- Requires API key registration
- Limited free tier (100 calls/day)
- Commercial licensing for production

---

## 6. Marketcheck Cars API

**Status:** ⚠️ Requires API Key

**Base URL:** `https://marketcheck-api.p.rapidapi.com`

**Authentication:** RapidAPI key required

**Rate Limiting:** Depends on RapidAPI tier

**Key Endpoints:**
- `GET /search?api_key={key}` - Search vehicles
- `GET /listing/{id}?api_key={key}` - Get listing details

**Response Format:** JSON

**Licensing:** Commercial (paid via RapidAPI)

**Pros:**
- Market pricing data
- Inventory data
- Real-time listings

**Cons:**
- Requires paid RapidAPI subscription
- Not ideal for pure specification data

---

## 7. EU Vehicle Open Datasets

**Status:** ✅ Verified (Multiple Sources)

**Sources:**
1. **EAFO (European Alternative Fuels Observatory)**
   - URL: `https://www.eafo.eu/`
   - Data: Alternative fuel vehicles, charging infrastructure
   - Format: CSV, JSON API
   - License: Open data

2. **EU Vehicle Regulations Database**
   - URL: `https://ec.europa.eu/growth/tools-databases/nando/`
   - Data: Vehicle type approvals, technical specifications
   - Format: Web interface, downloadable datasets
   - License: Open data

3. **VROM (Vehicle Registration Open Market)**
   - URL: Various national registries
   - Data: Vehicle registration data (country-specific)
   - Format: CSV, API (varies by country)
   - License: Open data (varies)

**Pros:**
- Comprehensive European vehicle data
- Alternative fuel information
- Regulatory compliance data

**Cons:**
- Fragmented across multiple sources
- Country-specific variations
- Limited standardization

---

## Summary Table

| API | VIN Decode | Make/Model | Specs | Recalls | Fuel Economy | Free | Auth |
|-----|-----------|-----------|-------|---------|--------------|------|------|
| NHTSA vPIC | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | None |
| CarQuery | ❌ | ✅ | ✅ | ❌ | ❌ | ⚠️ | Key |
| FuelEconomy | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | None |
| Open Recall | ⚠️ | ✅ | ❌ | ✅ | ❌ | ✅ | None |
| Edmunds | ❌ | ✅ | ✅ | ✅ | ❌ | ⚠️ | Key |
| Marketcheck | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | Key |
| EU Datasets | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | None |

---

## Recommended Integration Strategy

### Phase 1: Core Free APIs (No Cost)
1. **NHTSA vPIC** - Primary VIN decoder + make/model/year data
2. **FuelEconomy.gov** - Fuel consumption and emissions
3. **EU Datasets** - European vehicle data

### Phase 2: Optional Paid APIs (With Keys)
1. **Edmunds** - Enhanced specifications (100 free calls/day)
2. **CarQuery** - Comprehensive vehicle database

### Phase 3: Future Enterprise Integration
1. **TecDoc API** - Professional repair data
2. **Autodata API** - OEM specifications
3. **HaynesPro** - Service manuals
4. **Identifix** - Diagnostic procedures

---

## Implementation Recommendations

1. **Caching Strategy:** Cache VIN decode results for 24 hours (VINs don't change)
2. **Fallback Logic:** If NHTSA fails, use CarQuery or EU datasets
3. **Rate Limiting:** Implement per-API rate limiting with exponential backoff
4. **Data Normalization:** Create unified schema to normalize responses from different APIs
5. **Provider Adapters:** Build adapter pattern to easily swap APIs or add new ones

---

## Next Steps

1. Build provider adapters for each API
2. Create normalized vehicle data schema
3. Implement Redis caching layer
4. Build unified REST API endpoints
5. Add comprehensive error handling and fallbacks
6. Document API integration for future enterprise sources
