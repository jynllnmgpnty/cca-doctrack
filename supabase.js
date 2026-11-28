/**
 * CCA DocTrack - Supabase Client Configuration
 * Christ Centered Academy of Lipa City Inc.
 * 
 * Provides a reusable Supabase PostgreSQL client instance using @supabase/supabase-js.
 * Credentials are read securely from environment variables (SUPABASE_URL, SUPABASE_SECRET_KEY).
 * Keys are never hardcoded, exposed to the frontend, or printed to logs.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Checks if Supabase credentials are configured with valid (non-placeholder) values
 */
function isSupabaseConfigured() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return false;
  const isPlaceholderKey = 
    SUPABASE_SECRET_KEY === 'YOUR_NEW_SECRET_KEY' ||
    SUPABASE_SECRET_KEY.includes('your_supabase_secret_key') ||
    SUPABASE_SECRET_KEY.length < 20;

  const isPlaceholderUrl = 
    SUPABASE_URL.includes('your-project-ref');

  return !isPlaceholderKey && !isPlaceholderUrl;
}

/**
 * Initialize the Supabase client
 * Configured with auto-refresh false and persistSession false for server-side Node.js execution.
 */
let supabaseInstance = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    if (!SUPABASE_URL) {
      throw new Error('SUPABASE_URL environment variable is missing.');
    }
    // In server environment, secret/service_role key gives admin access to bypass RLS safely
    const key = SUPABASE_SECRET_KEY || 'dummy_key_for_init';
    supabaseInstance = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabaseInstance;
}

/**
 * Verify connectivity to Supabase PostgreSQL database
 */
async function checkSupabaseHealth() {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      mode: 'Supabase PostgreSQL (Unconfigured)',
      url: SUPABASE_URL,
      error: !SUPABASE_URL ? 'SUPABASE_URL environment variable is missing in .env.' : 'SUPABASE_SECRET_KEY contains placeholder or is missing in .env.'
    };
  }

  try {
    const client = getSupabaseClient();
    // Query document_requests with a lightweight head query or 1 record
    const { count, error } = await client
      .from('document_requests')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        mode: 'Supabase PostgreSQL',
        url: SUPABASE_URL,
        error: error.message
      };
    }

    return {
      connected: true,
      mode: 'Supabase PostgreSQL (Cloud)',
      url: SUPABASE_URL,
      recordCount: count !== null ? count : 0
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'Supabase PostgreSQL',
      url: SUPABASE_URL,
      error: err.message
    };
  }
}

module.exports = {
  getSupabaseClient,
  isSupabaseConfigured,
  checkSupabaseHealth,
  SUPABASE_URL
};
