# Product-Orchestrator Deployment Runbook

## ARCHITECTURE OVERVIEW

```
100-Agent Kimi Swarm (NON-STOP)
    ↓
JSONL Files (knowledge-base/)
    ↓
┌─────────────────────────────────────────────────────────┐
│  Docker Compose Stack                                   │
├─────────────────────────────────────────────────────────┤
│  • PostgreSQL + pgvector (Knowledge Base)               │
│  • Redis (Rate Limiting + Job Queue)                    │
│  • Ingestion Worker (JSONL → Postgres)                  │
│  • Product-Orchestrator API (4 endpoints)               │
│  • Prometheus + Grafana (Monitoring)                    │
└─────────────────────────────────────────────────────────┘
    ↓
MySQL App DB (unchanged)
```

---

## PREREQUISITES

### System Requirements
- **OS:** Ubuntu 22.04 LTS or similar
- **CPU:** 2+ cores
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 20GB free (for PostgreSQL + logs)
- **Docker:** 20.10+
- **Docker Compose:** 2.0+

### Required Credentials
```bash
# OpenAI API Key (for embeddings)
export OPENAI_API_KEY="sk-..."

# Kimi API Key (for orchestrator)
export KIMI_API_KEY="sk-..."

# MySQL connection (existing app DB)
export DATABASE_URL="mysql://user:pass@host/db"
```

---

## STEP 1: PROVISION MANAGED POSTGRESQL (RECOMMENDED)

### Option A: Supabase (Easiest)
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Enable pgvector extension:
#    - Go to SQL Editor
#    - Run: CREATE EXTENSION IF NOT EXISTS vector;
# 4. Copy connection string
export POSTGRES_URL="postgresql://user:pass@host:5432/db"
```

### Option B: AWS RDS
```bash
# 1. Create RDS PostgreSQL instance (14+)
# 2. Enable pgvector:
#    psql -h endpoint -U postgres
#    CREATE EXTENSION vector;
# 3. Copy endpoint
export POSTGRES_URL="postgresql://user:pass@endpoint:5432/db"
```

### Option C: Self-Hosted (Docker)
```bash
# Already included in docker-compose.yml
# No additional setup needed
```

---

## STEP 2: PREPARE ENVIRONMENT

### Create .env file
```bash
cd /home/ubuntu/mechanic-helper

cat > .env.orchestrator << 'EOF'
# PostgreSQL (Knowledge Base)
POSTGRES_USER=kb_user
POSTGRES_PASSWORD=secure_password_change_me_NOW
POSTGRES_DB=mechanic_kb
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=redis_password_change_me_NOW
REDIS_PORT=6379

# MySQL (existing app DB)
DATABASE_URL=mysql://user:pass@host/db

# API Keys
OPENAI_API_KEY=sk-...
KIMI_API_KEY=sk-...

# Ports
ORCHESTRATOR_API_PORT=3001
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Grafana
GRAFANA_PASSWORD=admin_password_change_me_NOW

# Logging
LOG_LEVEL=info
EOF

# Source environment
source .env.orchestrator
```

---

## STEP 3: DEPLOY DOCKER STACK

### Start all services
```bash
# Build and start
docker-compose -f docker-compose.orchestrator.yml up -d

# Verify services
docker-compose -f docker-compose.orchestrator.yml ps

# Expected output:
# NAME                    STATUS              PORTS
# mechanic-postgres-kb    Up (healthy)        0.0.0.0:5432->5432/tcp
# mechanic-redis          Up (healthy)        0.0.0.0:6379->6379/tcp
# mechanic-ingestion-worker  Up              
# mechanic-orchestrator-api  Up (healthy)    0.0.0.0:3001->3001/tcp
# mechanic-prometheus     Up                  0.0.0.0:9090->9090/tcp
# mechanic-grafana        Up                  0.0.0.0:3000->3000/tcp
```

### Verify PostgreSQL schema
```bash
# Connect to PostgreSQL
psql postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB

# Check tables
\dt

