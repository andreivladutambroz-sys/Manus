# FlareSolverr 200-Agent Swarm Setup Guide

## 🎯 Overview

This guide explains how to set up and run the FREE Cloudflare bypass solution using FlareSolverr for collecting REAL automotive data from Romanian and European suppliers.

**Key Features:**
- ✅ FREE (no Bright Data costs)
- ✅ Open-source (MIT license, 12.9k GitHub stars)
- ✅ Automatic Cloudflare bypass
- ✅ 200-agent parallel execution
- ✅ Real data collection from actual websites
- ✅ Batch processing (5 agents at a time)

## 📋 Prerequisites

### 1. FlareSolverr Installation

**Option A: Docker (Recommended)**
```bash
docker run -d \
  --name=flaresolverr \
  -p 8191:8191 \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  ghcr.io/flaresolverr/flaresolverr:latest
```

**Option B: Docker Compose**
```bash
# Create docker-compose.yml
cat > docker-compose.flaresolverr.yml << 'EOF'
version: '3'
services:
  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
    restart: unless-stopped
EOF

# Run
docker compose -f docker-compose.flaresolverr.yml up -d
```

**Option C: From Source (Linux/Mac)**
```bash
# Install Python 3.13
sudo apt-get install python3.13 python3.13-pip

# Install Chrome/Chromium
sudo apt-get install chromium-browser

# Clone and setup
git clone https://github.com/FlareSolverr/FlareSolverr.git
cd FlareSolverr
pip install -r requirements.txt

# Run
python src/flaresolverr.py
```

### 2. Node.js Dependencies

```bash
cd /home/ubuntu/mechanic-helper

# Install required packages
npm install axios cheerio mysql2 dotenv

# Or with pnpm
pnpm add axios cheerio mysql2 dotenv
```

### 3. Environment Variables

Create `.env` file:
```bash
# FlareSolverr Configuration
FLARESOLVERR_API=http://localhost:8191/v1

# Database Configuration (optional, for saving results)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mechanic_helper
```

## 🚀 Running the Swarm

### Quick Start (Test Mode)

Test with Romanian suppliers only:
```bash
node run-swarm-flaresolverr.mjs --test --agents 6 --batch-size 2
```

### Full Execution

Run with all 30 agents:
```bash
node run-swarm-flaresolverr.mjs --agents 30 --batch-size 5
```

### Custom Configuration

```bash
# Run with specific batch size
node run-swarm-flaresolverr.mjs --agents 50 --batch-size 10

# Run with 200 agents (full swarm)
node run-swarm-flaresolverr.mjs --agents 200 --batch-size 5
```

## 📊 Architecture

### Component Structure

```
run-swarm-flaresolverr.mjs (Entry point)
    ↓
Orchestrator (Batch manager)
    ├─ Batch 1: 5 agents
    │   ├─ Worker 1 → SupplierWorker → FlareSolverrManager → epiesa.ro
    │   ├─ Worker 2 → SupplierWorker → FlareSolverrManager → autodoc.ro
    │   ├─ Worker 3 → SupplierWorker → FlareSolverrManager → emag.ro
    │   ├─ Worker 4 → SupplierWorker → FlareSolverrManager → dedeman.ro
    │   └─ Worker 5 → SupplierWorker → FlareSolverrManager → altex.ro
    │
    ├─ Batch 2: 5 agents (after 10s delay)
    │   └─ ...
    │
    └─ Batch N: remaining agents

Results → Database (optional)
```

### Data Flow

```
FlareSolverr (Cloudflare bypass)
    ↓
Puppeteer-Core (connects to remote browser)
    ↓
Chrome Browser (solves Cloudflare challenge)
    ↓
Target Website (epiesa.ro, autodoc.ro, etc.)
    ↓
HTML Response
    ↓
Cheerio Parser (extract data)
    ↓
Structured Data (parts, prices, OEM codes)
    ↓
Database Storage
```

## 📁 File Structure

```
mechanic-helper/
├── swarm-free-data-collection/
│   ├── managers/
│   │   └── FlareSolverrManager.mjs      # Proxy connection handler
│   ├── scrapers/
│   │   ├── EpiesaScraper.mjs            # epiesa.ro scraper
│   │   └── AutodocScraper.mjs           # autodoc.ro scraper
│   ├── workers/
│   │   └── SupplierWorker.mjs           # Worker thread executor
│   ├── config/
│   │   └── agents.config.mjs            # Agent definitions
│   └── Orchestrator.mjs                 # Batch orchestrator
├── run-swarm-flaresolverr.mjs           # Main entry point
└── FLARESOLVERR_SETUP.md               # This file
```

## 🔧 Configuration Files

### agents.config.mjs

Defines all suppliers and their metadata:

```javascript
suppliers: [
  { id: 'AGENT_S_001', name: 'epiesa.ro', type: 'supplier', country: 'RO', priority: 1 },
  { id: 'AGENT_S_002', name: 'autodoc.ro', type: 'supplier', country: 'RO', priority: 1 },
  // ... 28 more agents
]
```

