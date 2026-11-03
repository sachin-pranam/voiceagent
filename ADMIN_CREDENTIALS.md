# Default Admin Credentials

## Hardcoded Admin Access

### Default Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123456`
- **Role**: Administrator
- **Name**: System Administrator

### How to Access

1. **Direct Login**:
   - Go to `http://localhost:8080/login`
   - Use the credentials above
   - Or click "Fill Credentials" button on login page

2. **Admin Panel Access**:
   - After login, go to `http://localhost:8080/admin`
   - Or click "Admin Panel" in the sidebar

3. **Create Admin via API** (Development):
   ```bash
   # Create/ensure default admin exists
   curl "http://localhost:8080/api/admin/seed?action=create"
   
   # Get admin credentials info
   curl "http://localhost:8080/api/admin/seed?action=info"
   
   # Reset admin password to default
   curl "http://localhost:8080/api/admin/seed?action=reset"
   ```

### Database Setup

Run this SQL in Supabase to create the admin user manually:

```sql
-- Create admin user in auth.users table
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
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "System Administrator", "role": "admin"}'::jsonb,
  'authenticated',
  'authenticated'
) 
ON CONFLICT (email) DO NOTHING;

-- Get the created user ID
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
)
-- Create profile
INSERT INTO public.profiles (id, email, full_name, is_active)
SELECT id, 'admin@example.com', 'System Administrator', true
FROM admin_user
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active;

-- Create admin role
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM admin_user
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role;
```

### Security Notes

**⚠️ IMPORTANT for Production:**

1. **Change Default Password**: Never use default credentials in production
2. **Environment Variables**: Store admin credentials in environment variables
3. **Strong Passwords**: Use complex passwords (minimum 12 characters)
4. **Rotate Regularly**: Change admin passwords periodically

### Production Setup

For production, set these environment variables:

```env
# Override default admin credentials
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=your-strong-password-here
ADMIN_NAME=Your Admin Name
```

### Troubleshooting

**Issue: Cannot login with default credentials**
- Check if user exists in database
- Verify password is correct
- Check if user is active: `SELECT is_active FROM profiles WHERE email = 'admin@example.com'`

**Issue: "Admin Access Required" message**
- Check user role: `SELECT role FROM user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')`
- Ensure role is 'admin' not 'viewer'

**Issue: Need to reset admin**
- Use API endpoint: `GET /api/admin/seed?action=reset`
- Or run the SQL commands above

### Development Shortcuts

1. **Quick Admin Access**: Login page has "Fill Credentials" button
2. **API Endpoints**: Use `/api/admin/seed` for admin management
3. **Browser Console**: 
   ```javascript
   // Fill login form automatically
   document.querySelector('input[type="email"]').value = 'admin@example.com';
   document.querySelector('input[type="password"]').value = 'admin123456';
   ```

---

**Remember**: Always change default credentials in production environments!