# Expected tables:
# - vehicles
# - engines
# - dtc_codes
# - symptoms
# - components
# - procedures
# - procedure_steps
# - torque_specs
# - sources
# - evidence
# - embeddings_procedures
# - knowledge_graph
# - ingestion_log

# Check pgvector
SELECT * FROM pg_extension WHERE extname = 'vector';

# Exit
\q
```

### Verify Redis
```bash
# Test Redis connection
redis-cli -p 6379 -a $REDIS_PASSWORD ping

# Expected: PONG
```

---

## STEP 4: VERIFY API ENDPOINTS

### Health check
```bash
curl http://localhost:3001/status

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-03-05T...",
#   "rate_limiter": {
#     "current_requests": 0,
#     "max_requests": 5,
#     "available_slots": 5,
#     "waiting_agents": 0
#   },
#   "queue": {
#     "pending_jobs": 0
#   }
# }
```

---

## STEP 5: TEST ENDPOINTS

### 1. Test /diagnose
```bash
curl -X POST http://localhost:3001/diagnose \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: test-agent" \
  -d '{
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2015,
    "symptoms": ["rough idle", "check engine light"],
    "error_codes": ["P0171"]
  }'

# Expected response:
# {
#   "vehicle": {
#     "make": "Toyota",
#     "model": "Camry",
#     "year": 2015
#   },
#   "matched_procedures": [
#     {
#       "procedure_id": "...",
#       "title": "...",
#       "difficulty_level": "intermediate",
#       "estimated_time_minutes": 45,
#       "similarity_score": 0.87,
#       "steps": [...],
#       "tools_required": [...],
#       "confidence": 0.87
#     }
#   ],
#   "error_codes": [
#     {
#       "code": "P0171",
#       "description": "System Too Lean",
#       "confidence": 0.95
#     }
#   ],
#   "processing_time_ms": 234
# }
```

### 2. Test /parts
```bash
curl -X POST http://localhost:3001/parts \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: test-agent" \
  -d '{
    "component_name": "oxygen sensor",
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2015
  }'

# Expected response:
# {
#   "parts": [
#     {
#       "part_name": "Oxygen Sensor",
#       "part_number": "89467-02070",
#       "supplier_name": "Toyota OEM",
#       "price_usd": 45.99,
#       "stock_quantity": 150,
#       "lead_time_days": 2,
#       "quality_rating": 4.8
#     }
#   ],
#   "total_results": 1
# }
```

### 3. Test /estimate
```bash
curl -X POST http://localhost:3001/estimate \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: test-agent" \
  -d '{
    "procedure_title": "Replace Oxygen Sensor",
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2015
  }'

# Expected response:
# {
#   "procedure": "Replace Oxygen Sensor",
#   "estimated_labor_hours": 0.75,
#   "estimated_labor_cost_usd": 56.25,
#   "estimated_parts_cost_usd": 45.99,
#   "total_estimated_cost_usd": 102.24,
#   "confidence": 0.75
# }
```

### 4. Test /case
```bash
curl -X POST http://localhost:3001/case \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: test-agent" \
  -d '{
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2015,
    "error_code": "P0171",
    "symptoms": ["rough idle"],
    "repair_performed": "Replaced oxygen sensor",
    "parts_replaced": ["Oxygen Sensor"],
    "labor_hours": 0.75,
    "actual_cost_usd": 102.24,
    "resolution_status": "resolved",
    "customer_satisfaction_score": 4.8
  }'

# Expected response:
# {
#   "case_id": "CASE-1709638...",
#   "status": "stored",
#   "message": "Case outcome recorded successfully"
# }
```

---

## STEP 6: MONITORING

### Prometheus
- URL: http://localhost:9090
- Metrics: API latency, queue depth, rate limiter status

### Grafana
- URL: http://localhost:3000
- Username: admin
- Password: (from GRAFANA_PASSWORD env var)
- Dashboards: API Performance, Rate Limiter, Queue Depth

### Logs
```bash
# View ingestion worker logs
docker-compose -f docker-compose.orchestrator.yml logs -f ingestion-worker

