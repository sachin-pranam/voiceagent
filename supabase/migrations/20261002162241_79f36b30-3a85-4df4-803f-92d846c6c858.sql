# पूरी Setup Guide - सब काम करने के लिए

## ✅ Step 1: Supabase Account Banao (FREE)

### 1. Supabase Par Jao
- Website: https://supabase.com
- Click करो "Start your project" या "Sign up"
- GitHub से login karo (recommended) ya email se

### 2. New Project Banao
1. Click करो "New Project"
2. Organization select करो (ya naya banao)
3. Project details bharo:
   - **Name:** `ai-call-assistant` (ya koi bhi naam)
   - **Database Password:** Strong password (save kar lena!)
   - **Region:** Apne paas ka region (e.g., `Mumbai` ya `Singapore`)
4. Click करो "Create new project"
5. **Wait करो 2-3 minutes** - Database setup ho raha hai

### 3. Project Keys Copy Karo
1. Left sidebar mein jao **Settings** → **API**
2. Yeh 2 keys copy karo:
   - ✅ **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - ✅ **anon public key** (starts with `eyJhbG...`)
3. Inhe safe jagah save karo (notepad mein)

---

## ✅ Step 2: Database Setup (5 minutes)

### 1. SQL Editor Kholo
- Left sidebar → **SQL Editor**
- Click करो "New query"

### 2. Migrations Run Karo (Ek-ek karke)

**First Migration:**
```sql
-- File 1: Copy paste karo ye pura SQL
```

File location: `supabase/migrations/20261002162241_79f36b30-3a85-4df4-803f-92d846c6c858.sql`

Main isko read karke copy paste ke liye ready karta hoon:

<function_calls>
<invoke name="read_file">
<parameter name="explanation">Reading first migration to help user set it up