# Resource & Storage Upgrade Options

**Purpose:** Evaluate options to acquire additional compute, memory, and storage for swarm data collection  
**Date:** March 5, 2026

---

## OPTION 1: MANUS SANDBOX UPGRADE (Recommended for MVP)

### What is it?
Upgrade the current Manus sandbox to higher tier with more CPU, RAM, and storage.

### Specifications Available
```
Current Tier (Free):
├─ RAM: 3.8 GB
├─ CPU: 6 cores
├─ Storage: 42 GB
└─ Cost: $0/month

Tier 2 (Standard):
├─ RAM: 8 GB
├─ CPU: 8 cores
├─ Storage: 100 GB
└─ Cost: ~$10-20/month

Tier 3 (Professional):
├─ RAM: 16 GB
├─ CPU: 16 cores
├─ Storage: 500 GB
└─ Cost: ~$50-100/month

Tier 4 (Enterprise):
├─ RAM: 32+ GB
├─ CPU: 32+ cores
├─ Storage: 1+ TB
└─ Cost: Custom pricing
```

### Pros
✅ **Seamless integration** - No migration needed
✅ **Same environment** - Keep existing project setup
✅ **Automatic backups** - Manus handles infrastructure
✅ **Pre-configured** - Database, Node.js, all tools ready
✅ **Fast deployment** - Instant upgrade
✅ **Support included** - Manus team available

### Cons
❌ **Limited customization** - Fixed tier options
❌ **Potential cost** - Scales with usage
❌ **Vendor lock-in** - Tied to Manus platform

### Cost Analysis
```
For 2-3 day swarm collection:
├─ Tier 2 (8GB RAM): $10-20 one-time
├─ Tier 3 (16GB RAM): $50-100 one-time
└─ Tier 4 (32GB RAM): Custom quote

For continuous operation (30 days):
├─ Tier 2: $10-20/month
├─ Tier 3: $50-100/month
└─ Tier 4: $200+/month
```

### How to Request
```
Contact: https://help.manus.im
Request: "Upgrade sandbox to Tier 2 (8GB RAM, 8 CPU, 100GB storage)"
Timeline: 24-48 hours typically
```

---

## OPTION 2: CLOUD VPS (AWS, DigitalOcean, Linode)

### What is it?
Rent a dedicated virtual machine from a cloud provider.

### Recommended Configurations

#### DigitalOcean Droplet (Recommended - Simplest)
```
Basic Setup:
├─ 8GB RAM / 4 CPU / 160GB SSD
├─ Cost: $24/month
└─ Setup time: 15 minutes

Recommended Setup:
├─ 16GB RAM / 8 CPU / 320GB SSD
├─ Cost: $96/month
└─ Setup time: 15 minutes

High-Performance:
├─ 32GB RAM / 16 CPU / 640GB SSD
├─ Cost: $192/month
└─ Setup time: 15 minutes
```

#### AWS EC2 (Most Flexible)
```
t3.large (2 vCPU, 8GB RAM):
├─ On-demand: $0.0832/hour = ~$60/month
├─ Spot (50% discount): ~$30/month
└─ Storage: $0.10/GB/month (EBS)

t3.xlarge (4 vCPU, 16GB RAM):
├─ On-demand: $0.1664/hour = ~$120/month
├─ Spot: ~$60/month
└─ Storage: $0.10/GB/month (EBS)

c5.2xlarge (8 vCPU, 16GB RAM):
├─ On-demand: $0.34/hour = ~$245/month
├─ Spot: ~$122/month
└─ Storage: $0.10/GB/month (EBS)
```

#### Linode (Good Balance)
```
Linode 8GB:
├─ 4 vCPU / 8GB RAM / 160GB SSD
├─ Cost: $24/month
└─ Dedicated CPU option: $48/month

Linode 16GB:
├─ 6 vCPU / 16GB RAM / 320GB SSD
├─ Cost: $48/month
└─ Dedicated CPU option: $96/month

Linode 32GB:
├─ 8 vCPU / 32GB RAM / 640GB SSD
├─ Cost: $96/month
└─ Dedicated CPU option: $192/month
```

### Pros
✅ **Full control** - Root access, install anything
✅ **Scalable** - Easy to upgrade/downgrade
✅ **Portable** - Can migrate to different provider
✅ **Cost-effective** - Pay only for what you use
✅ **No vendor lock-in** - Standard Linux/Node.js
✅ **Spot instances** - 50% discount on AWS (for non-critical)

### Cons
❌ **Setup required** - Need to configure Node.js, MySQL, etc.
❌ **Maintenance** - You manage updates, security patches
❌ **Network latency** - Slightly slower than local sandbox
❌ **Data transfer costs** - Egress bandwidth charged
❌ **No automatic backups** - Must configure yourself

### Setup Time
```
DigitalOcean/Linode: 30-60 minutes
AWS: 1-2 hours
```

