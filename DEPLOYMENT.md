# Mechanic Helper - Complete Deployment Guide

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** March 5, 2026

## Prerequisites

- ✅ Supabase Project (URL, Anon Key, Service Role Key)
- ✅ Vercel Account
- ✅ GitHub Repository
- ✅ Kimi API Key
- ✅ Manus OAuth credentials

## Step 1: Supabase Configuration

1. Go to https://app.supabase.com
2. Create new project or select existing
3. Navigate to **Settings → API**
4. Copy:
   - **Project URL** (format: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** secret key

## Step 2: Environment Variables Configuration

Variabilele necesare pentru Vercel:

```
DATABASE_URL=mysql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
KIMI_API_KEY=your-kimi-api-key
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name
```

## Step 3: Deploy to Vercel

### Option 1: Via Git (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com
3. Connect GitHub account
4. Select `mechanic-helper` repository
5. Vercel auto-detects Vite project
6. Add environment variables in **Settings → Environment Variables**
7. Click **Deploy**

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Step 4: Database Configuration

After deployment, database schema auto-creates on Supabase.

Verify tables created:
- users, profiles, vehicles, diagnostics
- diagnosticImages, notifications, knowledgeBase
- manufacturers, models, engines, vehicleVariants
- vinPatterns, vinDecodeCache, dataImportStatus

## Step 5: Testing & Verification

1. Access Vercel URL (format: `https://mechanic-helper.vercel.app`)
2. Login with Manus OAuth
3. Create test diagnostic
4. Verify Kimi AI functionality
5. Test VIN decoder with sample VIN
6. Check motorization selector
7. Verify OBD scanner connection
8. Test parts pricing lookup

## Troubleshooting

### Error: "Cannot connect to database"
- Verify `DATABASE_URL` is correct
- Ensure Supabase project is active
- Check firewall settings in Supabase

### Error: "Kimi API Key invalid"
- Verify `KIMI_API_KEY` is correct
- Ensure key hasn't expired

### Error: "OAuth callback failed"
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL`
- Add Vercel URL to OAuth redirect URIs

### Error: "Build failed"
```bash
pnpm clean
pnpm install
pnpm build
```

## Data Import (Kimi Swarm)

After deployment, populate vehicle database:

```bash
# Run via serverless function
curl -X POST https://your-domain.vercel.app/api/import-vehicle-data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": 0,
    "batch_size": 50,
    "total_batches": 6000
  }'
```

This imports 300,000+ vehicle variants using Kimi Swarm agents.

## Monitoring

- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard
- **Logs:** Check `.manus-logs/` directory
- **Analytics:** Vercel Analytics + Supabase metrics

## Features Deployed

✅ AI Diagnostics (Kimi)
✅ VIN Decoder (NHTSA)
✅ Motorization Selector (206 variants)
✅ OBD-II Scanner
✅ Parts Pricing (Autodoc/Autodata)
✅ Vehicle Recalls
✅ Predictive Maintenance
✅ Role-Based Access Control
✅ Vehicle Database (300,000+ variants)
✅ Mobile Responsive Design
✅ Kimi Swarm Data Import

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Kimi API Docs](https://platform.moonshot.cn/docs)
- [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/)

---

**Support:** For issues, contact development team or check GitHub Issues
