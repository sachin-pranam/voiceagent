-- Create admin user manually in Supabase
-- Run this in Supabase SQL Editor

-- First, let's create the admin user in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud,
  confirmation_token,
  email_confirmed_at,
  invited_at,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  jsonb_build_object('full_name', 'System Administrator'),
  'authenticated',
  'authenticated',
  '',
  now(),
  null,
  null,
  '',
  null,
  '',
  '',
  null,
  null,
  '{}',
  false,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- The trigger handle_new_user will automatically create:
-- 1. Profile in public.profiles
-- 2. Admin role in public.user_roles

-- Verify the user was created
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.is_active,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@example.com';