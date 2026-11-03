# AI Call Assistant - Deployment Guide

This guide will help you deploy the AI Call Assistant dashboard to production.

## Prerequisites

- A [Supabase](https://supabase.com) project
- A [Vapi.ai](https://vapi.ai) account with an AI assistant configured
- A [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account (for frontend hosting)

## Architecture Overview

```
Vapi AI Phone System
      ↓ (webhooks)
Supabase Edge Function (webhook handler)
      ↓ (validates & processes)
Supabase PostgreSQL Database
      ↓ (queries)
React Frontend (Vite)
```

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and fill in project details
4. Wait for the project to be provisioned

### 1.2 Run Database Migrations

The migrations are already in `supabase/migrations/`. Apply them:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link your project (you'll need your project ref from the dashboard)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

Alternatively, copy the SQL from each migration file and run them manually in the Supabase SQL Editor in order:

1. `20261002162241_79f36b30-3a85-4df4-803f-92d846c6c858.sql`
2. `20261002162308_26719036-cd3e-4a4d-ac66-76b30f9781b7.sql`
3. `20261002162351_26a53864-4afc-4a42-b2a8-256e16b2fd32.sql`

### 1.3 Enable Realtime (Optional but Recommended)

1. Go to Database → Replication in Supabase dashboard
2. Enable replication for the `calls` table
3. This allows the dashboard to update in real-time when new calls arrive

### 1.4 Get Your Supabase Credentials

From your Supabase project settings (Settings → API):

- **Project URL** (e.g., `https://your-project.supabase.co`)
- **Anon/Public Key** (publishable key for frontend)
- **Service Role Key** (secret key for backend - keep this secure!)

## Step 2: Configure Vapi

### 2.1 Create or Configure Your AI Assistant

1. Log in to [Vapi.ai dashboard](https://dashboard.vapi.ai)
2. Create or select an AI assistant
3. Note the **Assistant ID** (you'll need this)

### 2.2 Get Your Vapi API Key

1. Go to Settings → API Keys in Vapi dashboard
2. Create a new **Private API Key** or copy an existing one
3. Keep this secret secure!

### 2.3 Generate a Webhook Secret

Create a strong random secret for webhook validation:

```bash
# On Unix/Linux/Mac
openssl rand -hex 32

# Or use any strong password generator
```

Keep this secret - you'll use it in both Vapi and your deployment.

## Step 3: Deploy the Frontend

### Option A: Deploy to Vercel

1. Push your code to GitHub if you haven't already

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Configure environment variables in Vercel project settings:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   ```

4. Add the following **secret** environment variables (not exposed to browser):

   ```
   VAPI_PRIVATE_KEY=your_vapi_private_key
   VAPI_ASSISTANT_ID=your_vapi_assistant_id
   VAPI_SERVER_SECRET=your_webhook_secret
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. Deploy! Vercel will build and deploy your app.

### Option B: Deploy to Netlify

1. Push your code to GitHub

2. Go to [netlify.com](https://netlify.com) and create a new site from Git

3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

4. Add environment variables in Site Settings → Environment Variables (same as Vercel above)

5. Deploy!

## Step 4: Configure the Vapi Webhook

After your frontend is deployed, you'll have a URL like:

- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`

### 4.1 Set Webhook URL in Vapi

1. Go to your Vapi dashboard
2. Navigate to your Assistant settings or Account settings
3. Find the "Server URL" or "Webhook URL" field
4. Enter: `https://your-app.vercel.app/api/public/vapi-webhook`
5. In the "Server Secret" field, paste the webhook secret you generated earlier
6. Save the settings

### 4.2 Test the Webhook

The webhook endpoint `/api/public/vapi-webhook` is a TanStack Start API route that:

- Validates the webhook secret
- Processes Vapi events (status-update, end-of-call-report, hang, conversation-update)
- Stores call data in Supabase
- Prevents duplicate event processing

## Step 5: Create Your First Admin Account

1. Visit your deployed site (e.g., `https://your-app.vercel.app`)
2. You'll see a "Create the first admin" setup screen
3. Fill in your name, email, and password
4. Click "Create admin account"
5. You'll be automatically logged in

**Security Note:** This setup screen only appears when no admin users exist. After the first admin is created, it's disabled and new users must be invited by existing admins.

## Step 6: Test the Integration

### 6.1 Test Vapi Connection

1. Log in as admin
2. Go to Settings
3. Click "Test connection"
4. You should see "Connected" status

### 6.2 Sync Existing Calls

If you already have calls in Vapi:

1. Go to the Calls page
2. Click "Sync Vapi calls" button
3. This will fetch and import existing calls from Vapi

### 6.3 Make a Test Call

1. Trigger a call through your Vapi assistant (via phone or web)
2. The call should appear in your dashboard automatically via webhook
3. Check the Dashboard and Calls pages to see the data

## Step 7: Invite Additional Users

As an admin, you can invite other users:

1. Go to Users page
2. Click "Add user"
3. Fill in their details and choose a role:
   - **Admin**: Full access including user management and settings
   - **Viewer**: Read-only access to calls and dashboard
4. Share the temporary password with them securely
5. They should change their password after first login

## Environment Variables Reference

### Public (Frontend - Safe to Expose)

| Variable                        | Description              | Example                      |
| ------------------------------- | ------------------------ | ---------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL     | `https://abc123.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbG...`                  |

### Secret (Backend Only - Keep Secure)

| Variable                    | Description               | Where to Get It                      |
| --------------------------- | ------------------------- | ------------------------------------ |
| `VAPI_PRIVATE_KEY`          | Vapi private API key      | Vapi dashboard → API Keys            |
| `VAPI_ASSISTANT_ID`         | Your Vapi assistant ID    | Vapi dashboard → Assistants          |
| `VAPI_SERVER_SECRET`        | Webhook validation secret | Generate with `openssl rand -hex 32` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key        | Supabase → Settings → API            |

## Troubleshooting

### Calls Not Appearing

1. **Check webhook configuration**: Ensure the webhook URL is correct and uses HTTPS
2. **Verify webhook secret**: Must match in both Vapi and your environment variables
3. **Check Supabase logs**: Look for errors in Supabase → Edge Functions logs
4. **Test connection**: Use the "Test connection" button in Settings

### Cannot Create Users

1. **Check service role key**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. **Verify you're admin**: Only admins can create users
3. **Check email format**: Email must be valid

### Recording Not Playing

1. **Check CORS**: Vapi recording URLs must allow your domain
2. **Check URL expiry**: Some recording URLs may expire
3. **Try stereo recording**: If available, it may have different access rules

### Database Permission Errors

1. **Re-run migrations**: Ensure all migrations completed successfully
2. **Check RLS policies**: Verify Row Level Security policies are in place
3. **Verify user is active**: Inactive users cannot access data

## Security Checklist

- [ ] Never commit `.env` file with real credentials
- [ ] Keep `VAPI_PRIVATE_KEY` secret
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Keep `VAPI_SERVER_SECRET` secret
- [ ] Use HTTPS for webhook endpoint
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Regularly review user access
- [ ] Use strong passwords for admin accounts
- [ ] Monitor webhook logs for suspicious activity

## Maintenance

### Backing Up Data

Supabase projects include automatic backups. For manual backups:

```bash
# Export calls data
supabase db dump -f backup.sql

# Or export specific table
pg_dump -h db.your-project.supabase.co -U postgres -t calls > calls_backup.sql
```

### Monitoring

1. **Supabase Dashboard**: Monitor database size, API usage
2. **Vercel/Netlify Analytics**: Track frontend performance
3. **Vapi Dashboard**: Monitor call volume and costs
4. **Application Settings**: Check last webhook received timestamp

### Updating

To update the application:

1. Pull latest changes from your repository
2. Review and test changes locally
3. Push to your deployment branch
4. Vercel/Netlify will automatically redeploy
5. Check the dashboard to ensure everything works

## Support

For issues specific to:

- **Database/Authentication**: [Supabase Support](https://supabase.com/support)
- **AI Voice**: [Vapi Support](https://docs.vapi.ai)
- **Deployment**: [Vercel Docs](https://vercel.com/docs) or [Netlify Docs](https://docs.netlify.com)

## Next Steps

- Customize the AI assistant prompts in Vapi
- Set up monitoring and alerts
- Configure call recording retention policies
- Integrate with other systems via Supabase webhooks
- Customize the dashboard theme in `src/styles.css`
