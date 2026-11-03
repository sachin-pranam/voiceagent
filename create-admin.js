#!/usr/bin/env node

/**
 * Script to create default admin user
 * Usage: node create-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123456',
  name: 'System Administrator'
};

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDefaultAdmin() {
  try {
    console.log('🔍 Checking if admin user already exists...');
    
    // Check if admin exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', DEFAULT_ADMIN.email)
      .single();

    if (existingUser && !checkError) {
      console.log('✅ Admin user already exists:', DEFAULT_ADMIN.email);
      console.log('📧 Email:', DEFAULT_ADMIN.email);
      console.log('🔑 Password:', DEFAULT_ADMIN.password);
      return;
    }

    console.log('👤 Creating default admin user...');

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      email_confirm: true,
      user_metadata: {
        full_name: DEFAULT_ADMIN.name,
        role: 'admin'
      }
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation returned no user data');
    }

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🎉 Admin Credentials:');
    console.log('   📧 Email:', DEFAULT_ADMIN.email);
    console.log('   🔑 Password:', DEFAULT_ADMIN.password);
    console.log('   👤 Name:', DEFAULT_ADMIN.name);
    console.log('   🆔 ID:', authData.user.id);
    console.log('');
    console.log('🌐 Login URLs:');
    console.log('   🖥️  Main App:', 'http://localhost:8080/login');
    console.log('');
    console.log('⚠️  IMPORTANT: Change these credentials in production!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the function
createDefaultAdmin();

export { DEFAULT_ADMIN };