### Cost Analysis (30 days)
```
DigitalOcean 16GB:        $96/month
Linode 16GB:              $48/month
AWS t3.xlarge (spot):     ~$60/month
AWS c5.2xlarge (spot):    ~$122/month
```

---

## OPTION 3: SUPABASE DATABASE UPGRADE

### What is it?
Upgrade Supabase (MySQL) database tier for more storage and performance.

### Current Setup
```
Supabase TiDB Serverless (Free):
├─ Storage: 5 GB
├─ Connections: 100 concurrent
├─ QPS: 10,000 req/sec
├─ Cost: $0/month
```

### Upgrade Options
```
TiDB Serverless (Pro):
├─ Storage: 100 GB
├─ Connections: 500 concurrent
├─ QPS: 100,000 req/sec
├─ Cost: ~$50-100/month

TiDB Dedicated:
├─ Storage: 500+ GB
├─ Connections: 5,000+ concurrent
├─ QPS: 1M+ req/sec
├─ Cost: $500+/month
```

### Alternative: Managed MySQL Hosting
```
AWS RDS MySQL:
├─ db.t3.medium (2 vCPU, 4GB RAM, 100GB storage)
├─ Cost: ~$30/month
└─ Includes automated backups

DigitalOcean Managed MySQL:
├─ 1GB RAM / 25GB storage
├─ Cost: $15/month
└─ Includes automated backups

Linode Managed MySQL:
├─ 4GB RAM / 100GB storage
├─ Cost: $30/month
└─ Includes automated backups
```

### Pros
✅ **Managed service** - No maintenance
✅ **Automatic backups** - Data safety
✅ **High availability** - Replication included
✅ **Easy scaling** - Upgrade with one click

### Cons
❌ **More expensive** - Premium for managed
❌ **Potential vendor lock-in** - Data export may be complex

---

## OPTION 4: S3 / OBJECT STORAGE (For Data Archive)

### What is it?
Cloud storage for raw data, backups, and long-term archives.

### Providers & Pricing

#### AWS S3
```
Standard Storage:
├─ $0.023/GB/month
├─ 1 TB/month = $23
├─ 10 TB/month = $230
└─ Egress: $0.09/GB

Glacier (Archive):
├─ $0.004/GB/month
├─ 1 TB/month = $4
└─ Retrieval: $0.01/GB + retrieval fee
```

#### DigitalOcean Spaces
```
250GB included:
├─ $5/month
├─ $0.02/GB overage
└─ Egress: $0.02/GB
```

#### Backblaze B2
```
$0.006/GB/month storage
$0.01/GB egress
Very cost-effective for backups
```

### Use Case for Mechanic Helper
```
Daily snapshots (30 days):
├─ 10 GB raw data per day
├─ 300 GB total
├─ S3 Standard: ~$7/month
├─ Glacier: ~$1.20/month
└─ Backblaze: ~$1.80/month
```

---

## OPTION 5: HYBRID APPROACH (Recommended)

### Combine Multiple Services

```
┌─────────────────────────────────────────────┐
│ Manus Sandbox (Tier 2)                      │
│ ├─ 8GB RAM / 8 CPU / 100GB storage          │
│ ├─ Cost: $15/month                          │
│ └─ Primary: Swarm orchestration + processing│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Supabase MySQL (Current Free Tier)          │
│ ├─ 5GB database storage                     │
│ ├─ Cost: $0/month                           │
│ └─ Primary: Production data storage         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ DigitalOcean Spaces (S3-compatible)         │
│ ├─ 250GB + $0.02/GB overage                 │
│ ├─ Cost: $5/month                           │
│ └─ Primary: Raw data archive + backups      │
└─────────────────────────────────────────────┘

TOTAL COST: ~$20/month
```

### Why This Works
✅ **Manus Sandbox:** Best for swarm (familiar environment)
✅ **Supabase:** Already integrated, free tier sufficient
✅ **DigitalOcean Spaces:** Cheap backup/archive storage
✅ **Total cost:** $20/month (very reasonable)
✅ **No vendor lock-in:** Can migrate any component

---

## OPTION 6: DEDICATED SERVER (For Long-term)

### What is it?
Rent a physical or bare-metal server for maximum performance.

### Providers
```
Hetzner (Germany - Best Value):
├─ 64GB RAM / 16 CPU / 2TB SSD
├─ Cost: €50-80/month (~$55-88)
└─ Excellent for EU data

OVH (France):
├─ 64GB RAM / 16 CPU / 2TB SSD
├─ Cost: €50-100/month
└─ Good European coverage

AWS Bare Metal:
├─ 384GB RAM / 96 CPU / 10TB storage
├─ Cost: $4-5/hour = $3000+/month
└─ Overkill for this project

Linode Bare Metal:
├─ 64GB RAM / 16 CPU / 2TB SSD
├─ Cost: $480/month
└─ Good performance
```

