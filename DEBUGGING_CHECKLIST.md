# E2E Testing & Debugging Checklist

## Pre-Deploy Verification

### 1. Authentication & Security
- [ ] OAuth login flow works
- [ ] Session persistence works
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] JWT tokens are valid
- [ ] CORS headers are correct
- [ ] HTTPS enforced in production

### 2. Diagnostic Workflow
- [ ] Vehicle form validation works
- [ ] Error codes can be added/removed
- [ ] AI suggestions load correctly
- [ ] Maintenance recommendations display
- [ ] Diagnostic results save to database
- [ ] PDF export works
- [ ] Email reports send

### 3. OBD-II Scanner
- [ ] Bluetooth connection works
- [ ] Error codes read correctly
- [ ] Real-time data updates
- [ ] Graceful disconnection handling
- [ ] Error messages display

### 4. AI Features
- [ ] Diagnostic suggestions load
- [ ] Confidence scores display
- [ ] Maintenance schedule generates
- [ ] Chatbot responds to queries
- [ ] Voice input works (if browser supports)

### 5. Mobile & UX
- [ ] Bottom navigation displays on mobile
- [ ] Touch buttons are 44x44px minimum
- [ ] Responsive layouts work
- [ ] Dark mode toggles correctly
- [ ] OLED theme saves preference
- [ ] Voice input accessible on mobile
- [ ] Forms are mobile-friendly

### 6. Performance
- [ ] Home page loads < 3s
- [ ] Diagnostic page loads < 4s
- [ ] No console errors
- [ ] Images lazy load
- [ ] Code splitting works
- [ ] Bundle size < 500KB
- [ ] Database queries optimized

### 7. Database
- [ ] Connection pool working
- [ ] Indexes created
- [ ] Migrations applied
- [ ] Data persists correctly
- [ ] Query performance acceptable
- [ ] No N+1 queries

### 8. Browser Compatibility
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 9. Error Handling
- [ ] 404 pages display
- [ ] Error boundaries work
- [ ] API errors handled gracefully
- [ ] Network errors retry
- [ ] Timeout handling works

### 10. Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] ARIA labels present

## Testing Commands

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E with UI
pnpm test:e2e:ui

# View E2E report
pnpm test:e2e:report

# Type check
pnpm check

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

## Common Issues & Fixes

### Issue: E2E tests timeout
**Solution:** Increase timeout in playwright.config.ts or check if dev server is running

### Issue: Mobile tests fail
**Solution:** Ensure viewport is set correctly in test configuration

### Issue: Performance tests fail
**Solution:** Check bundle size with `pnpm build` and analyze with `source-map-explorer`

### Issue: Database tests fail
**Solution:** Verify DATABASE_URL is set and migrations are applied with `pnpm db:push`

### Issue: Voice input not working
**Solution:** Check if browser supports Web Speech API (Chrome/Edge only)

## Deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Secrets configured
- [ ] Build succeeds
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Accessibility verified

## Post-Deploy Verification

- [ ] Live site loads
- [ ] OAuth login works
- [ ] Diagnostics can be created
- [ ] AI features respond
- [ ] Mobile layout works
- [ ] Dark mode works
- [ ] No errors in production logs
- [ ] Performance metrics acceptable