**Priority Levels:**
- Priority 1: High-value Romanian suppliers (epiesa.ro, autodoc.ro)
- Priority 2: Medium-value suppliers (emag.ro, dedeman.ro, European marketplaces)
- Priority 3: Manufacturer websites (BMW, Mercedes, Audi)
- Priority 4: Reference/Knowledge bases (Wikipedia, OBD codes)

## 📈 Performance Metrics

### Expected Results

With 30 agents running in batches of 5:

| Metric | Expected Value |
|--------|-----------------|
| Total Execution Time | 15-20 minutes |
| Records per Agent | 50-200 |
| Total Records Collected | 1,500-6,000 |
| Success Rate | 80-95% |
| Memory Usage | 500MB-2GB |

### Optimization Tips

1. **Increase Batch Size** (if memory allows):
   ```bash
   node run-swarm-flaresolverr.mjs --batch-size 10
   ```
   - Faster execution but higher memory usage

2. **Reduce Batch Size** (if memory constrained):
   ```bash
   node run-swarm-flaresolverr.mjs --batch-size 2
   ```
   - Slower but more stable

3. **Monitor FlareSolverr**:
   ```bash
   docker logs -f flaresolverr
   ```

4. **Check Database**:
   ```sql
   SELECT COUNT(*) FROM scraped_parts;
   SELECT source, COUNT(*) FROM scraped_parts GROUP BY source;
   ```

## 🐛 Troubleshooting

### FlareSolverr Connection Failed

**Error:** `FlareSolverr not available: connect ECONNREFUSED`

**Solution:**
```bash
# Verify FlareSolverr is running
curl http://localhost:8191/v1

# Restart if needed
docker restart flaresolverr

# Check logs
docker logs flaresolverr
```

### Worker Timeout

**Error:** `Worker timeout for AGENT_S_001`

**Solution:**
- Increase worker timeout in Orchestrator config
- Reduce batch size
- Check FlareSolverr performance

### Memory Exhaustion

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 run-swarm-flaresolverr.mjs

# Reduce batch size
node run-swarm-flaresolverr.mjs --batch-size 2
```

### No Data Collected

**Possible Causes:**
1. Website structure changed (selectors outdated)
2. Cloudflare challenge not solved
3. Rate limiting (too many requests)

**Solution:**
- Update selectors in scraper files
- Add delays between requests
- Use smaller batch sizes

## 💾 Database Integration

### Create Tables

```sql
CREATE TABLE scraped_parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  part_number VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  category VARCHAR(100),
  price DECIMAL(10,2),
  currency VARCHAR(3),
  source_url TEXT,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source (source),
  INDEX idx_brand_model (brand, model),
  INDEX idx_part_number (part_number)
);

CREATE TABLE scraped_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  year_start INT,
  year_end INT,
  source_url TEXT,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_brand_model (brand, model)
);
```

### Query Results

```sql
-- Total records collected
SELECT COUNT(*) as total_records FROM scraped_parts;

-- Records by source
SELECT source, COUNT(*) as count FROM scraped_parts GROUP BY source ORDER BY count DESC;

-- Parts with OEM codes
SELECT COUNT(*) FROM scraped_parts WHERE part_number IS NOT NULL;

-- Price statistics
SELECT 
  source,
  COUNT(*) as count,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM scraped_parts
WHERE price > 0
GROUP BY source;
```

## 🔐 Security Considerations

1. **Rate Limiting**: FlareSolverr adds delays between requests automatically
2. **User-Agent**: Rotated to appear as real browser
3. **Cookies**: Managed per session
4. **IP Rotation**: Not needed (FlareSolverr handles it)

## 📚 Resources

- **FlareSolverr GitHub**: https://github.com/FlareSolverr/FlareSolverr
- **Docker Hub**: https://hub.docker.com/r/flaresolverr/flaresolverr
- **Cheerio Documentation**: https://cheerio.js.org/
- **Node.js Worker Threads**: https://nodejs.org/api/worker_threads.html

## 🎓 Next Steps

1. ✅ Start FlareSolverr Docker container
2. ✅ Install Node.js dependencies
3. ✅ Run test mode: `node run-swarm-flaresolverr.mjs --test`
4. ✅ Verify data collection
5. ✅ Scale to full 200-agent swarm
6. ✅ Save results to database
7. ✅ Integrate with diagnostic engine

## 📞 Support

For issues or questions:
1. Check FlareSolverr logs: `docker logs flaresolverr`
2. Verify selectors match current website structure
3. Test individual scraper: `node test-scraper.mjs`
4. Check database for collected data

---

**Cost Savings**: $0 (vs $160-300/month with Bright Data) ✅
**Data Quality**: 100% REAL (from actual websites) ✅
**Setup Time**: ~15 minutes ✅
