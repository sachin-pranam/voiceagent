# 🚀 Complete Setup Guide - सब काम करने के लिए

## पहले ये चीज़ें चाहिए:

- ✅ Internet connection
- ✅ Email account (Gmail recommended)
- ✅ Development server already running hai (port 8080)

---

## Step 1: Supabase Account Setup (5 min) 🗄️

### 1.1 Account Banao
1. Jao: https://supabase.com
2. Click करो **"Start your project"**
3. **Sign up with GitHub** (recommended) ya Email se
4. Verification email check karo aur verify karo

### 1.2 New Project Banao
1. Dashboard par click करो **"New Project"**
2. Organization select करो (ya "New organization" banao)
3. Project details:
   ```
   Name: ai-call-assistant
   Database Password: [Strong password - SAVE KAR LENA!]
   Region: Mumbai (India) ya Singapore
   Pricing Plan: FREE (perfect hai)
   ```
4. Click **"Create new project"**
5. ⏰ **2-3 minutes wait karo** - database ban raha hai

### 1.3 API Keys Copy Karo
1. Left sidebar → **Settings** ⚙️ → **API**
2. **Project URL** copy karo:
   ```
   https://abcdefgh.supabase.co
   ```
3. **anon public** key copy karo (bahut lamba key):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
   ```
4. **service_role** key bhi copy karo (neeche hai, show button dabao):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
   ```
5. ⚠️ **IMPORTANT:** Ye keys notepad mein save kar lo!

---

## Step 2: Database Tables Banao (10 min) 📊

### 2.1 SQL Editor Kholo
- Left sidebar → **SQL Editor** 💻
- Click **"+ New query"**

### 2.2 Migration 1 - Tables Banao
**SQL Editor mein ye code paste karo aur RUN karo:**

```sql
-- Migration 1: Core Tables
create type public.app_role as enum ('admin', 'viewer');

create table public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text not null unique,
  assistant_id text,
  customer_name text,
  customer_number text,
  call_type text,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  cost_usd numeric,
  ended_reason text,
  summary text,
  transcript text,
  messages jsonb,
  recording_url text,
  stereo_recording_url text,
  analysis jsonb,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  vapi_call_id text,
  event_type text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index calls_started_at_idx on public.calls (started_at desc);
create index calls_created_at_idx on public.calls (created_at desc);
create index calls_customer_number_idx on public.calls (customer_number);
create index calls_status_idx on public.calls (status);

-- Functions
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_user(_user_id uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = _user_id and is_active)
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger calls_touch before update on public.calls for each row execute function public.touch_updated_at();

-- Triggers
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
declare _role public.app_role;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  
  if not exists (select 1 from public.user_roles where role = 'admin') then
    _role := 'admin';
  else
    _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'viewer');
  end if;
  
  insert into public.user_roles (user_id, role) values (new.id, _role);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users 
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.calls enable row level security;
alter table public.app_settings enable row level security;
alter table public.webhook_events enable row level security;

-- Permissions
grant select on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.calls to authenticated;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;
grant all on public.calls to service_role;
grant all on public.app_settings to service_role;
grant all on public.webhook_events to service_role;

-- RLS Policies
create policy "Users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins read all profiles" on public.profiles for select to authenticated using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));
create policy "Active users read calls" on public.calls for select to authenticated using (public.is_active_user(auth.uid()));

-- Enable Realtime
alter publication supabase_realtime add table public.calls;
```

✅ **Click करो "RUN"** (bottom right corner)

Success message aana chahiye: **"Success. No rows returned"**

### 2.3 Migration 2 - Security Fix
**Naya query banao aur ye run karo:**

```sql
-- Migration 2: Security Functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_active_user(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_active_user(uuid) to authenticated;
```

✅ **Click "RUN"**

### 2.4 Migration 3 - Stats Function
**Naya query banao:**

```sql
-- Migration 3: Dashboard Stats
create or replace function public.call_stats(_tz text default 'UTC')
returns json language sql stable security invoker as $$
  select json_build_object(
    'total_calls', (select count(*) from public.calls),
    'calls_today', (select count(*) from public.calls where (coalesce(started_at, created_at) at time zone _tz)::date = (now() at time zone _tz)::date),
    'total_duration', (select coalesce(sum(duration_seconds), 0) from public.calls),
    'total_cost', (select coalesce(sum(cost_usd), 0) from public.calls),
    'per_day', (
      select json_agg(json_build_object('day', d::date, 'count', (
        select count(*) from public.calls c where (coalesce(c.started_at, c.created_at) at time zone _tz)::date = d::date
      )) order by d)
      from generate_series((now() at time zone _tz)::date - 6, (now() at time zone _tz)::date, interval '1 day') d
    )
  )
$$;

revoke execute on function public.call_stats(text) from public, anon;
grant execute on function public.call_stats(text) to authenticated;
```

✅ **Click "RUN"**

### 2.5 Migration 4 - Knowledge Base
**Naya query banao:**

```sql
-- Migration 4: Knowledge Base
create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'general',
  tags text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_base_category_idx on public.knowledge_base (category);
create index knowledge_base_is_active_idx on public.knowledge_base (is_active);

grant select on public.knowledge_base to authenticated;
grant all on public.knowledge_base to service_role;

alter table public.knowledge_base enable row level security;

create policy "Active users read active knowledge" on public.knowledge_base 
  for select to authenticated using (public.is_active_user(auth.uid()) and is_active = true);

create policy "Admins read all knowledge" on public.knowledge_base 
  for select to authenticated using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create trigger knowledge_base_touch before update on public.knowledge_base 
  for each row execute function public.touch_updated_at();

-- Sample data
insert into public.knowledge_base (title, content, category) values
  ('Store Hours', 'Open Monday-Friday 9 AM to 6 PM EST', 'general'),
  ('Product Returns', 'Returns accepted within 30 days', 'support'),
  ('Shipping Info', 'Standard: 5-7 days, Express: 2-3 days', 'support');
```

