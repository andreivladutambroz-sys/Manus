# MVP Roadmap - From Functional to Production

**Strategy:** Build functional MVP first → Test locally → Upgrade infrastructure → Deploy to production

---

## PHASE 1: BUILD FUNCTIONAL MVP (This Week)

### Goal: Get all core features working locally

#### 1.1 Database Schema & Setup ✅ DONE
- [x] knowledgeBase table (116,594 records)
- [x] Bayesian model built
- [x] Sample data verified

#### 1.2 /diagnose Endpoint (PRIORITY)
```
Input:
├─ vehicle (make, model, year, engine)
├─ error_code
└─ symptoms (array)

Output:
├─ top_diagnosis (error code + description)
├─ confidence_score (0.78-0.99)
├─ probable_causes (array)
├─ repair_procedures (array of steps)
├─ tools_required (array)
├─ torque_specs (array)
├─ estimated_time
├─ estimated_cost
├─ similar_cases_count
└─ source_reference

Implementation:
├─ Load Bayesian model
├─ Query knowledgeBase
├─ Calculate probabilities
├─ Return structured JSON
```

#### 1.3 Diagnostic UI Page
```
Components:
├─ Vehicle Input (VIN or manual selection)
├─ Error Code Input (dropdown or search)
├─ Symptoms Input (multi-select)
├─ Submit Button
└─ Results Display

Features:
├─ Form validation
├─ Loading state
├─ Error handling
├─ Results formatting
└─ Share/Export button
```

#### 1.4 VIN Decode Integration
```
Input: VIN string
Output: vehicle data (make, model, year, engine)

Implementation:
├─ Use existing VIN decode API
├─ Auto-fill vehicle fields
├─ Validate VIN format
└─ Handle errors
```

#### 1.5 Certificate Image Upload (Kimi Vision)
```
Input: Image file (registration certificate)
Output: Extracted vehicle data (VIN, make, model, year)

Implementation:
├─ File upload component
├─ Call Kimi Vision API
├─ Extract text/fields
├─ Auto-fill vehicle form
└─ Show extracted data
```

#### 1.6 Outcome Tracking
```
After diagnosis:
├─ "Did this fix your problem?" button
├─ YES / NO options
├─ Store in diagnostics table
├─ Update RSI metrics

Table:
├─ diagnostic_id
├─ user_id
├─ vehicle_make, model, year
├─ error_code
├─ repair_action
├─ success (true/false)
├─ repair_time_hours
├─ repair_cost
└─ timestamp
```

#### 1.7 Beta Mode / Invite System
```
Features:
├─ Invite code generation
├─ Invite code validation
├─ Beta user tracking
├─ Feedback collection form
├─ Analytics dashboard

Table:
├─ beta_invites (code, email, status)
├─ beta_users (user_id, invited_by, joined_date)
└─ feedback (user_id, rating, comment, timestamp)
```

---

## PHASE 2: TEST MVP LOCALLY (2-3 Days)

### Goal: Verify all features work before deployment

#### 2.1 Manual Testing
```
Test cases:
├─ [ ] Login works
├─ [ ] Vehicle input works
├─ [ ] Error code search works
├─ [ ] Symptoms selection works
├─ [ ] /diagnose endpoint returns data
├─ [ ] Results display correctly
├─ [ ] VIN decode works
├─ [ ] Image upload works
├─ [ ] Outcome tracking works
├─ [ ] Database updates correctly
└─ [ ] No console errors
```

#### 2.2 Browser DevTools Testing
```
Check:
├─ [ ] No JavaScript errors
├─ [ ] No network errors
├─ [ ] API calls return 200
├─ [ ] Response times < 2 seconds
├─ [ ] Local storage working
└─ [ ] Session persisting
```

#### 2.3 Manus Logs Testing
```
Check:
├─ [ ] Server starts without errors
├─ [ ] tRPC procedures execute
├─ [ ] Database queries work
├─ [ ] No SQL errors
├─ [ ] Swarm logs clean
└─ [ ] No memory leaks
```

