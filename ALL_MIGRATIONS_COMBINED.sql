-- =====================================================
-- AI Call Assistant - Complete Database Setup
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- ============ MIGRATION 1: Core Tables ============

create type public.app_role as enum ('admin', 'viewer');

create table public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_user(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and is_active)
$$;

create policy "Users read own profile" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "Admins read all profiles" on public.profiles for select to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));
create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid());
create policy "Admins read all roles" on public.user_roles for select to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

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
create index calls_started_at_idx on public.calls (started_at desc);
create index calls_created_at_idx on public.calls (created_at desc);
create index calls_customer_number_idx on public.calls (customer_number);
create index calls_status_idx on public.calls (status);
grant select on public.calls to authenticated;
grant all on public.calls to service_role;
alter table public.calls enable row level security;
create policy "Active users read calls" on public.calls for select to authenticated
  using (public.is_active_user(auth.uid()));

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "Admins read settings" on public.app_settings for select to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  vapi_call_id text,
  event_type text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index webhook_events_created_at_idx on public.webhook_events (created_at desc);
grant select on public.webhook_events to authenticated;
grant all on public.webhook_events to service_role;
alter table public.webhook_events enable row level security;
create policy "Admins read webhook events" on public.webhook_events for select to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger calls_touch before update on public.calls for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();

-- New auth users get a profile; the very first user becomes admin, later ones viewer
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
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
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.calls;

-- ============ ADMIN SEEDING FUNCTION ============

-- Function to create default admin user
create or replace function public.create_default_admin() returns void language plpgsql security definer as $$
declare
  admin_user_id uuid;
  admin_email text := 'admin@example.com';
  admin_password text := 'admin123456';
  admin_name text := 'System Administrator';
begin
  -- Check if admin already exists
  select id into admin_user_id from auth.users where email = admin_email;
  
  if admin_user_id is not null then
    -- Admin already exists, ensure proper role
    insert into public.user_roles (user_id, role) 
    values (admin_user_id, 'admin')
    on conflict (user_id) do update set role = 'admin';
    return;
  end if;
  
  -- Create admin user in auth.users
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_user_meta_data, role, aud
  ) values (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('full_name', admin_name, 'role', 'admin'),
    'authenticated',
    'authenticated'
  ) returning id into admin_user_id;
  
  -- Create profile via trigger (handle_new_user will be called automatically)
  -- The trigger will create both profile and user_role with admin role
  
end $$;

-- ============ MIGRATION 2: Security Functions ============

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_active_user(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_active_user(uuid) to authenticated;

-- ============ MIGRATION 3: Dashboard Stats ============

create or replace function public.call_stats(_tz text default 'UTC')
returns json language sql stable security invoker set search_path = public as $$
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

-- ============ MIGRATION 4: Knowledge Base ============

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
create index knowledge_base_created_at_idx on public.knowledge_base (created_at desc);

grant select on public.knowledge_base to authenticated;
grant all on public.knowledge_base to service_role;

alter table public.knowledge_base enable row level security;

create policy "Active users can read active knowledge base articles" 
  on public.knowledge_base for select to authenticated
  using (public.is_active_user(auth.uid()) and is_active = true);

create policy "Admins can read all knowledge base articles" 
  on public.knowledge_base for select to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert knowledge base articles" 
  on public.knowledge_base for insert to authenticated
  with check (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update knowledge base articles" 
  on public.knowledge_base for update to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete knowledge base articles" 
  on public.knowledge_base for delete to authenticated
  using (public.is_active_user(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create trigger knowledge_base_touch 
  before update on public.knowledge_base 
  for each row execute function public.touch_updated_at();

-- Insert sample knowledge base articles
insert into public.knowledge_base (title, content, category, tags) values
  ('Company Hours', 'We are open Monday through Friday, 9 AM to 6 PM EST. Closed on weekends and major holidays.', 'general', ARRAY['hours', 'schedule']),
  ('Product Returns', 'Products can be returned within 30 days of purchase with original receipt. Items must be in original condition.', 'support', ARRAY['returns', 'policy']),
  ('Shipping Information', 'Standard shipping takes 5-7 business days. Express shipping available for 2-3 day delivery.', 'support', ARRAY['shipping', 'delivery']),
  ('Contact Support', 'For technical support, email support@example.com or call 1-800-SUPPORT. Average response time is 24 hours.', 'support', ARRAY['contact', 'help']);

-- =====================================================
-- Setup Complete! 
-- You can now create your first admin user!
-- =====================================================
