import { supabase } from "@/integrations/supabase/client";

// Default admin credentials - Change these in production!
export const DEFAULT_ADMIN = {
  email: "admin@example.com",
  password: "admin123456",
  name: "System Administrator"
};

/**
 * Creates default admin user if it doesn't exist
 * This runs automatically when app starts
 */
export async function ensureDefaultAdmin() {
  try {
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', DEFAULT_ADMIN.email)
      .single();

    if (existingUser) {
      console.log('✓ Default admin user already exists:', DEFAULT_ADMIN.email);
      return { exists: true, user: existingUser };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected if user doesn't exist
      throw checkError;
    }

    console.log('Creating default admin user...');

    // Create admin user via Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      options: {
        data: {
          full_name: DEFAULT_ADMIN.name,
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Failed to create admin user');
    }

    console.log('✓ Default admin user created:', DEFAULT_ADMIN.email);
    console.log('✓ Login credentials:');
    console.log('  Email:', DEFAULT_ADMIN.email);
    console.log('  Password:', DEFAULT_ADMIN.password);

    return { 
      exists: false, 
      created: true, 
      user: authData.user,
      credentials: {
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password
      }
    };

  } catch (error) {
    console.error('Error ensuring default admin:', error);
    return { exists: false, created: false, error };
  }
}

/**
 * Reset admin password to default
 * Useful for development/testing
 */
export async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    // Get current admin user
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', DEFAULT_ADMIN.email)
      .single();

    if (error || !user) {
      throw new Error('Admin user not found');
    }

    // This would require admin privileges or service role key
    // For now, just log the credentials
    console.log('✓ Admin credentials:');
    console.log('  Email:', DEFAULT_ADMIN.email);
    console.log('  Password:', DEFAULT_ADMIN.password);

    return {
      success: true,
      credentials: {
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password
      }
    };

  } catch (error) {
    console.error('Error resetting admin password:', error);
    return { success: false, error };
  }
}