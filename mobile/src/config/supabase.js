import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '%%SUPABASE_URL%%';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '%%SUPABASE_ANON_KEY%%';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or ANON key not set in environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
