-- Run this in Supabase SQL Editor to make existing user admin

-- Option 1: Make first user admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Option 2: Make specific user admin (replace with actual email)
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);

-- Check current users and roles
SELECT 
  u.email,
  ur.role,
  p.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at;