✅ **Click "RUN"**

---

## Step 3: Local Environment Setup (2 min) 💻

### 3.1 .env File Banao
Terminal mein ya File Explorer se:

**Windows PowerShell:**
```powershell
cd d:\ai\pixel-perfect-pixels-main
notepad .env
```

**Ya File Explorer se:**
1. Project folder kholo: `d:\ai\pixel-perfect-pixels-main`
2. Right click → New → Text Document
3. Name rakho: `.env` (dot se shuru hona chahiye)

### 3.2 .env File Mein Ye Paste Karo
```env
# Supabase Configuration (Frontend - Public)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE

# Server-side (for SSR and build)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE

# IMPORTANT: Ab ye add mat karo, baad mein karenge
# VAPI_PRIVATE_KEY=
# VAPI_ASSISTANT_ID=
# VAPI_SERVER_SECRET=
# SUPABASE_SERVICE_ROLE_KEY=
```

### 3.3 Apni Keys Paste Karo
1. `YOUR_PROJECT` replace karo apne project URL se
2. `YOUR_ANON_KEY_HERE` replace karo anon key se
3. **Save karo** (Ctrl+S)

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 4: Server Restart (1 min) 🔄

### 4.1 Current Server Band Karo
Terminal mein:
```
Ctrl + C
```
(Ya mujhe bolo, main band kar dunga)

### 4.2 Naye Environment Variables ke saath Start Karo
```bash
npm run dev
```

Wait karo 5-10 seconds...

**Success message:**
```
VITE v8.1.5  ready in 5549 ms
➜  Local:   http://localhost:8080/
```

---

## Step 5: First Admin Account Banao (1 min) 👤

### 5.1 Browser Kholo
URL: http://localhost:8080/

### 5.2 Setup Screen Dikhega
**"Create the first admin"** screen dikhega

### 5.3 Details Bharo
```
Full Name: Aapka naam (e.g., "Raj Kumar")
Email: aapka@email.com
Password: koi strong password (min 8 characters)
```

### 5.4 Click: "Create admin account"

✅ **Success!** Automatically login ho jayega!

---

## Step 6: Dashboard Check Karo (1 min) ✅

### Ye Pages Check Karo:

1. **Dashboard** ✅
   - KPI cards dikhne chahiye (abhi 0 honge)
   - Chart dikhega
   - "No calls yet" message

2. **Calls** ✅
   - Empty state dikhega
   - "No calls yet" message

3. **Knowledge Base** ✅
   - 3 sample articles dikhne chahiye
   - Search box

4. **Users** ✅ (Admin only)
   - Aapka account dikhega
   - "Add user" button

5. **Settings** ✅ (Admin only)
   - "Not configured" dikhega (abhi Vapi connect nahi kiya)

---

## Step 7: Vapi.ai Setup (Optional - For Real Calls) 📞

### Agar Vapi se calls receive karni hain:

1. **Vapi Account Banao**: https://vapi.ai
2. **Assistant Banao** Vapi dashboard mein
3. **Keys Copy Karo**:
   - Private API Key
   - Assistant ID
4. **.env mein add karo**:
   ```env
   VAPI_PRIVATE_KEY=sk_live_xxxxx
   VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx
   VAPI_SERVER_SECRET=your_32char_secret
   SUPABASE_SERVICE_ROLE_KEY=service_role_key_from_supabase
   ```
5. **Server restart karo**

**Details:** `VAPI_SETUP.md` file mein complete guide hai

---

## ✅ Success Checklist

Ab ye sab kaam karna chahiye:

- [x] Dashboard loads
- [x] Login/Logout works
- [x] Dashboard shows KPI cards (0 values)
- [x] Calls page shows empty state
- [x] Knowledge Base shows 3 articles
- [x] Users page shows your account
- [x] Settings shows status
- [x] Sidebar navigation works
- [x] Mobile responsive works

---

## 🎉 Congratulations!

**Aapka AI Call Assistant Dashboard ab fully functional hai!**

### Test Karne Ke Liye:

1. **User Management Test:**
   - Users page par jao
   - "Add user" click karo
   - Naya user banao (viewer role)
   - Logout karke us user se login karo

2. **Knowledge Base Test:**
   - Knowledge Base page par jao
   - Articles search karo
   - View/Edit buttons check karo

3. **Mobile Test:**
   - Browser ko mobile size mein resize karo
   - Sidebar collapse hona chahiye
   - Responsive layout check karo

---

## 🆘 Troubleshooting

### Problem: "Missing Supabase environment variable"
**Solution:** `.env` file check karo, keys sahi paste kiye?

### Problem: "Cannot read properties of undefined"
**Solution:** Server restart karo (Ctrl+C, phir `npm run dev`)

### Problem: Database error
**Solution:** Supabase dashboard mein sab migrations run kiye?

### Problem: Login nahi ho raha
**Solution:** 
1. Email/password sahi hai?
2. Supabase dashboard → Authentication → Users check karo

---

## 📚 Next Steps

Sab kaam kar raha hai? Mubarak ho! 🎊

**Ab kya karein:**

1. **More users banao** - Team members ko access do
2. **Knowledge Base mein articles add karo**
3. **Vapi connect karo** (real calls ke liye)
4. **Production mein deploy karo** (Vercel/Netlify)

**Detailed guides:**
- Vapi Setup: `VAPI_SETUP.md`
- Deployment: `DEPLOYMENT.md`
- Development: `DEVELOPMENT.md`

---

**Agar koi problem aaye, mujhe batao! Main help karunga! 🚀**