#### 2.4 Performance Testing
```
Measure:
├─ [ ] /diagnose response time (target: < 500ms)
├─ [ ] Page load time (target: < 2s)
├─ [ ] Database query time (target: < 100ms)
├─ [ ] Memory usage (target: < 500MB)
└─ [ ] CPU usage (target: < 50%)
```

#### 2.5 Security Testing
```
Check:
├─ [ ] No secrets in code
├─ [ ] No secrets in console logs
├─ [ ] API endpoints protected
├─ [ ] Database queries safe (no SQL injection)
├─ [ ] User data isolated
└─ [ ] HTTPS ready
```

---

## PHASE 3: UPGRADE INFRASTRUCTURE (Day 4)

### Goal: Prepare for production deployment

#### 3.1 Request Manus Tier 2 Upgrade
```
Send to: https://help.manus.im
Message: "Upgrade sandbox to Tier 2 (8GB RAM, 8 CPU, 100GB storage)"
Timeline: 24-48 hours
```

#### 3.2 Create GitHub Repository
```
Steps:
├─ [ ] Create account at https://github.com
├─ [ ] Create repository "mechanic-helper"
├─ [ ] Push code to GitHub
└─ [ ] Verify code is there
```

#### 3.3 Create Vercel Account
```
Steps:
├─ [ ] Go to https://vercel.com
├─ [ ] Sign up with GitHub
├─ [ ] Connect to GitHub
└─ [ ] Authorize Vercel
```

#### 3.4 Setup Supabase Pro (If needed)
```
Current: Free tier (5GB)
If data > 5GB:
├─ [ ] Go to https://supabase.com/dashboard
├─ [ ] Upgrade to Pro ($50/month)
└─ [ ] Verify upgrade
```

---

## PHASE 4: DEPLOY TO PRODUCTION (Day 5)

### Goal: Get app live on the internet

#### 4.1 Deploy Frontend to Vercel
```
Steps:
├─ [ ] Go to https://vercel.com/dashboard
├─ [ ] Click "Add New" → "Project"
├─ [ ] Select "mechanic-helper" repository
├─ [ ] Click "Import"
├─ [ ] Click "Deploy"
├─ [ ] Wait 2-3 minutes
└─ [ ] App is live at mechanic-helper.vercel.app
```

#### 4.2 Configure Environment Variables
```
In Vercel dashboard:
├─ [ ] VITE_FRONTEND_FORGE_API_KEY
├─ [ ] VITE_FRONTEND_FORGE_API_URL
├─ [ ] VITE_OAUTH_PORTAL_URL
├─ [ ] VITE_APP_ID
├─ [ ] VITE_API_URL (backend endpoint)
└─ [ ] Redeploy
```

#### 4.3 Update API Endpoint
```
In code (client/src/lib/trpc.ts):
├─ [ ] Change API URL to production backend
├─ [ ] Test API calls
└─ [ ] Verify data flows
```

#### 4.4 Test Production App
```
At: mechanic-helper.vercel.app
├─ [ ] Login works
├─ [ ] Diagnostic form works
├─ [ ] Results display correctly
├─ [ ] No errors in console
├─ [ ] API calls succeed
└─ [ ] Database updates work
```

#### 4.5 Setup Custom Domain (Optional)
```
In Vercel dashboard:
├─ [ ] Go to Settings → Domains
├─ [ ] Add custom domain
├─ [ ] Configure DNS
└─ [ ] Verify domain
```

---

## PHASE 5: LAUNCH SWARM DATA COLLECTION (Days 6-10)

### Goal: Collect 100k+ diagnostic records

#### 5.1 Start Sequential Waves
```
Day 1: Forums (5k records)
Day 2: Reddit + Manuals (8k records)
Day 3: OBD + Blogs (2k records)
Day 4: Normalization (12k normalized)
Day 5: Dedup + Validation (50k+ final)

Day 6-7: Upgrade complete
Day 7-10: Accelerated collection (50k+ more)

Total: 100,000+ records
```

