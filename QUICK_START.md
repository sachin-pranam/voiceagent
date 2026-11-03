# Quick Start Guide

Get your AI Call Assistant up and running in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Vapi.ai account

## 1. Clone & Install (2 minutes)

```bash
git clone <your-repo-url>
cd ai-call-assistant
npm install
```

## 2. Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings → API
3. In the SQL Editor, run these migrations in order:
   - `supabase/migrations/20261002162241_*.sql`
   - `supabase/migrations/20261002162308_*.sql`
   - `supabase/migrations/20261002162351_*.sql`

## 3. Configure Environment (1 minute)

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## 4. Start Development Server (1 minute)

```bash
npm run dev
```

Open http://localhost:5173

## 5. Create First Admin (1 minute)

1. You'll see "Create the first admin" screen
2. Fill in your name, email, and password
3. Click "Create admin account"
4. You're logged in!

## 6. Configure Vapi (5 minutes)

### Get Credentials

1. Log in to [Vapi dashboard](https://dashboard.vapi.ai)
2. Go to Settings → API Keys
3. Copy your Private API Key
4. Note your Assistant ID
5. Generate a webhook secret: `openssl rand -hex 32`

### Add to Environment

Add to your `.env` file:

```env
VAPI_PRIVATE_KEY=sk_live_...
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_SERVER_SECRET=your-webhook-secret
```

**Important:** For local development, you'll need a public URL for webhooks. Options:

- Use [ngrok](https://ngrok.com): `ngrok http 5173`
- Deploy to Vercel/Netlify first (recommended)

### Set Webhook in Vapi

1. In Vapi dashboard, go to Settings
2. Server URL: `https://your-url.com/api/public/vapi-webhook`
3. Server Secret: paste your webhook secret
4. Save

## 7. Test It (5 minutes)

### Test Connection

1. In your dashboard, go to Settings
2. Click "Test connection"
3. Should show "Connected"

### Test Call

1. Make a call through your Vapi assistant
2. Go to Dashboard or Calls page
3. Call should appear within seconds!

## Next Steps

- **Deploy to Production**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Invite Team Members**: Go to Users page
- **Customize Theme**: Edit `src/styles.css`
- **Read Full Docs**: See [DEVELOPMENT.md](DEVELOPMENT.md) and [VAPI_SETUP.md](VAPI_SETUP.md)

## Troubleshooting

### "Missing Supabase environment variable"

- Check `.env` file exists and has correct values
- Restart dev server after changing `.env`

### "Unauthorized" on webhook

- Check webhook secret matches in Vapi and `.env`
- Use public URL (ngrok) for local development webhooks

### Calls not appearing

- Check webhook URL is correct in Vapi
- Use "Sync Vapi calls" to import existing calls
- Check deployment logs for webhook errors

## Quick Links

- 📚 [Full Documentation](README.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🔧 [Development Guide](DEVELOPMENT.md)
- 📞 [Vapi Setup](VAPI_SETUP.md)
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

## Support

- **Vapi Issues**: [docs.vapi.ai](https://docs.vapi.ai)
- **Supabase Issues**: [supabase.com/docs](https://supabase.com/docs)
- **Application Issues**: Check deployment logs

---

**You're all set!** 🎉 Start monitoring your AI phone calls.
