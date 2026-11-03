# Deployment Checklist

Use this checklist to ensure your AI Call Assistant is deployed correctly and securely.

## Pre-Deployment

### 1. Code Quality

- [ ] Run `npm run lint` - No critical errors
- [ ] Run `npx tsc --noEmit` - TypeScript compiles without errors
- [ ] Run `npm run format` - Code is properly formatted
- [ ] Review all `.env.example` variables

### 2. Supabase Setup

- [ ] Supabase project created
- [ ] All 3 database migrations applied in order
- [ ] RLS (Row Level Security) enabled on all tables
- [ ] Realtime enabled for `calls` table
- [ ] Project URL and keys obtained from Settings → API

### 3. Vapi Setup

- [ ] Vapi account created
- [ ] AI assistant configured
- [ ] Private API key generated
- [ ] Assistant ID noted
- [ ] Webhook secret generated (use `openssl rand -hex 32`)

## Deployment

### 4. Environment Variables

#### Vercel

- [ ] Go to Project Settings → Environment Variables
- [ ] Add all required variables (see below)
- [ ] Variables available in Production environment
- [ ] Redeploy to apply variables

#### Netlify

- [ ] Go to Site settings → Environment variables
- [ ] Add all required variables (see below)
- [ ] Trigger new deployment

#### Required Variables

```env
# Public (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Server (SSR)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Secrets (Backend Only - Keep Secure!)
VAPI_PRIVATE_KEY=sk_live_...
VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAPI_SERVER_SECRET=your_webhook_secret_32chars_min
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Deploy Application

- [ ] Push code to GitHub (ensure `.env` is in `.gitignore`)
- [ ] Connect repository to Vercel or Netlify
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Deploy
- [ ] Note your deployment URL (e.g., `https://your-app.vercel.app`)

### 6. Configure Vapi Webhook

- [ ] Open Vapi dashboard
- [ ] Go to Settings or Assistant settings
- [ ] Set Server URL: `https://your-app.vercel.app/api/public/vapi-webhook`
- [ ] Set Server Secret: (paste your webhook secret)
- [ ] Save settings

## Post-Deployment Verification

### 7. Initial Access

- [ ] Visit your deployment URL
- [ ] See "Create the first admin" setup screen
- [ ] Create first admin account
- [ ] Successfully log in

### 8. Settings Check

- [ ] Navigate to Settings page (admin only)
- [ ] Click "Test connection"
- [ ] Verify status shows "Connected"
- [ ] Check Assistant ID is correct
- [ ] Verify webhook endpoint URL is correct

### 9. Database Verification

- [ ] Admin user exists in `profiles` table
- [ ] Admin has role in `user_roles` table
- [ ] User `is_active` is `true`
- [ ] No errors in Supabase logs

### 10. Webhook Test

#### Option A: Make a Real Call

- [ ] Make a test call through your Vapi assistant
- [ ] Call appears in dashboard within 5-10 seconds
- [ ] Status updates in real-time
- [ ] Call details show after call ends

#### Option B: Manual Webhook Test

```bash
curl -X POST https://your-app.vercel.app/api/public/vapi-webhook \
  -H "x-vapi-secret: your_webhook_secret" \
  -H "Content-Type: application/json" \
  -d '{"message":{"type":"status-update","call":{"id":"test-123","status":"queued"}}}'
```

- [ ] Response is `{"ok":true}`
- [ ] No errors in deployment logs

### 11. Core Features Test

#### Dashboard