#### 5.2 Monitor Collection
```
Daily:
├─ [ ] Check record count
├─ [ ] Check for errors
├─ [ ] Monitor memory usage
├─ [ ] Monitor disk usage
├─ [ ] Generate daily report
└─ [ ] Fix issues
```

#### 5.3 Verify Data Quality
```
Check:
├─ [ ] No duplicates
├─ [ ] All fields populated
├─ [ ] Confidence scores valid
├─ [ ] Sources verified
└─ [ ] Ready for production
```

---

## PHASE 6: MONITOR & OPTIMIZE (Ongoing)

### Goal: Keep app running smoothly

#### 6.1 Monitor Production
```
Daily:
├─ [ ] Check Vercel dashboard
├─ [ ] Check error rates
├─ [ ] Check performance metrics
├─ [ ] Check user feedback
└─ [ ] Fix critical issues
```

#### 6.2 Monitor Backend
```
Daily:
├─ [ ] Check Manus logs
├─ [ ] Check database size
├─ [ ] Check API response times
├─ [ ] Check swarm progress
└─ [ ] Fix issues
```

#### 6.3 Collect User Feedback
```
From beta testers:
├─ [ ] Diagnostic accuracy
├─ [ ] UI/UX feedback
├─ [ ] Feature requests
├─ [ ] Bug reports
└─ [ ] Performance feedback
```

#### 6.4 Iterate & Improve
```
Based on feedback:
├─ [ ] Fix bugs
├─ [ ] Improve UI
├─ [ ] Add features
├─ [ ] Optimize performance
└─ [ ] Deploy updates
```

---

## TIMELINE

```
Week 1 (This Week):
├─ Day 1-2: Build /diagnose endpoint + UI
├─ Day 2-3: Add VIN decode + image upload
├─ Day 3-4: Add outcome tracking + beta mode
├─ Day 4-5: Test locally
└─ Day 5: Request Tier 2 upgrade

Week 2:
├─ Day 1: Create GitHub repo
├─ Day 1-2: Deploy to Vercel
├─ Day 2-3: Test production
├─ Day 3-4: Tier 2 upgrade completes
└─ Day 4-7: Swarm collection (sequential waves)

Week 3:
├─ Day 1-4: Swarm collection (accelerated with Tier 2)
├─ Day 4-5: Verify data quality
├─ Day 5-7: Optimize & monitor
└─ Day 7: MVP complete!

Total: 2-3 weeks to full MVP
```

---

## SUCCESS CRITERIA

### Phase 1: Functional MVP
- [x] /diagnose endpoint working
- [x] Diagnostic UI complete
- [x] VIN decode working
- [x] Image upload working
- [x] Outcome tracking working
- [x] Beta mode working
- [x] No console errors
- [x] All tests passing

### Phase 2: Tested MVP
- [x] Manual testing complete
- [x] DevTools testing complete
- [x] Performance acceptable
- [x] Security verified
- [x] Ready for deployment

### Phase 3: Upgraded Infrastructure
- [x] Tier 2 upgrade complete
- [x] GitHub repo created
- [x] Vercel account created
- [x] Supabase ready

### Phase 4: Production Deployment
- [x] Frontend deployed to Vercel
- [x] Environment variables configured
- [x] API endpoint updated
- [x] Production app working
- [x] Custom domain (optional)

### Phase 5: Swarm Collection
- [x] 100,000+ records collected
- [x] Data deduplicated
- [x] Data validated
- [x] RSI metrics calculated
- [x] Ready for users

### Phase 6: Monitoring
- [x] Production monitoring active
- [x] Error tracking working
- [x] User feedback collected
- [x] Performance optimized
- [x] Continuous improvement

---

## NEXT STEPS

**Start immediately with Phase 1:**

1. Implement /diagnose endpoint
2. Build diagnostic UI
3. Add VIN decode
4. Add image upload
5. Add outcome tracking
6. Add beta mode
7. Test locally
8. Request Tier 2 upgrade
9. Deploy to Vercel
10. Launch swarm

**Let's build this! 🚀**
