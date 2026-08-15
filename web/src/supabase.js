import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://usjeipxsrpplsjmabvei.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3Drqr2HBt4dqV3jRrLvhqw_-nKuMyw8';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase URL or ANON key not set in environment variables; using the project fallback values for preview/dev builds.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