- [ ] KPI cards display (Total Calls, Today's Calls, Duration, Cost)
- [ ] Chart renders (may be empty if no calls yet)
- [ ] Recent calls section displays
- [ ] Refresh button works
- [ ] Real-time updates work (make a call, see it appear)

#### Calls Page

- [ ] Calls list displays
- [ ] Search works
- [ ] Filters work (status, type, date range)
- [ ] Pagination works
- [ ] "Sync Vapi calls" button works (admin only)
- [ ] Click on call navigates to details

#### Call Details

- [ ] Call information displays correctly
- [ ] Recording plays (if available)
- [ ] Transcript displays correctly
- [ ] Summary displays (if available)
- [ ] Back button returns to calls list

#### Users Page (Admin Only)

- [ ] Users list displays
- [ ] "Add user" button opens dialog
- [ ] Can create new user
- [ ] Can change user role
- [ ] Can activate/deactivate user
- [ ] Cannot deactivate last admin

#### Settings Page (Admin Only)

- [ ] Connection status displays
- [ ] "Test connection" works
- [ ] All fields display correctly

### 12. Authentication & Authorization

- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Logout works
- [ ] Protected routes redirect to login when not authenticated
- [ ] Viewer cannot access Users page
- [ ] Viewer cannot access Settings page
- [ ] Viewer can view Dashboard and Calls
- [ ] Inactive user cannot log in

### 13. Security Verification

- [ ] Cannot see API keys in browser Network tab
- [ ] Cannot see service role key in frontend bundle
- [ ] Webhook secret is not exposed
- [ ] RLS prevents unauthorized data access
- [ ] SQL injection prevention (try `'; DROP TABLE users; --` in search)

### 14. Performance Check

- [ ] Dashboard loads in <3 seconds
- [ ] No console errors
- [ ] No console warnings (minor warnings ok)
- [ ] Images/assets load correctly
- [ ] Mobile responsive layout works

### 15. Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (iOS Safari, Android Chrome)

## Production Operations

### 16. Monitoring Setup

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Set up database backup schedule
- [ ] Configure email alerts for critical errors
- [ ] Monitor webhook success rate

### 17. Documentation Handoff

- [ ] README.md reviewed
- [ ] DEPLOYMENT.md provided to team
- [ ] VAPI_SETUP.md provided to team
- [ ] Environment variables documented
- [ ] Access credentials securely shared

### 18. Team Onboarding

- [ ] All team members have dashboard accounts
- [ ] Roles assigned correctly (admin vs viewer)
- [ ] Team trained on dashboard features
- [ ] Support contact information provided

## Maintenance

### 19. Regular Tasks

- [ ] Weekly: Review webhook logs for errors
- [ ] Weekly: Check database size and performance
- [ ] Monthly: Review user access and roles
- [ ] Monthly: Verify backups are working
- [ ] Quarterly: Update dependencies
- [ ] Quarterly: Rotate webhook secret
- [ ] Annually: Rotate API keys

### 20. Incident Response Plan

- [ ] Contact list for emergencies
- [ ] Rollback procedure documented
- [ ] Database restore procedure tested
- [ ] Escalation path defined

## Troubleshooting Quick Reference

### Issue: Calls not appearing

**Check:**

1. Webhook URL correct in Vapi?
2. Webhook secret matches?
3. Deployment logs show webhook requests?
4. `VAPI_SERVER_SECRET` env var set?

### Issue: "Connection error" in Settings

**Check:**

1. `VAPI_PRIVATE_KEY` env var set?
2. Key is valid in Vapi dashboard?
3. Can reach api.vapi.ai from deployment?

### Issue: Can't log in

**Check:**

1. User exists in Supabase Auth?
2. Profile exists in `profiles` table?
3. User is active (`is_active = true`)?
4. Password is correct?

### Issue: "Permission denied" errors

**Check:**

1. User has correct role in `user_roles`?
2. RLS policies are in place?
3. User is active?
4. Session is valid (try logout/login)?

## Success Criteria

✅ All checklist items completed  
✅ No critical errors in logs  
✅ Test call appears in dashboard  
✅ All user roles working correctly  
✅ Documentation provided to team  
✅ Monitoring and alerts configured

## Final Notes

- Keep this checklist for future deployments
- Update it based on lessons learned
- Share with team members who deploy updates
- Review before each major release

**Deployment Date:** _____________

**Deployed By:** _____________

**Deployment URL:** _____________

**Notes:**

---

---

---