### Pros
✅ **Maximum performance** - No virtualization overhead
✅ **Unlimited resources** - No sharing with other users
✅ **Cost-effective at scale** - Better $/GB ratio

### Cons
❌ **Expensive** - $50-500/month
❌ **Overkill for MVP** - Way more than needed
❌ **Setup complex** - Need system administration
❌ **Long-term commitment** - Usually 12-month contracts

---

## COMPARISON TABLE

| Option | Cost/Month | Setup Time | Control | Recommended |
|--------|-----------|-----------|---------|------------|
| **Manus Tier 2** | $15 | 1 hour | Medium | ✅ MVP |
| **DigitalOcean 16GB** | $48 | 30 min | High | ✅ Alternative |
| **Linode 16GB** | $48 | 30 min | High | ✅ Alternative |
| **AWS t3.xlarge** | $120 | 1 hour | High | ⭐ Production |
| **Supabase Pro** | $50-100 | Instant | Low | ⭐ If needed |
| **S3/Spaces** | $5-20 | Instant | High | ✅ Archive |
| **Dedicated Server** | $50-500 | 2 hours | Very High | ❌ Overkill |

---

## RECOMMENDATION FOR MECHANIC HELPER

### Phase 1: MVP (Next 1-2 weeks)
```
✅ Manus Sandbox Tier 2 upgrade
   ├─ Cost: $15/month
   ├─ RAM: 8GB (enough for sequential waves)
   ├─ Storage: 100GB (plenty for raw data)
   └─ Time: 1 hour setup

✅ Keep Supabase free tier
   ├─ Cost: $0/month
   ├─ Storage: 5GB (enough for 1.5GB data)
   └─ Upgrade later if needed

✅ Add DigitalOcean Spaces for backups
   ├─ Cost: $5/month
   ├─ Storage: 250GB
   └─ Auto-backup raw data daily

TOTAL: $20/month
```

### Phase 2: Scale (After MVP success)
```
If data > 5GB:
├─ Upgrade Supabase to Pro ($50-100/month)
├─ OR migrate to AWS RDS ($30/month)

If need more compute:
├─ Upgrade Manus to Tier 3 ($50-100/month)
├─ OR rent DigitalOcean 32GB ($96/month)

If continuous 24/7 operation:
├─ Dedicated server ($50-500/month)
├─ OR AWS Reserved Instances (30% discount)
```

### Phase 3: Production (6+ months)
```
Full infrastructure:
├─ Dedicated server or AWS (compute)
├─ AWS RDS or Managed MySQL (database)
├─ S3 or Spaces (storage)
├─ CloudFlare (CDN)
└─ Total: $200-500/month
```

---

## HOW TO REQUEST UPGRADES

### Manus Sandbox Upgrade
```
1. Go to: https://help.manus.im
2. Submit request: "Upgrade sandbox to Tier 2"
3. Wait: 24-48 hours
4. Confirm: Check available resources
```

### DigitalOcean / Linode / AWS
```
1. Create account at provider
2. Select machine type
3. Deploy (instant)
4. Configure Node.js + MySQL
5. Migrate project
```

### Supabase Upgrade
```
1. Go to: https://supabase.com/dashboard
2. Project Settings → Billing
3. Select new tier
4. Confirm payment
5. Instant upgrade
```

---

## COST SUMMARY (30 days)

| Scenario | Cost | Resources |
|----------|------|-----------|
| **Current (Free)** | $0 | 3.8GB RAM, 6 CPU, 42GB disk |
| **MVP (Recommended)** | $20 | 8GB RAM, 8 CPU, 100GB disk + backup |
| **Scale** | $80-150 | 16GB RAM, 16 CPU, 500GB disk + DB |
| **Production** | $200-500 | 32+ GB RAM, 32+ CPU, 1TB+ disk |

---

## DECISION MATRIX

**Choose based on:**

```
IF you want:
├─ Fastest setup
├─ Minimal cost
└─ No migration needed
    → Manus Tier 2 ($15/month)

IF you want:
├─ Full control
├─ Portability
└─ Long-term flexibility
    → DigitalOcean/Linode ($48/month)

IF you want:
├─ Maximum performance
├─ Unlimited scaling
└─ Enterprise features
    → AWS ($120+/month)

IF you want:
├─ Just backup storage
├─ Archive old data
└─ Minimal cost
    → DigitalOcean Spaces ($5/month)
```

---

## NEXT STEPS

1. **Decide on upgrade option** (recommend: Manus Tier 2)
2. **Request upgrade** (24-48 hours)
3. **Verify resources** (check available RAM/disk)
4. **Start swarm** (launch collectors)
5. **Monitor usage** (daily reports)
6. **Scale if needed** (upgrade database/storage)

---

**Status: Ready to proceed with any option**

Contact: https://help.manus.im for Manus upgrades
