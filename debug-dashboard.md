# Dashboard Debug Steps

## Quick Debug Commands

### 1. Check Database Tables
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as total_calls FROM calls;
SELECT * FROM calls ORDER BY created_at DESC LIMIT 5;
SELECT * FROM app_settings WHERE key IN ('last_sync_at', 'last_webhook_at');
```

### 2. Check User Role
```sql
SELECT u.email, ur.role 
FROM auth.users u 
JOIN user_roles ur ON u.id = ur.user_id;
```

### 3. Manual Test Call Insert
```sql
-- Insert test call data
INSERT INTO calls (
  id, vapi_call_id, customer_number, customer_name, status, call_type, 
  started_at, ended_at, cost_usd, duration_seconds
) VALUES (
  gen_random_uuid(), 'test-call-123', '+1234567890', 'Test User', 
  'completed', 'inbound', NOW() - INTERVAL '1 hour', NOW(), 1.50, 300
);
```

## Browser Console Checks

### 1. Network Tab
- Check for failed API calls to `/api/`
- Look for 401/403 authentication errors
- Check RPC call to `call_stats`

### 2. Console Tab
- Look for JavaScript errors
- Check authentication status
- Verify query responses

## Environment Variables Check
```bash
# Verify all required variables are set
cat .env | grep -E "(SUPABASE|VAPI)"
```

## Common Issues & Solutions

### Issue 1: No Admin Role
**Solution**: First user becomes admin automatically

### Issue 2: Vapi Not Configured  
**Solution**: Set VAPI_PRIVATE_KEY and VAPI_ASSISTANT_ID in .env

### Issue 3: Database Connection Issues
**Solution**: Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

### Issue 4: RLS Policies Blocking Data
**Solution**: Check user authentication and role assignment

### Issue 5: Webhook Not Receiving Data
**Solution**: Use ngrok for local development webhooks