# View API logs
docker-compose -f docker-compose.orchestrator.yml logs -f orchestrator-api

# View all logs
docker-compose -f docker-compose.orchestrator.yml logs -f
```

---

## STEP 7: PRODUCTION DEPLOYMENT

### On VPS (e.g., DigitalOcean, AWS EC2)

```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/your-org/mechanic-helper.git
cd mechanic-helper

# 5. Create .env file (use strong passwords!)
nano .env.orchestrator

# 6. Start services
docker-compose -f docker-compose.orchestrator.yml up -d

# 7. Setup SSL (optional but recommended)
# Use Let's Encrypt + Nginx reverse proxy
```

### Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 443 ssl http2;
    server_name api.mechanic-helper.com;

    ssl_certificate /etc/letsencrypt/live/api.mechanic-helper.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mechanic-helper.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## TROUBLESHOOTING

### PostgreSQL connection fails
```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.orchestrator.yml logs postgres-kb

# Verify credentials
psql postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB

# Restart service
docker-compose -f docker-compose.orchestrator.yml restart postgres-kb
```

### Redis connection fails
```bash
# Check Redis logs
docker-compose -f docker-compose.orchestrator.yml logs redis

# Test connection
redis-cli -p 6379 -a $REDIS_PASSWORD ping

# Restart service
docker-compose -f docker-compose.orchestrator.yml restart redis
```

### API returns 500 errors
```bash
# Check API logs
docker-compose -f docker-compose.orchestrator.yml logs orchestrator-api

# Verify environment variables
docker-compose -f docker-compose.orchestrator.yml config | grep -E "OPENAI|KIMI"

# Restart API
docker-compose -f docker-compose.orchestrator.yml restart orchestrator-api
```

### Rate limiter not working
```bash
# Check rate limiter status
curl http://localhost:3001/status | jq '.rate_limiter'

# Verify Redis is running
docker-compose -f docker-compose.orchestrator.yml ps redis

# Check Redis data
redis-cli -p 6379 -a $REDIS_PASSWORD KEYS "*"
```

---

## SCALING

### Horizontal Scaling (Multiple API instances)
```bash
# Update docker-compose.yml
# Add multiple orchestrator-api services with different ports
# Use load balancer (Nginx, HAProxy) to distribute traffic
```

### Vertical Scaling (More resources)
```bash
# Update docker-compose.yml
# Increase PostgreSQL: max_connections, shared_buffers
# Increase Redis: maxmemory
# Increase API: NODE_OPTIONS="--max-old-space-size=4096"
```

---

## MAINTENANCE

### Daily
- Monitor logs for errors
- Check API response times (should be <500ms)
- Verify rate limiter is working (5 req/min)

### Weekly
- Check disk space (PostgreSQL + logs)
- Review Grafana dashboards
- Backup PostgreSQL database

### Monthly
- Update Docker images
- Review and optimize slow queries
- Analyze token usage and costs

---

## ROLLBACK PROCEDURE

### If deployment fails
```bash
# Stop all services
docker-compose -f docker-compose.orchestrator.yml down

# Restore from backup
# (Ensure you have PostgreSQL backups)

# Restart
docker-compose -f docker-compose.orchestrator.yml up -d
```

---

## SUCCESS CRITERIA

- ✅ All services healthy (docker-compose ps)
- ✅ /status endpoint returns 200 OK
- ✅ /diagnose returns results in <500ms
- ✅ Rate limiter enforces 5 req/min
- ✅ Logs show ingestion worker processing JSONL
- ✅ Grafana dashboards show metrics
- ✅ 100-agent swarm continues running (no interruption)
- ✅ MySQL app DB unchanged (no downtime)

---

## SUPPORT

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.orchestrator.yml logs -f`
2. Verify environment variables: `cat .env.orchestrator`
3. Test endpoints: `curl http://localhost:3001/status`
4. Check PostgreSQL: `psql postgresql://...`
5. Check Redis: `redis-cli -p 6379 -a $REDIS_PASSWORD ping`

